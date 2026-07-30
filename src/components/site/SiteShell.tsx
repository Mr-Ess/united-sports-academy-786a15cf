import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { type ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
      <Footer />
      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}
