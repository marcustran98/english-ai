import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI English MVP",
  description: "Speaking trainer MVP with AI feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <header className="siteHeader">
          <div className="container headerInner">
            <Link className="brand" href="/">
              AI English
            </Link>
            <nav className="nav">
              <Link href="/speaking">Speaking</Link>
              <Link href="/grammar">Grammar</Link>
              <Link href="/flashcards">Flashcards</Link>
            </nav>
          </div>
        </header>
        <main className="container main">{children}</main>
      </body>
    </html>
  );
}
