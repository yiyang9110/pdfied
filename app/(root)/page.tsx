import { LibraryHero } from "@/components/LibraryHero";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { Lock } from "lucide-react";

const Page = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="wrapper container">
          <LibraryHero />
          <div className="mt-12 flex flex-col items-center justify-center p-12 bg-[#f3e4c7] rounded-2xl border border-[var(--border-subtle)] shadow-soft text-center max-w-2xl mx-auto">
            <div className="bg-white p-4 rounded-full shadow-soft mb-6">
              <Lock className="size-8 text-[var(--text-primary)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] font-serif mb-3">
              Your Library is Locked
            </h2>
            <p className="text-[var(--text-secondary)] text-lg mb-8 leading-relaxed">
              Please sign in to view your personal library and start chatting with your books.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const bookResults = await getAllBooks();

  if (!bookResults.success) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="wrapper container">
          <LibraryHero />
          <div className="mt-12 text-center p-12 bg-white rounded-2xl border border-[var(--border-subtle)] shadow-soft max-w-2xl mx-auto">
            <p className="text-lg text-[var(--text-secondary)]">
              Unable to load your books right now. Please try again later.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const books = bookResults.data ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="wrapper container">
        <LibraryHero />
        <div className="library-books-grid">
          {books.map((book) => {
            return (
              <BookCard
                key={book._id}
                title={book.title}
                author={book.author}
                coverURL={book.coverURL}
                slug={book.slug}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Page;
