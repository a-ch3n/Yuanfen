import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "yuanfen — sms matchmaking",
  description:
    "a quieter way to date. no endless browsing. no noisy app. just one intentional text when the match feels right.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
