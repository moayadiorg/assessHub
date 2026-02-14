import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <AuthProvider>
          <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
            <MainLayout>{children}</MainLayout>
          </Theme>
        </AuthProvider>
      </body>
    </html>
  );
}
