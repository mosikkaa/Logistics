import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Logistics CMS", template: "%s · Logistics CMS" },
  description: "Driver database for logists",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
