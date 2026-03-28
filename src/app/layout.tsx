import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const manrope = localFont({
  src: '../../public/fonts/Manrope-VariableFont_wght.ttf',
  variable: '--font-manrope',
  display: 'swap',
});

const firaCode = localFont({
  src: '../../public/fonts/FiraCode-Regular.ttf',
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tivra — Prompt to Production SaaS',
  description: 'Launch production-ready SaaS from a single prompt.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${firaCode.variable}`}>
      <body className="min-h-screen bg-[#06060a] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
