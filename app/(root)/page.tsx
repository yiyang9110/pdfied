import Navbar from "@/components/Navbar";
import { LibraryHero } from "@/components/LibraryHero";
import { sampleBooks } from "@/lib/constants";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/actions/book.actions";

const Page = async () => {
  const bookResults = await getAllBooks();

  if (!bookResults.success) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="wrapper container">
          <LibraryHero />
          <p>Unable to load books right now. Please try again later.</p>
        </main>
      </div>
    );
  }

  const books = bookResults.data ?? []

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
