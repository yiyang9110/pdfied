"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const SEARCH_DEBOUNCE_MS = 350;

const LibrarySearch = ({ initialQuery }: { initialQuery: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const currentQuery = searchParams.get("q")?.trim() ?? "";
      const nextQuery = query.trim();

      if (currentQuery === nextQuery) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (nextQuery) {
        params.set("q", nextQuery);
      } else {
        params.delete("q");
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

      startTransition(() => {
        router.replace(nextUrl);
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, query, router, searchParams, startTransition]);

  return (
    <div className="library-search-wrapper shadow-soft-sm">
      <label htmlFor="home-book-search" className="sr-only">
        Search books
      </label>
      <span className="pl-4 text-[var(--text-secondary)]">
        <Search className="size-4" />
      </span>
      <input
        id="home-book-search"
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search title or author"
        className="library-search-input"
      />
      {query.trim() ? (
        <Link
          href={pathname}
          className="mr-2 inline-flex size-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Link>
      ) : null}
    </div>
  );
};

export default LibrarySearch;
