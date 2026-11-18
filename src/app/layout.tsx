import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import ShellLayout from "@/components/layout/shell-layout";
import { CfcToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-cfc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crédit Foncier du Cameroun | Épargne Habitat & Guichet Unique",
  description: "Plateforme officielle de la campagne Épargne Habitat et du Guichet Unique dématérialisé du Crédit Foncier du Cameroun (CFC).",
  icons: {
    icon: "/favicon.ico",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ShellLayout>{children}</ShellLayout>
            <CfcToaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
