import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Prova de Programação',
  description: 'Crie seus próprios problemas de programação e casos de teste práticos na nossa IDE.',
};

export default function CreateProgrammingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
