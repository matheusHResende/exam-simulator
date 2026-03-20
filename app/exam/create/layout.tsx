import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Simulado de Questões | Simulador de Provas',
  description: 'Monte questões de múltipla escolha do zero, defina gabarito e exporta em CSV pronto para usar no simulador.',
};

export default function CreateExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
