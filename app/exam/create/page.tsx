'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  BookOpen,
  Download,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  Trophy,
} from 'lucide-react';
import type { Question } from '@/types/exam';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface DraftQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

function emptyQuestion(): DraftQuestion {
  return {
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 'A',
    explanation: '',
  };
}

function questionIsValid(q: DraftQuestion): boolean {
  return (
    q.question.trim() !== '' &&
    q.options.filter((o) => o.trim() !== '').length >= 2 &&
    q.correctAnswer !== ''
  );
}

/** Serialises all questions as a UTF-8 CSV compatible with the /exam parser. */
function buildCSV(examTitle: string, questions: DraftQuestion[]): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = `${escape('Questão')};${escape('Alternativas')};${escape('Gabarito')};${escape('Explicação')}`;
  const rows = questions.map((q) => {
    const opts = q.options
      .map((o, i) => `${LETTERS[i]}) ${o}`)
      .filter((_, i) => q.options[i].trim() !== '')
      .join(';');
    return [
      escape(q.question),
      escape(opts),
      escape(q.correctAnswer),
      escape(q.explanation),
    ].join(';');
  });
  return [header, ...rows].join('\n');
}

export default function CreateExamPage() {
  const [examTitle, setExamTitle] = useState('Meu Simulado');
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const current = questions[currentIndex];

  // ── Mutators ──────────────────────────────────────────────
  const updateCurrent = (patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], ...patch };
      return next;
    });
  };

  const updateOption = (optIdx: number, value: string) => {
    const opts = [...current.options];
    opts[optIdx] = value;
    updateCurrent({ options: opts });
  };

  const addOption = () => {
    if (current.options.length >= LETTERS.length) return;
    updateCurrent({ options: [...current.options, ''] });
  };

  const removeOption = (optIdx: number) => {
    if (current.options.length <= 2) return;
    const opts = current.options.filter((_, i) => i !== optIdx);
    // Fix correctAnswer if it pointed to the removed option
    const newAnswer =
      current.correctAnswer === LETTERS[optIdx]
        ? LETTERS[0]
        : current.correctAnswer;
    updateCurrent({ options: opts, correctAnswer: newAnswer });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
    setCurrentIndex(questions.length);
  };

  const removeQuestion = () => {
    if (questions.length === 1) return;
    const next = questions.filter((_, i) => i !== currentIndex);
    setQuestions(next);
    setCurrentIndex(Math.min(currentIndex, next.length - 1));
  };

  // ── Summary / export ──────────────────────────────────────
  const validCount = questions.filter(questionIsValid).length;
  const allValid = validCount === questions.length && questions.length > 0;

  const handleDownload = () => {
    const csv = buildCSV(examTitle, questions.filter(questionIsValid));
    const bom = '\uFEFF'; // UTF-8 BOM so Excel doesn't mangle accents
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // ── Summary screen ─────────────────────────────────────────
  if (showSummary) {
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
              <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-none">{examTitle}</h1>
            </div>
            <div className="w-24" />
          </div>

          {/* Score card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10 text-center mb-6">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                allValid ? 'bg-indigo-600 shadow-indigo-200' : 'bg-amber-500 shadow-amber-200'
              }`}
            >
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Prova Criada!</h2>
            <p className="text-slate-500 mb-6 font-medium">
              {validCount} de {questions.length} questões válidas prontas para exportar.
            </p>

            <div className="flex justify-center gap-6 text-sm font-bold">
              <div className="text-center">
                <p className="text-2xl font-black text-indigo-600">{validCount}</p>
                <p className="text-slate-500">válidas</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-black text-slate-700">{questions.length}</p>
                <p className="text-slate-500">total</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-black text-red-500">
                  {questions.length - validCount}
                </p>
                <p className="text-slate-500">incompletas</p>
              </div>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="space-y-3 mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              Detalhamento por questão
            </p>
            {questions.map((q, i) => {
              const valid = questionIsValid(q);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i);
                    setShowSummary(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all hover:shadow-sm cursor-pointer ${
                    valid
                      ? 'border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50'
                      : 'border-amber-200 bg-amber-50/60 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {valid ? (
                      <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-black text-slate-800 text-sm">Questão {i + 1}</p>
                      <p className="text-xs text-slate-400 font-medium truncate max-w-xs">
                        {q.question || 'Sem enunciado'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      valid
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {valid ? 'Pronta' : 'Incompleta'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowSummary(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Continuar Editando
            </button>
            <button
              onClick={handleDownload}
              disabled={validCount === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all text-sm shadow-lg ${
                validCount > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Download className="w-4 h-4" />
              Baixar CSV ({validCount} questões)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Editor screen ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-800 font-bold flex items-center transition-colors text-sm"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Início
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-indigo-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">
                Criar Simulado
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-0.5">Editor de Questões</p>
            </div>
          </div>
        </div>

        {/* Navigation + actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className={`p-2 rounded-xl transition-colors ${
              currentIndex === 0
                ? 'text-slate-300 bg-transparent'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-500 min-w-[40px] text-center">
            {currentIndex + 1} / {questions.length}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex === questions.length - 1}
            className={`p-2 rounded-xl transition-colors ${
              currentIndex === questions.length - 1
                ? 'text-slate-300 bg-transparent'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <button
            onClick={addQuestion}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Questão</span>
          </button>

          <button
            onClick={() => setShowSummary(true)}
            disabled={validCount === 0}
            className={`text-sm font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${
              validCount > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title={validCount === 0 ? 'Preencha ao menos uma questão' : 'Ver resumo e exportar'}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* Editor body */}
      <main className="flex-1 flex items-start justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl space-y-6">

          {/* Exam title (only show on first question, stays visible via sticky or top banner) */}
          {currentIndex === 0 && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
              <label className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1.5 block">
                Nome da Prova
              </label>
              <input
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full text-lg font-black text-indigo-900 bg-transparent outline-none placeholder:text-indigo-300"
                placeholder="Ex: Simulado de Direito Constitucional"
              />
            </div>
          )}

          {/* Question card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800">
                Questão {currentIndex + 1}
                <span className="text-slate-400 font-normal text-base ml-2">
                  de {questions.length}
                </span>
              </h2>
              {questions.length > 1 && (
                <button
                  onClick={removeQuestion}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors"
                  title="Remover esta questão"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Enunciado */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Enunciado
                </label>
                <textarea
                  value={current.question}
                  onChange={(e) => updateCurrent({ question: e.target.value })}
                  rows={4}
                  className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-y placeholder:text-slate-400"
                  placeholder="Digite o enunciado da questão..."
                />
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Alternativas
                  </label>
                  {current.options.length < LETTERS.length && (
                    <button
                      onClick={addOption}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar alternativa
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {current.options.map((opt, i) => {
                    const letter = LETTERS[i];
                    const isCorrect = current.correctAnswer === letter;
                    return (
                      <div key={i} className="flex items-center gap-3 group">
                        {/* Correct indicator */}
                        <button
                          onClick={() => updateCurrent({ correctAnswer: letter })}
                          title={isCorrect ? 'Gabarito' : 'Marcar como gabarito'}
                          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                            isCorrect
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                              : 'bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'
                          }`}
                        >
                          {letter}
                        </button>

                        {/* Option input */}
                        <input
                          value={opt}
                          onChange={(e) => updateOption(i, e.target.value)}
                          className={`flex-1 text-sm font-medium bg-slate-50 border rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-slate-300 ${
                            isCorrect
                              ? 'border-indigo-300 bg-indigo-50/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                              : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10'
                          }`}
                          placeholder={`Texto da alternativa ${letter}...`}
                        />

                        {/* Remove option */}
                        {current.options.length > 2 && (
                          <button
                            onClick={() => removeOption(i)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"
                            title="Remover alternativa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Gabarito hint */}
                <p className="text-xs text-slate-400 font-medium mt-3">
                  Clique na letra da alternativa para marcá-la como gabarito.{' '}
                  <span className="font-black text-indigo-500">
                    Gabarito: {current.correctAnswer}
                  </span>
                </p>
              </div>

              {/* Explanation */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Explicação{' '}
                  <span className="text-slate-300 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  value={current.explanation}
                  onChange={(e) => updateCurrent({ explanation: e.target.value })}
                  rows={3}
                  className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-y placeholder:text-slate-400"
                  placeholder="Por que essa é a resposta correta? (será exibido no gabarito após a prova)"
                />
              </div>

              {/* Validation status */}
              <div
                className={`flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl ${
                  questionIsValid(current)
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {questionIsValid(current) ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {questionIsValid(current)
                  ? 'Questão válida e pronta para exportar.'
                  : 'Preencha o enunciado e pelo menos 2 alternativas.'}
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex justify-between items-center pb-8">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className={`flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                currentIndex === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-slate-600"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={addQuestion}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> Nova Questão
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
