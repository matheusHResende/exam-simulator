import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Simulador de Provas e Programação',
    template: '%s | Simulador de Provas',
  },
  description: 'Pratique questões de concurso e resolva problemas de programação no melhor simulador online gratuito. Acesse simulados, gabaritos e IDE online.',
  keywords: ['simulador de provas', 'concurso público', 'questões de concurso', 'programação', 'IDE online', 'testes de código', 'python', 'simulado online'],
  authors: [{ name: 'Matheus Resende' }],
  creator: 'Matheus Resende',
  openGraph: {
    title: 'Simulador de Provas e Programação',
    description: 'Pratique questões de concurso e resolva problemas de programação gratuitamente.',
    url: 'https://exam-simulator.vercel.app',
    siteName: 'Simulador de Provas',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulador de Provas e Programação',
    description: 'Pratique questões de concurso e resolva problemas de programação gratuitamente.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
