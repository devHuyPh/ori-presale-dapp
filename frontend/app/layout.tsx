import "./globals.css";
import Providers from "./providers";
import Connect from "@/components/Connect";
import ClientOnly from "@/components/ClientOnly";

export const metadata = { title: "ORI Presale" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>
          <header className="border-b border-white/10">
            <div className="container py-4 flex items-center justify-between">
              <a href="/" className="font-bold">ORI Presale</a>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/presale">Buy</a>
                <a href="/affiliate">Affiliate</a>
                <ClientOnly><Connect /></ClientOnly>
              </nav>
            </div>
          </header>
          <main className="container py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
