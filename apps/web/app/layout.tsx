import './globals.css';

export const metadata = {
  title: 'Project Control',
  description: 'Construction project controls dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
