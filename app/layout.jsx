import "./globals.css";

export const metadata = {
  title: "Larder · Delivery check",
  description: "Match supplier invoices to what actually arrived, and draft credit requests.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f5f2" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
