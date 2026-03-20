'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Code2, ChevronLeft, Upload, FileText, CheckCircle, XCircle, Trophy, RotateCcw, Download } from 'lucide-react';
import ProblemViewer from '@/components/programming/ProblemViewer';
import { downloadCodeArchive } from '@/lib/programming';
import type { TestResult } from '@/components/programming/CodeRunner';
import type { ProblemSet } from '@/types/programming';

function makeStorageKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

export default function ProgrammingPage() {
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [storageKey, setStorageKey] = useState('');
  // results[i] = null means not yet run; TestResult[] means already run
  const [allResults, setAllResults] = useState<(TestResult[] | null)[]>([]);
  const [showSummary, setShowSummary] = useState(false);

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
        const key = makeStorageKey(parsed.title || file.name);
        setProblemSet(parsed);
        setStorageKey(key);
        setCurrentIndex(0);
        setAllResults(new Array(parsed.problems.length).fill(null));
        setShowSummary(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Formato JSON inválido.');
        setProblemSet(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleResultsChange = useCallback((index: number, results: TestResult[] | null) => {
    setAllResults((prev) => {
      const next = [...prev];
      next[index] = results;
      return next;
    });
  }, []);

  const handleFinish = () => {
    setShowSummary(true);
  };

  const handleRestart = () => {
    setShowSummary(false);
    setCurrentIndex(0);
  };

  const handleDownloadCode = () => {
    if (!problemSet) return;
    downloadCodeArchive(problemSet.title, `prog_code_${storageKey}`, problemSet.problems);
  };

  // ─── Summary screen ───────────────────────────────────────────────────────
  if (showSummary && problemSet) {
    const totalProblems = problemSet.problems.length;
    let totalPassed = 0;
    let totalCases = 0;

    const problemSummaries = problemSet.problems.map((p, i) => {
      const res = allResults[i];
      const passed = res ? res.filter((r) => r.passed).length : 0;
      const total = res ? res.length : p.testCases.length;
      totalPassed += passed;
      totalCases += total;
      const allPassed = res !== null && passed === total && total > 0;
      const notRun = res === null;
      return { title: p.title, passed, total, allPassed, notRun };
    });

    const fullySolvedCount = problemSummaries.filter((s) => s.allPassed).length;
    const overallPct = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-700 font-bold flex items-center transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Sair
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-violet-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-none">
                  {problemSet.title}
                </h1>
              </div>
            </div>
            <div className="w-24" />
          </div>

          {/* Trophy card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10 text-center mb-6">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                fullySolvedCount === totalProblems
                  ? 'bg-emerald-500 shadow-emerald-200'
                  : 'bg-violet-600 shadow-violet-200'
              }`}
            >
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Prova concluída!</h2>
            <p className="text-slate-500 mb-6">
              {fileName}
            </p>

            {/* Big score */}
            <div className="inline-flex items-end gap-1 mb-6">
              <span className="text-6xl font-black text-slate-900">{overallPct}%</span>
              <span className="text-lg text-slate-400 font-bold mb-2">de acerto</span>
            </div>

            <div className="flex justify-center gap-6 text-sm font-bold">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">{fullySolvedCount}</p>
                <p className="text-slate-500">problema{fullySolvedCount !== 1 ? 's' : ''} resolvido{fullySolvedCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-black text-slate-700">{totalProblems}</p>
                <p className="text-slate-500">total de problemas</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-black text-indigo-600">
                  {totalPassed}/{totalCases}
                </p>
                <p className="text-slate-500">casos de teste</p>
              </div>
            </div>
          </div>

          {/* Per-problem breakdown */}
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              Detalhamento por problema
            </p>
            {problemSummaries.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  setShowSummary(false);
                }}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-colors cursor-pointer hover:shadow-sm ${
                  s.allPassed
                    ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50'
                    : s.notRun
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-red-200 bg-red-50/60 hover:bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {s.allPassed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className={`w-5 h-5 shrink-0 ${s.notRun ? 'text-slate-400' : 'text-red-500'}`} />
                  )}
                  <div>
                    <p className="font-black text-slate-800 text-sm">{s.title}</p>
                    {s.notRun && (
                      <p className="text-xs text-slate-400 font-medium">Não executado</p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-sm font-black px-3 py-1 rounded-full ${
                    s.allPassed
                      ? 'bg-emerald-100 text-emerald-700'
                      : s.notRun
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {s.notRun ? '—' : `${s.passed}/${s.total}`}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleRestart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Revisar problemas
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-50 transition-all text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              Baixar Código
            </button>
            <div className="relative flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all text-sm shadow-lg shadow-violet-200">
                <Upload className="w-4 h-4" />
                Nova prova
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main exam screen ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen lg:h-screen w-full bg-slate-50 flex flex-col text-slate-900 overflow-auto lg:overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 w-full p-2 md:p-4 pb-0">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0 px-2">
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
            <div className="relative group cursor-pointer flex items-center bg-violet-50 border border-violet-200 rounded-xl px-3 py-1.5 hover:bg-violet-100 transition-colors shadow-sm gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                <div className="text-left flex flex-col justify-center">
                  <p className="font-bold text-[11px] text-violet-900 leading-none">{fileName}</p>
                  <p className="text-[10px] text-violet-600 mt-0.5 leading-none">
                    {problemSet.problems.length} problema{problemSet.problems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="w-px h-6 bg-violet-200"></div>
              <span className="text-[10px] font-black text-violet-600 group-hover:text-violet-700 transition-colors uppercase tracking-wider">
                Alterar
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
            <div className="flex-1 min-h-0 mt-2">
              <ProblemViewer
                problem={problemSet.problems[currentIndex]}
                index={currentIndex}
                total={problemSet.problems.length}
                storageKey={storageKey}
                onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                onNext={() =>
                  setCurrentIndex((i) => Math.min(problemSet.problems.length - 1, i + 1))
                }
                onGoToSummary={() => setShowSummary(true)}
                onFinish={handleFinish}
                onResultsChange={handleResultsChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
