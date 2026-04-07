import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class chatbot",
  description: "Pretrained LLM chat UI (class project)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
