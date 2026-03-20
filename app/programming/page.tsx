'use client';

import Link from 'next/link';
import { ChevronLeft, Code2, FileText } from 'lucide-react';
import ProblemViewer from '@/components/programming/ProblemViewer';
import ExamSummary from '@/components/programming/ExamSummary';
import ExamUploader from '@/components/programming/ExamUploader';
import { useProgrammingExam } from '@/hooks/useProgrammingExam';

export default function ProgrammingPage() {
  const {
    problemSet,
    currentIndex,
    setCurrentIndex,
    fileName,
    error,
    storageKey,
    allResults,
    showSummary,
    setShowSummary,
    handleFileUpload,
    handleResultsChange,
    handleFinish,
    handleRestart,
  } = useProgrammingExam();

  // ─── Summary screen ───────────────────────────────────────────────────────
  if (showSummary && problemSet) {
    return (
      <ExamSummary
        problemSet={problemSet}
        allResults={allResults}
        fileName={fileName}
        storageKey={storageKey}
        onReview={handleRestart}
        onNewExam={handleFileUpload}
        onGoToProblem={(idx) => {
          setCurrentIndex(idx);
          setShowSummary(false);
        }}
      />
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
          <ExamUploader onUpload={handleFileUpload} error={error} />
        ) : (
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
        )}
      </div>
    </div>
  );
}
