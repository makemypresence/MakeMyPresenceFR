import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "MakeMyPresence"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#191c1e] text-white">{children}</body>
    </html>
  );
}
