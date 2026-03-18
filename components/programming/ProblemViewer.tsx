import { useRef, useState, useEffect } from 'react';
import type { Problem } from '@/types/programming';
import { ChevronLeft, ChevronRight, Flag, Play, Loader2 } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeRunner from './CodeRunner';
import type { TestResult, CodeRunnerRef } from './CodeRunner';

interface ProblemViewerProps {
  problem: Problem;
  index: number;
  total: number;
  storageKey: string;
  onPrev: () => void;
  onNext: () => void;
  onGoToSummary: () => void;
  onFinish: () => void;
  onResultsChange: (index: number, results: TestResult[] | null) => void;
}

export default function ProblemViewer({
  problem,
  index,
  total,
  storageKey,
  onPrev,
  onNext,
  onGoToSummary,
  onFinish,
  onResultsChange,
}: ProblemViewerProps) {
  const isLast = index === total - 1;
  const codeRunnerRef = useRef<CodeRunnerRef>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingPyodide, setLoadingPyodide] = useState(false);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
            Problema {index + 1} de {total}
          </span>
          <button
            onClick={onGoToSummary}
            className="text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors underline decoration-slate-300 underline-offset-4"
          >
            Ir para Resumo
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => codeRunnerRef.current?.runCode()}
            disabled={isRunning || problem.testCases.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm transition-all shadow-sm ${
              isRunning || problem.testCases.length === 0
                ? 'bg-violet-200 text-violet-400 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingPyodide ? 'Carregando Python…' : 'Executando…'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Executar
              </>
            )}
          </button>

          <div className="w-px bg-slate-200 mx-1 self-stretch" />

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
          {isLast ? (
            <button
              onClick={onFinish}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Flag className="w-4 h-4" /> Finalizar Prova
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex items-center px-4 py-2 rounded-xl font-bold transition-all text-sm bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* ── Dynamic Layout Selection ── */}
      {isMobile ? (
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
          {/* Problem description panel */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-10">
              <h2 className="text-2xl font-black text-slate-900 mb-6">{problem.title}</h2>

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8 relative overflow-x-auto">
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
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                            Entrada #{i + 1}
                          </p>
                          <pre className="text-slate-700 text-sm font-mono whitespace-pre-wrap break-all">
                            {tc.input}
                          </pre>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
                            Saída Esperada #{i + 1}
                          </p>
                          <pre className="text-indigo-900 text-sm font-mono whitespace-pre-wrap break-all">
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

          {/* Code editor panel — fixed height on mobile */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden shrink-0 h-[500px]">
            <CodeRunner
              ref={codeRunnerRef}
              testCases={problem.testCases}
              problemIndex={index}
              storageKey={storageKey}
              onResultsChange={(results) => onResultsChange(index, results)}
              onRunningStateChange={(running, pyloading) => {
                setIsRunning(running);
                setLoadingPyodide(pyloading);
              }}
            />
          </div>
        </div>
      ) : (
        <PanelGroup direction="horizontal" className="flex-1 min-h-0 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          {/* Left Column: Problem description and test cases */}
          <Panel defaultSize={45} minSize={20} className="bg-white overflow-y-auto">
            <div className="p-8 md:p-10">
              <h2 className="text-2xl font-black text-slate-900 mb-6">{problem.title}</h2>

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8 relative overflow-x-auto">
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
                        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                      >
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                            Entrada #{i + 1}
                          </p>
                          <pre className="text-slate-700 text-sm font-mono whitespace-pre-wrap break-all">
                            {tc.input}
                          </pre>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
                            Saída Esperada #{i + 1}
                          </p>
                          <pre className="text-indigo-900 text-sm font-mono whitespace-pre-wrap break-all">
                            {tc.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-2 bg-slate-50 border-x border-slate-200 hover:bg-violet-100 active:bg-violet-200 transition-colors cursor-col-resize flex items-center justify-center shrink-0">
            <div className="h-8 w-0.5 bg-slate-300 rounded-full" />
          </PanelResizeHandle>

          {/* Right Column: Python IDE */}
          <Panel defaultSize={55} minSize={30} className="bg-white flex flex-col min-h-0 relative">
            <CodeRunner
              ref={codeRunnerRef}
              testCases={problem.testCases}
              problemIndex={index}
              storageKey={storageKey}
              onResultsChange={(results) => onResultsChange(index, results)}
              onRunningStateChange={(running, pyloading) => {
                setIsRunning(running);
                setLoadingPyodide(pyloading);
              }}
            />
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
}
