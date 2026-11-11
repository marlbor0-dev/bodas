import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bodas de Prata | 19 de dezembro de 2026',
  description: '25 anos de amor. 19 de dezembro de 2026, às 19h30, no Oliveira Eventos, em Goiânia.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
