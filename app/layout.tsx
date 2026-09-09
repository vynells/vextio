import type { Metadata } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { EditModeProvider } from "@/components/EditModeContext";
import AdminBar from "@/components/AdminBar";

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Vextio — Vintage Inspired Clothing",
  description:
    "Timeless silhouettes reborn for the modern wardrobe. Heritage fabrics, handcrafted pieces, small batch production.",
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
