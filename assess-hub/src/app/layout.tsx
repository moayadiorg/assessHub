import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import { MainLayout } from "@/components/layout/MainLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AssessHub - Customer Maturity Assessments",
  description: "Conduct customer maturity assessments based on the CMM framework",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
          <MainLayout>{children}</MainLayout>
        </Theme>
      </body>
    </html>
  );
}
