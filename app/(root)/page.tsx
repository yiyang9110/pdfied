import Navbar from "@/components/Navbar";
import { LibraryHero } from "@/components/LibraryHero";
import { sampleBooks } from "@/lib/constants";
import BookCard from "@/components/BookCard";

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="wrapper container">
        <LibraryHero />
        <div className="library-books-grid">
          {sampleBooks.map((book) => {
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
