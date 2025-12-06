// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'What Should I Drink?',
  description: 'Luxurious drink suggestions — black & gold theme',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="topbar" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(180deg,#111,#0b0b0b)", border: "1px solid rgba(212,175,55,0.12)"
              }}>
                <div style={{ color: "#d4af37", fontWeight: 800, fontFamily: "Cinzel, serif", fontSize: 18 }}>WSD</div>
              </div>
              <div style={{ lineHeight: 1 }}>
                <div className="h1">What Should I Drink?</div>
                <div className="small">Fancy suggestions & drinks — black & gold theme</div>
              </div>
            </div>
            <div className="nav-actions">
              {/* optional global actions */}
              <a style={{ color: "var(--gold)" }} href="https://github.com/Jcksnhrmn/what-should-i-drink" target="_blank" rel="noreferrer">Repo</a>
            </div>
          </header>

          <main>
            {children}
          </main>

          <footer style={{ marginTop: 28, color: "var(--muted)" }} className="center">
            Built for class • Demo persistence via JSON files on server
          </footer>
        </div>
      </body>
    </html>
  );
}
