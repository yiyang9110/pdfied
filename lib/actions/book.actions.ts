"use server";

import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, IBook, TextSegment } from "@/types";
import { generateSlug } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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
  try {
    const { userId } = await auth();

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

    await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

    return {
      success: true,
      data: { segmentsCreated: segments.length },
    };
  } catch (error) {
    console.error("Error saving book segments", error);

    await BookSegment.deleteMany({ book: bookId });
    await Book.findByIdAndDelete(bookId);

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
