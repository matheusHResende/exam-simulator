'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Code2, ChevronLeft, Upload, FileText } from 'lucide-react';
import ProblemViewer from '@/components/programming/ProblemViewer';
import type { ProblemSet } from '@/types/programming';

export default function ProgrammingPage() {
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: ProblemSet = JSON.parse(e.target?.result as string);
        if (!parsed.problems || !Array.isArray(parsed.problems)) {
          throw new Error('O JSON não contém um array "problems".');
        }
        setProblemSet(parsed);
        setCurrentIndex(0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Formato JSON inválido.');
        setProblemSet(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 font-bold flex items-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Início
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">
                Prova de Programação
              </h1>
              {problemSet && (
                <p className="text-xs text-slate-400 font-bold mt-0.5">{problemSet.title}</p>
              )}
            </div>
          </div>
          {/* File picker or change button */}
          {!problemSet ? (
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-xs font-black text-violet-600 bg-violet-50 px-4 py-2 rounded-full border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer">
                Carregar JSON
              </span>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-xs font-black text-slate-500 hover:text-violet-600 cursor-pointer transition-colors">
                Alterar arquivo
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        {!problemSet ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white p-10 md:p-14 rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full text-center">
              <div className="bg-violet-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-violet-200">
                <Code2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">Prova de Programação</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Carregue um arquivo JSON com a lista de problemas para começar. Você poderá navegar pelos enunciados e ver os casos de teste.
              </p>

              <div className="relative group mb-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 group-hover:border-violet-500 group-hover:bg-violet-50 transition-all flex flex-col items-center">
                  <Upload className="w-12 h-12 text-slate-400 mb-4 group-hover:text-violet-500" />
                  <span className="text-slate-500 font-medium group-hover:text-violet-600">
                    Selecionar arquivo JSON
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold p-4 rounded-xl">
                  {error}
                </div>
              )}

              {/* Schema hint */}
              <div className="mt-6 bg-slate-50 rounded-2xl p-5 text-left border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Formato esperado
                </p>
                <pre className="text-xs text-slate-600 overflow-x-auto">{`{
  "title": "Nome da Prova",
  "problems": [
    {
      "title": "Problema 1",
      "description": "...",
      "testCases": [
        { "input": "...", "expectedOutput": "..." }
      ]
    }
  ]
}`}</pre>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* File badge */}
            <div className="bg-violet-50 border border-violet-200 p-3 rounded-xl flex items-center mb-6">
              <FileText className="w-5 h-5 mr-3 text-violet-600" />
              <div className="text-left">
                <p className="font-bold text-sm text-violet-800 leading-none">{fileName}</p>
                <p className="text-xs text-violet-500 mt-0.5">
                  {problemSet.problems.length} problema
                  {problemSet.problems.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <ProblemViewer
              problem={problemSet.problems[currentIndex]}
              index={currentIndex}
              total={problemSet.problems.length}
              onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              onNext={() =>
                setCurrentIndex((i) => Math.min(problemSet.problems.length - 1, i + 1))
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
