
import './globals.css';

export const metadata = {
  title: 'Narrekappe Training Platform',
  description: 'Narrekappe B.V. training platform concept',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="theme-dark">
        {children}
      </body>
    </html>
  );
}
