"use server";

import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, IBook, TextSegment } from "@/types";
import { generateSlug } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserPlanContext } from "../plan.server";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const checkBookExists = async (title: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        exists: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();
    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug, clerkId: userId }).lean();

    if (!existingBook) {
      return {
        exists: false,
      };
    }

    return {
      exists: true,
      book: JSON.parse(JSON.stringify(existingBook)),
    };
  } catch (error) {
    console.error("Error checking if book exists", error);

    return {
      exists: false,
      error,
    };
  }
};

export const getBookUploadEligibility = async (title: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const slug = generateSlug(title);
    const existingBook = await Book.findOne({ slug, clerkId: userId }).lean();

    if (existingBook) {
      return {
        success: true,
        canUpload: false,
        alreadyExists: true,
        book: JSON.parse(JSON.stringify(existingBook)) as IBook,
      };
    }

    const { plan, limits } = await getUserPlanContext();
    const currentBookCount = await Book.countDocuments({ clerkId: userId });

    if (currentBookCount >= limits.maxBooks) {
      return {
        success: true,
        canUpload: false,
        limitReached: true,
        plan,
        error: `Your ${limits.name} plan allows up to ${limits.maxBooks} book${limits.maxBooks === 1 ? "" : "s"}. Upgrade to add more.`,
      };
    }

    return {
      success: true,
      canUpload: true,
    };
  } catch (error) {
    console.error("Error checking book upload eligibility", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const createBook = async (data: CreateBook) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug, clerkId: userId }).lean();

    if (existingBook) {
      return {
        success: true,
        data: JSON.parse(JSON.stringify(existingBook)),
        alreadyExists: true,
      };
    }

    const { plan, limits } = await getUserPlanContext();
    const currentBookCount = await Book.countDocuments({ clerkId: userId });

    if (currentBookCount >= limits.maxBooks) {
      return {
        success: false,
        limitReached: true,
        plan,
        error: `Your ${limits.name} plan allows up to ${limits.maxBooks} book${limits.maxBooks === 1 ? "" : "s"}. Upgrade to add more.`,
      };
    }

    const book = await Book.create({
      ...data,
      clerkId: userId,
      slug,
      totalSegments: 0,
    });

    revalidatePath("/");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(book)),
    };
  } catch (error) {
    console.error("Error creating a book", error);

    return {
      success: false,
      error,
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  segments: TextSegment[],
) => {
  const { userId } = await auth();

  try {
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId: userId,
        bookId,
        segmentIndex,
        pageNumber,
        content: text,
        wordCount,
      }),
    );

    await BookSegment.insertMany(segmentsToInsert);

    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, clerkId: userId },
      { totalSegments: segments.length },
    );

    if (!updatedBook) {
      await BookSegment.deleteMany({ bookId, clerkId: userId });

      return {
        success: false,
        error: "Book not found or unauthorized",
      };
    }

    return {
      success: true,
      data: { segmentsCreated: segments.length },
    };
  } catch (error) {
    console.error("Error saving book segments", error);

    await BookSegment.deleteMany({ bookId, clerkId: userId });

    const deletedBook = await Book.findOneAndDelete({
      _id: bookId,
      clerkId: userId,
    });

    if (!deletedBook) {
      return {
        success: false,
        error: "Book not found or unauthorized",
      };
    }

    return {
      success: false,
      error,
    };
  }
};

export const getAllBooks = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const books = await Book.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(books)) as IBook[],
    };
  } catch (error) {
    console.error("Error getting all books", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const searchBooks = async (query: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const trimmedQuery = query.trim();
    const filter = trimmedQuery
      ? {
          clerkId: userId,
          $or: [
            { title: { $regex: new RegExp(escapeRegex(trimmedQuery), "i") } },
            { author: { $regex: new RegExp(escapeRegex(trimmedQuery), "i") } },
          ],
        }
      : { clerkId: userId };

    const books = await Book.find(filter).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(books)) as IBook[],
    };
  } catch (error) {
    console.error("Error searching books", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const deleteBook = async (bookId: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const book = await Book.findOneAndDelete({ _id: bookId, clerkId: userId }).lean();

    if (!book) {
      return {
        success: false,
        error: "Book not found or unauthorized",
      };
    }

    await BookSegment.deleteMany({ bookId, clerkId: userId });

    const blobKeys = [book.fileBlobKey, book.coverBlobKey].filter(
      (value): value is string => Boolean(value),
    );

    if (blobKeys.length > 0) {
      try {
        await del(blobKeys);
      } catch (blobError) {
        console.error("Error deleting book blobs", blobError);
      }
    }

    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting book", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const book = await Book.findOne({ slug, clerkId: userId }).lean();

    if (!book) {
      return {
        success: false,
        error: "Book not found",
      };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(book)) as IBook,
    };
  } catch (error) {
    console.error("Error getting book by slug", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Trust boundary: no auth inside this function. Callers are responsible for
// authorizing access to `bookId` — today the only caller is the Vapi webhook,
// which verifies a shared secret before invoking this.
export const searchBookSegments = async (
  bookId: string,
  query: string,
  limit: number = 3,
) => {
  try {
    await connectToDatabase();

    const segments = await BookSegment.find(
      { bookId, $text: { $search: query } },
      { content: 1, _id: 0, score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: segments,
    };
  } catch (error) {
    console.error("Error searching book segments", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
