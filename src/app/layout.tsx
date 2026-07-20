import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoChat Games - Subscribe",
  description: "Confirm your mobile number to subscribe to GoChat Games.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
