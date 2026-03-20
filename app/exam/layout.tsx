import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Questões Múltipla Escolha',
  description: 'Simulador de questões de múltipla escolha para concursos públicos.',
};

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
