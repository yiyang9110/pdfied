"use client";

import { deleteBook } from "@/lib/actions/book.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { FC, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverURL: string;
  slug: string;
}

const BookCard: FC<BookCardProps> = ({ id, title, author, coverURL, slug }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteBook(id);

    if (!result.success) {
      setIsDeleting(false);
      toast.error(
        typeof result.error === "string" ? result.error : "Failed to delete book",
      );
      return;
    }

    setConfirmOpen(false);
    toast.success("Book deleted");
    router.refresh();
  };

  return (
    <article className="book-card relative">
      <Link href={`/books/${slug}`} className="absolute inset-0 z-10" aria-label={`Open ${title}`} />
      <div className="absolute right-3 top-3 z-20" ref={menuRef}>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="bg-white/95 shadow-soft-sm"
          onClick={() => setMenuOpen((current) => !current)}
          disabled={isDeleting}
          aria-label={`Manage ${title}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>

        {menuOpen ? (
          <div className="absolute right-0 mt-2 min-w-32 rounded-xl border border-[var(--border-subtle)] bg-white p-1 shadow-soft-md">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              disabled={isDeleting}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <figure className="book-card-figure">
          <div className="book-card-cover-wrapper">
            <Image
              src={coverURL}
              alt={title}
              width={133}
              height={200}
              className="book-card-cover"
            />
          </div>
        </figure>
        <figcaption className="book-card-meta">
          <h3 className="book-card-title">{title}</h3>
          <p className="book-card-author">{author}</p>
        </figcaption>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the book from your library and delete its conversation data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Book"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

export default BookCard;
