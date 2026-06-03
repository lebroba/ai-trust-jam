import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Trust Jam",
  description: "A lightweight 3-12-3 brainstorming platform for AI Trust workshops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
