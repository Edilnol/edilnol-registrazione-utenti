import type { Metadata, Viewport } from "next";
import "./globals.css";
import OrientationWrapper from "@/components/OrientationWrapper";
import { Suspense } from "react";
import EdilnolLogo from "@/components/EdilnolLogo";

export const metadata: Metadata = {
  title: "Edilnol - Registrazione",
  description: "Registrazione utenti showroom",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <body className="h-full" tabIndex={0}>
        <Suspense>
          <OrientationWrapper>
            <div className="min-h-full flex flex-col">
              <header className="px-6 py-4 md:px-10 md:py-6">
                <div className="mx-auto w-full max-w-xl">
                  <EdilnolLogo className="text-white h-10 md:h-16" />
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </OrientationWrapper>
        </Suspense>
      </body>
    </html>
  );
}
