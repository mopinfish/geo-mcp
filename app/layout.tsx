import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Geo MCP Server',
  description: 'Model Context Protocol server with geospatial data support',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
