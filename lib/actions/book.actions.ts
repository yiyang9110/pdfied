"use server";

import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();
    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (!existingBook) {
      return {
        exists: false,
      }
    }

    return {
      exists: true,
      book: JSON.parse(JSON.stringify(existingBook)),
    }
  } catch (error) {
    console.error("Error checking if book exists", error);

    return {
      exists: false,
      error,
    }
  }
}

export const createBook = async (data: CreateBook) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        success: true,
        data: JSON.parse(JSON.stringify(existingBook)),
        alreadyExists: true,
      }
    }

    const book = await Book.create({ ...data, slug, totalSegments: 0 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(book)),
    }

  } catch (error) {
    console.error("Error creating a book", error);

    return {
      success: false,
      error,
    };
  }
};

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
  try {
    await connectToDatabase();

    const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
      clerkId,
      bookId,
      segmentIndex,
      pageNumber,
      content: text,
      wordCount
    }));

    await BookSegment.insertMany(segmentsToInsert);

    await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

    return {
      success: true,
      data: { segmentsCreated: segments.length }
    }

  } catch (error) {
    console.error('Error saving book segments', error);

    await BookSegment.deleteMany({ book: bookId });
    await Book.findByIdAndDelete(bookId);

    return {
      success: false,
      error,
    }
  }
}
