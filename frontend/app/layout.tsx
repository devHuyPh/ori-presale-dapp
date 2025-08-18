// frontend/app/layout.tsx
import "./globals.css";
import Providers from "./providers";

export const metadata = { title: "ORI Presale" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="border-b border-white/10">
            <div className="container py-4 flex items-center justify-between">
              <a href="/" className="font-bold">ORI Presale</a>
              <nav className="flex gap-4 text-sm">
                <a href="/presale" className="opacity-80 hover:opacity-100">Buy</a>
                <a href="/affiliate" className="opacity-80 hover:opacity-100">Affiliate</a>
              </nav>
            </div>
          </header>
          <main className="container py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
