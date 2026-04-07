import type { Metadata } from "next";
import "./globals.css";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";

export const metadata: Metadata = {
  title: "Rental Tracker",
  description: "Shared rental tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CurrentUserProvider>{children}</CurrentUserProvider>
      </body>
    </html>
  );
}