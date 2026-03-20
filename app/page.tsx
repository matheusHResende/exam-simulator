import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Code2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Início | Simulador de Provas e Programação',
  description: 'Bem-vindo ao simulador de provas. Escolha entre simulador de questões e provas de programação.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center mb-12">
        <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4">
          Simulador de Provas
        </h1>
        <p className="text-slate-500 text-lg leading-relaxed">
          Escolha o tipo de simulado que deseja praticar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* Exam card */}
        <Link
          href="/exam"
          className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-indigo-50 group-hover:bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
            <BookOpen className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
            Simulador de Questões
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Carregue um arquivo CSV e pratique questões de múltipla escolha com gabarito e histórico de desempenho.
          </p>
          <span className="mt-6 inline-block bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-black px-5 py-2 rounded-full transition-colors">
            Iniciar →
          </span>
        </Link>

        {/* Programming card */}
        <Link
          href="/programming"
          className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-violet-400 hover:shadow-xl hover:shadow-violet-100 transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-violet-50 group-hover:bg-violet-600 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
            <Code2 className="w-8 h-8 text-violet-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 group-hover:text-violet-700 transition-colors">
            Prova de Programação
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Carregue um arquivo JSON com problemas de programação e navegue pelos enunciados e casos de teste.
          </p>
          <span className="mt-6 inline-block bg-violet-600 group-hover:bg-violet-700 text-white text-xs font-black px-5 py-2 rounded-full transition-colors">
            Iniciar →
          </span>
        </Link>

        {/* Practice card */}
        <Link
          href="/programming/create"
          className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-emerald-50 group-hover:bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
            <Code2 className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
            Prática Livre
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Crie seus próprios problemas de programação e casos de teste, e escreva o código para resolvê-los.
          </p>
          <span className="mt-6 inline-block bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-black px-5 py-2 rounded-full transition-colors">
            Praticar →
          </span>
        </Link>
      </div>
    </main>
  );
}
