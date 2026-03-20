import Link from 'next/link';
import { Code2, ChevronLeft, Trophy, CheckCircle, XCircle, RotateCcw, Download, Upload } from 'lucide-react';
import { downloadCodeArchive } from '@/lib/programming';
import { makeCodeKey, loadFromStorage } from '@/lib/storage';
import type { ProblemSet, TestResult } from '@/types/programming';

interface ExamSummaryProps {
  problemSet: ProblemSet;
  allResults: (TestResult[] | null)[];
  fileName: string;
  storageKey: string;
  onReview: () => void;
  onNewExam: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGoToProblem: (index: number) => void;
}

export default function ExamSummary({
  problemSet,
  allResults,
  fileName,
  storageKey,
  onReview,
  onNewExam,
  onGoToProblem,
}: ExamSummaryProps) {
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

  const handleDownloadCode = () => {
    const problemsWithCode = problemSet.problems.map((p, i) => {
      const codeKey = makeCodeKey(storageKey, i);
      const code = loadFromStorage<string>(codeKey) || '';
      return { ...p, code };
    });
    downloadCodeArchive(problemSet.title, problemsWithCode);
  };

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
              onClick={() => onGoToProblem(i)}
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
            onClick={onReview}
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
              onChange={onNewExam}
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
