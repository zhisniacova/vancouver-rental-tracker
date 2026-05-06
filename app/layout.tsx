import type { Metadata } from "next";
import "./globals.css";
import AuthSessionBridge from "@/components/AuthSessionBridge";
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
        <CurrentUserProvider>
          <AuthSessionBridge />
          {children}
        </CurrentUserProvider>
      </body>
    </html>
  );
}
