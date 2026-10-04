import type { Metadata } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { EditModeProvider } from "@/components/EditModeContext";
import AdminBar from "@/components/AdminBar";

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Vextio — Punk & Y2K Clothing",
  description:
    "Small-batch punk and Y2K clothing from Pakistan. Cash on delivery nationwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${anton.variable} ${dmSans.variable} font-body bg-cream text-brown antialiased`}
      >
        <EditModeProvider>
          <CartProvider>
            {children}
            <AdminBar />
          </CartProvider>
        </EditModeProvider>
      </body>
    </html>
  );
}
