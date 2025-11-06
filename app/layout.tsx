import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "McDonald's AI Agent",
  description: "Chat with a helpful McDonald's agent for menu, nutrition, deals, and more.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">
              <span className="arches" aria-hidden>??</span>
              <span className="brand-text">McDonald's AI Agent</span>
            </div>
            <nav className="nav-actions">
              <a className="link" href="https://www.mcdonalds.com" target="_blank" rel="noreferrer">Official Site</a>
            </nav>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">
            <div>Not affiliated with McDonald's. For the most accurate info, use the official app.</div>
          </footer>
        </div>
      </body>
    </html>
  );
}
