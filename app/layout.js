import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'QMS — Queue Management System',
  description: 'Smart hospital queue management',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif',
        minHeight: '100vh'
      }}>
        {children}
      </body>
    </html>
  );
}