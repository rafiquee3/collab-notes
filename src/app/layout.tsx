import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/Providers/AuthProvider";
import { TrpcProvider } from "@/Providers/TrpcProvider";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollabNotes | Studio",
  description: "A collaborative workspace for modern ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${inter.variable} font-sans antialiased`}
      >

        <AuthProvider>
          <TrpcProvider>{children}</TrpcProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
