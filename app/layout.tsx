import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATLAS Bank — Your Future. Our Priority.",
  description: "A clearer, more confident way to manage your money. Discover ATLAS digital banking.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}