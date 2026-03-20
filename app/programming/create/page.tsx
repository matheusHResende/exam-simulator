'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Trash2, Code2, Download, Trophy, CheckCircle, XCircle, RotateCcw, FileText } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeRunner from '@/components/programming/CodeRunner';
import type { TestResult } from '@/components/programming/CodeRunner';
import type { TestCase, Problem, ProblemSet } from '@/types/programming';
import { downloadCodeArchive } from '@/lib/programming';

export default function CreatePage() {
  const [examTitle, setExamTitle] = useState('Meu Simulado');
  const [problems, setProblems] = useState<Problem[]>([
    { title: 'Problema 1', description: '', testCases: [{ input: '', expectedOutput: '' }] }
  ]);
  const [allResults, setAllResults] = useState<(TestResult[] | null)[]>([null]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

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

  const currentProblem = problems[currentIndex];

  // --- Problem Management ---
  const handleUpdateProblem = (updated: Partial<Problem>) => {
    const nextProblems = [...problems];
    nextProblems[currentIndex] = { ...currentProblem, ...updated };
    setProblems(nextProblems);
  };

  const handleAddProblem = () => {
    setProblems([
      ...problems,
      { title: `Problema ${problems.length + 1}`, description: '', testCases: [{ input: '', expectedOutput: '' }] }
    ]);
    setAllResults([...allResults, null]);
    setCurrentIndex(problems.length);
  };

  const handleRemoveProblem = () => {
    if (problems.length === 1) return;
    const nextProblems = problems.filter((_, i) => i !== currentIndex);
    const nextResults = allResults.filter((_, i) => i !== currentIndex);
    setProblems(nextProblems);
    setAllResults(nextResults);
    if (currentIndex >= nextProblems.length) {
      setCurrentIndex(nextProblems.length - 1);
    }
  };

  // --- Test Case Management ---
  const handleAddTestCase = () => {
    handleUpdateProblem({
      testCases: [...currentProblem.testCases, { input: '', expectedOutput: '' }]
    });
  };

  const handleRemoveTestCase = (tcIndex: number) => {
    handleUpdateProblem({
      testCases: currentProblem.testCases.filter((_, i) => i !== tcIndex)
    });
  };

  const handleTestCaseChange = (tcIndex: number, field: keyof TestCase, value: string) => {
    const newCases = [...currentProblem.testCases];
    newCases[tcIndex] = { ...newCases[tcIndex], [field]: value };
    handleUpdateProblem({ testCases: newCases });
  };

  // --- Result Tracking ---
  const handleResultsChange = (results: TestResult[] | null) => {
    const nextResults = [...allResults];
    nextResults[currentIndex] = results;
    setAllResults(nextResults);
  };

  // --- Generation Logic ---
  const allProblemsPassed = problems.every((p, i) => {
    const r = allResults[i];
    if (!r || r.length !== p.testCases.length || p.testCases.length === 0) return false;
    return r.every(tc => tc.passed);
  });

  const handleDownloadExam = () => {
    if (!allProblemsPassed) return;
    const data: ProblemSet = {
      title: examTitle,
      problems: problems
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDownloadCode = () => {
    downloadCodeArchive(examTitle, 'practice_mode', problems);
  };

  // ─── Summary screen ───────────────────────────────────────────────────────
  if (showSummary) {
    const totalProblems = problems.length;
    let totalPassed = 0;
    let totalCases = 0;

    const problemSummaries = problems.map((p, i) => {
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
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-700 font-bold flex items-center transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Sair
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-none">
                  {examTitle}
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
                  : 'bg-indigo-600 shadow-indigo-200'
              }`}
            >
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Prova Pronta!</h2>
            <p className="text-slate-500 mb-6 font-medium">
              Todos os problemas foram implementados com sucesso.
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
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => setShowSummary(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Continuar Editando
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-50 transition-all text-sm shadow-sm"
            >
              <Code2 className="w-4 h-4" />
              Baixar Código
            </button>
            <button
              onClick={handleDownloadExam}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-none bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-200"
            >
              <FileText className="w-4 h-4" />
              Baixar JSON
            </button>
          </div>
        </div>
      </div>
    );
  }

  const editorContent = (
    <div className="h-full overflow-y-auto p-6 md:p-8 bg-white flex flex-col gap-6">
      {/* Exam Title Input */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-2">
        <label className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1.5 block">
          Nome da Prova
        </label>
        <input
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          className="w-full text-lg font-black text-emerald-900 bg-transparent outline-none placeholder:text-emerald-300 transition-colors"
          placeholder="Ex: Simulado de Algoritmos"
        />
      </div>

      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-black text-slate-800">
          Problema {currentIndex + 1} de {problems.length}
        </h2>
        
        <div className="flex items-center gap-2">
          {problems.length > 1 && (
            <button
              onClick={handleRemoveProblem}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors shrink-0"
              title="Remover problema atual"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Problem Title */}
      <div>
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
          Título do Problema
        </label>
        <input
          value={currentProblem.title}
          onChange={(e) => handleUpdateProblem({ title: e.target.value })}
          className="w-full text-2xl font-black text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-emerald-500 outline-none pb-2 transition-colors placeholder:text-slate-300"
          placeholder="Ex: Soma de Dois Números"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
          Descrição
        </label>
        <textarea
          value={currentProblem.description}
          onChange={(e) => handleUpdateProblem({ description: e.target.value })}
          className="w-full h-32 text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-y placeholder:text-slate-400"
          placeholder="Descreva o que seu programa deve fazer..."
        />
      </div>

      {/* Test cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Casos de Teste
          </label>
          <button
            onClick={handleAddTestCase}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        <div className="space-y-4">
          {currentProblem.testCases.map((tc, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {currentProblem.testCases.length > 1 && (
                  <button
                    onClick={() => handleRemoveTestCase(i)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    title="Remover caso de teste"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="mb-4 pr-8">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Caso #{i + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Entrada
                  </label>
                  <textarea
                    value={tc.input}
                    onChange={(e) => handleTestCaseChange(i, 'input', e.target.value)}
                    className="w-full h-24 font-mono text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none placeholder:text-slate-300"
                    placeholder={"Ex:\\n2\\n3"}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Saída Esperada
                  </label>
                  <textarea
                    value={tc.expectedOutput}
                    onChange={(e) => handleTestCaseChange(i, 'expectedOutput', e.target.value)}
                    className="w-full h-24 font-mono text-sm text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-xl p-3 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none placeholder:text-emerald-300"
                    placeholder={"Ex:\\n5"}
                  />
                </div>
              </div>
            </div>
          ))}
          {currentProblem.testCases.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-2xl">
              Nenhum caso de teste. Adicione um para testar seu código.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:h-screen w-full bg-slate-50 flex flex-col text-slate-900 overflow-auto lg:overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 w-full p-2 md:p-4 pb-0">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2 shrink-0 px-2 lg:mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-800 font-bold flex items-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Início
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <div className="bg-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-slate-900 leading-none">Criador de Provas</h1>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Editor de Testes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className={`flex items-center justify-center p-2 rounded-xl transition-colors ${
                currentIndex === 0 ? 'text-slate-300 bg-transparent' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-500">
              {currentIndex + 1} / {problems.length}
            </span>
            <button
              onClick={() => setCurrentIndex(i => Math.min(problems.length - 1, i + 1))}
              disabled={currentIndex === problems.length - 1}
              className={`flex items-center justify-center p-2 rounded-xl transition-colors ${
                currentIndex === problems.length - 1 ? 'text-slate-300 bg-transparent' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              onClick={handleAddProblem}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Novo Problema
            </button>
            <button
              onClick={() => setShowSummary(true)}
              disabled={!allProblemsPassed}
              className={`text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                allProblemsPassed 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-600/20' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
              title={allProblemsPassed ? 'Resumo da Prova' : 'Resolva todos os problemas para gerar a prova'}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Revisar</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {isMobile ? (
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto mt-2 pb-4">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden shrink-0">
              {editorContent}
            </div>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden shrink-0 h-[600px] flex flex-col">
              <CodeRunner
                key={`runner_mobile_${currentIndex}`}
                testCases={currentProblem.testCases}
                problemIndex={currentIndex}
                storageKey={`practice_mode_${currentIndex}`}
                onResultsChange={handleResultsChange}
              />
            </div>
          </div>
        ) : (
          <PanelGroup direction="horizontal" className="flex-1 min-h-0 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mt-2 mb-4">
            <Panel defaultSize={45} minSize={20} className="bg-white flex flex-col relative">
              {editorContent}
            </Panel>
            
            <PanelResizeHandle className="w-2 bg-slate-50 border-x border-slate-200 hover:bg-emerald-100 active:bg-emerald-200 transition-colors cursor-col-resize flex items-center justify-center shrink-0">
              <div className="h-8 w-0.5 bg-slate-300 rounded-full" />
            </PanelResizeHandle>

            <Panel defaultSize={55} minSize={30} className="bg-white flex flex-col min-h-0 relative">
              <CodeRunner
                key={`runner_${currentIndex}`}
                testCases={currentProblem.testCases}
                problemIndex={currentIndex}
                storageKey={`practice_mode_${currentIndex}`}
                onResultsChange={handleResultsChange}
              />
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
}
