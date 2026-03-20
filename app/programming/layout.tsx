import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Provas de Programação',
  description: 'Resolva problemas de programação, escreva código em Python e teste sua lógica com nossa IDE online.',
};

export default function ProgrammingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
