"use client";
import { cn } from "@/lib/utils";
import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Library", href: "/" },
  { label: "Add New", href: "/books/new" },
  { label: "Pricing", href: "/pricing" },
];

const Navbar = () => {
  const pathName = usePathname();
  const { user } = useUser();

  return (
    <header className="w-full fixed z-50 bg-('--bg-primary') px-6">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-0.5 items-center">
          <span className="logo-text">PDFied</span>
        </Link>

        <nav className="w-fit flex gap-7.5 items-center">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathName === href || (href !== "/" && pathName.startsWith(href));

            return (
              <Link
                href={href}
                key={label}
                className={cn(
                  "nav-link-base",
                  isActive ? "nav-link-active" : "text-black hover:opacity-70",
                )}
              >
                {label}
              </Link>
            );
          })}
          <div className="flex gap-7.5 items-center">
            <Show when="signed-out">
              <SignInButton />
            </Show>
            <Show when="signed-in">
              {user?.firstName && (
                <Link href="/pricing" className="nav-user-name">
                  {user.firstName}
                </Link>
              )}
              <UserButton />
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
