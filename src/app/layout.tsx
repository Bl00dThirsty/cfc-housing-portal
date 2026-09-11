import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ShellLayout from "@/components/layout/shell-layout";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crédit Foncier du Cameroun | Épargne Habitat & Guichet Unique",
  description: "Plateforme officielle de la campagne Épargne Habitat et du Guichet Unique dématérialisé du Crédit Foncier du Cameroun (CFC).",
  icons: {
    icon: "/images/logo-cfc.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased min-h-full flex flex-col bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
