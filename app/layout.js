
import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Narrekappe Training Platform',
  description: 'Narrekappe B.V. training platform concept',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
