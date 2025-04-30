import type { Metadata } from "next";
import { Geist, Geist_Mono, Lilita_One } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lalitaOne = Lilita_One({
  variable: "--font-lalita-one",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Drawnew",
	icons: {
		icon: "/favicon.svg",
	},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lalitaOne.variable} antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  );
}
