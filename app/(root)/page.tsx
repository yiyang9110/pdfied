import { LibraryHero } from "@/components/LibraryHero";
import LibrarySearch from "@/components/LibrarySearch/LibrarySearch";
import BookCard from "@/components/BookCard";
import { searchBooks } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
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
              Please sign in to view your personal library and start chatting
              with your books.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { q = "" } = await searchParams;
  const searchQuery = q.trim();
  const bookResults = await searchBooks(searchQuery);

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
        <section className="mt-12 mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] font-serif">
              Recent Books
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Search by title or author.
            </p>
          </div>

          <LibrarySearch key={searchQuery} initialQuery={searchQuery} />
        </section>

        {books.length === 0 ? (
          <div className="library-empty-card text-center shadow-soft-sm">
            <h3 className="text-2xl font-semibold text-[var(--text-primary)] font-serif">
              {searchQuery ? "No matching books found" : "No books yet"}
            </h3>
            <p className="mt-3 text-[var(--text-secondary)]">
              {searchQuery
                ? `No books matched "${searchQuery}" by title or author.`
                : "Upload your first book to start your library."}
            </p>
          </div>
        ) : (
        <div className="library-books-grid">
          {books.map((book) => {
            return (
              <BookCard
                key={book._id}
                id={book._id}
                title={book.title}
                author={book.author}
                coverURL={book.coverURL}
                slug={book.slug}
              />
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
};

export default Page;
