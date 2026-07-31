import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { ClientLayout } from "@/components/layout/client-layout";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "FM Watcher - LINE Bank Notification Listener",
  description: "Automated payment listener and webhook dispatcher integrated with LINE Official Accounts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <ClientLayout>{children}</ClientLayout>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
