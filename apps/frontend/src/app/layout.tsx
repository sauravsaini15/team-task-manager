import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AppProviders } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Team Task Manager",
  description: "Collaborative project and task management dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="teamtask-theme">
          <AppProviders>{children}</AppProviders>
          <Toaster richColors theme="system" position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
