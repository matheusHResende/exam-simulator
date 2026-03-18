import type { Problem } from '@/types/programming';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CodeRunner from './CodeRunner';

interface ProblemViewerProps {
  problem: Problem;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function ProblemViewer({
  problem,
  index,
  total,
  onPrev,
  onNext,
}: ProblemViewerProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
          Problema {index + 1} de {total}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className={`flex items-center px-4 py-2 rounded-xl font-bold transition-all text-sm ${
              index === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </button>
          <button
            onClick={onNext}
            disabled={index === total - 1}
            className={`flex items-center px-4 py-2 rounded-xl font-bold transition-all text-sm ${
              index === total - 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Problem card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 md:p-10">
          <h2 className="text-2xl font-black text-slate-900 mb-6">{problem.title}</h2>

          {/* Description */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8 relative">
            <div className="absolute -top-3 left-8 bg-white px-4 border border-slate-100 rounded-full">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                Descrição
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed pt-2 whitespace-pre-wrap">
              {problem.description}
            </p>
          </div>

          {/* Test cases */}
          {problem.testCases.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                Casos de Teste
              </h3>
              <div className="space-y-4">
                {problem.testCases.map((tc, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="bg-slate-900 rounded-2xl p-5">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        Entrada #{i + 1}
                      </p>
                      <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap break-all">
                        {tc.input}
                      </pre>
                    </div>
                    <div className="bg-indigo-950 rounded-2xl p-5">
                      <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">
                        Saída Esperada #{i + 1}
                      </p>
                      <pre className="text-indigo-200 text-sm font-mono whitespace-pre-wrap break-all">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Python IDE */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 md:p-10">
        <CodeRunner testCases={problem.testCases} problemIndex={index} />
      </div>
    </div>
  );
}
