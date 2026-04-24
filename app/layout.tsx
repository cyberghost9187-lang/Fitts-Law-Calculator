import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FittsLab — Fitts's Law Calculator for Designers",
  description: "Calculate movement time, difficulty ratings, compare design scenarios, and get actionable UX suggestions using Fitts's Law.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
