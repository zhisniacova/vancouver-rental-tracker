import type { Metadata } from "next";
import "./globals.css";
import AuthSessionBridge from "@/components/AuthSessionBridge";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";
import FeedbackButton from "@/components/FeedbackButton";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";

export const metadata: Metadata = {
  title: "Rental Search Tracker",
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
          <WorkspaceProvider>
            <AuthSessionBridge />
            {children}
            <FeedbackButton />
          </WorkspaceProvider>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
