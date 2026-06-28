import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Musaffa Country Knowledge Base",
  description: "KYC and funding knowledge base for Musaffa supported countries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-musaffa-600 text-sm font-bold text-white">
                  M
                </div>
                <div className="leading-tight">
                  <span className="block text-sm font-semibold text-slate-900">
                    Musaffa Country KB
                  </span>
                  <span className="block text-xs text-slate-500">
                    KYC &amp; Funding
                  </span>
                </div>
              </Link>
              <nav className="flex items-center gap-4 text-sm text-slate-600">
                <Link href="/" className="hover:text-musaffa-700">
                  Dashboard
                </Link>
                <AuthHeader />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
