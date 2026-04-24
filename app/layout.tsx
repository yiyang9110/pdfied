import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { IBM_Plex_Serif, Mona_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ui } from "@clerk/ui";
import { Toaster } from "@/components/ui/sonner";

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pdfied",
  description:
    "Transform your pdf into interactive AI conversations. Upload PDFs, and start chatting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider ui={ui}>
      <html
        lang="en"
        className={`${ibmPlexSerif.variable} ${monaSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <Navbar />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
