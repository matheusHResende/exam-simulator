'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import type { TestCase } from '@/types/programming';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadPyodide: (opts: { indexURL: string }) => Promise<any>;
    _pyodideInstance: PyodideInstance | null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PyodideInstance = any;

interface TestResult {
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  error?: string;
}

interface CodeRunnerProps {
  testCases: TestCase[];
  problemIndex: number;
}

const STARTER_CODE = `# Escreva sua solução aqui
`;

async function getPyodide(): Promise<PyodideInstance> {
  if (window._pyodideInstance) return window._pyodideInstance;

  // Load Pyodide script if not already on the page
  if (!window.loadPyodide) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar o Pyodide.'));
      document.head.appendChild(script);
    });
  }

  const pyodide: PyodideInstance = await window.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/',
  });

  window._pyodideInstance = pyodide;
  return pyodide;
}

async function runCode(
  pyodide: PyodideInstance,
  code: string,
  input: string
): Promise<{ stdout: string; stderr: string }> {
  const lines = input.split('\n');
  const escaped = JSON.stringify(lines);

  const wrapper = `
import sys, io

_lines = ${escaped}
_line_idx = 0

def _fake_input(prompt=''):
    global _line_idx
    if _line_idx < len(_lines):
        val = _lines[_line_idx]
        _line_idx += 1
        return val
    return ''

_stdout_buf = io.StringIO()
_original_stdout = sys.stdout
sys.stdout = _stdout_buf
sys.stdin = io.StringIO(${JSON.stringify(input)})
__builtins__.input = _fake_input

try:
${code
  .split('\n')
  .map((l) => '    ' + l)
  .join('\n')}
finally:
    sys.stdout = _original_stdout

_stdout_buf.getvalue()
`;

  let stderr = '';
  pyodide.setStderr({
    batched: (s: string) => {
      stderr += s + '\n';
    },
  });

  const result: string = await pyodide.runPythonAsync(wrapper);
  return { stdout: result ?? '', stderr };
}

export default function CodeRunner({ testCases, problemIndex }: CodeRunnerProps) {
  const [code, setCode] = useState(STARTER_CODE);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const prevIndexRef = useRef(problemIndex);

  // Reset editor when navigating to a new problem
  useEffect(() => {
    if (prevIndexRef.current !== problemIndex) {
      setCode(STARTER_CODE);
      setResults(null);
      setGlobalError('');
      prevIndexRef.current = problemIndex;
    }
  }, [problemIndex]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setGlobalError('');
    setResults(null);

    let pyodide: PyodideInstance;
    try {
      setLoadingPyodide(true);
      pyodide = await getPyodide();
      setLoadingPyodide(false);
    } catch (e: unknown) {
      setGlobalError(e instanceof Error ? e.message : 'Erro ao carregar o interpretador Python.');
      setIsRunning(false);
      setLoadingPyodide(false);
      return;
    }

    const newResults: TestResult[] = [];

    for (const tc of testCases) {
      try {
        const { stdout } = await runCode(pyodide, code, tc.input);
        const actual = stdout.trimEnd();
        const expected = tc.expectedOutput.trimEnd();
        newResults.push({
          passed: actual === expected,
          actualOutput: actual,
          expectedOutput: expected,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        newResults.push({
          passed: false,
          actualOutput: '',
          expectedOutput: tc.expectedOutput.trimEnd(),
          error: msg,
        });
      }
    }

    setResults(newResults);
    setIsRunning(false);
  }, [code, testCases]);

  const passCount = results?.filter((r) => r.passed).length ?? 0;
  const totalCount = results?.length ?? 0;
  const allPassed = results !== null && passCount === totalCount;

  return (
    <div className="space-y-4">
      {/* Editor header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
          Seu Código (Python)
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCode(STARTER_CODE);
              setResults(null);
              setGlobalError('');
            }}
            title="Limpar código"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || testCases.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm transition-all shadow-sm ${
              isRunning || testCases.length === 0
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
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
        <Editor
          height="320px"
          defaultLanguage="python"
          value={code}
          onChange={(val) => setCode(val ?? '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            tabSize: 4,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Global error (e.g. Pyodide failed to load) */}
      {globalError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium p-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {/* Summary badge */}
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border font-black text-sm ${
              allPassed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {allPassed ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {passCount}/{totalCount} caso{totalCount !== 1 ? 's' : ''} de teste{' '}
            {allPassed ? 'passou' : 'passaram'}
          </div>

          {/* Per-test-case results */}
          {results.map((r, i) => (
            <div
              key={i}
              className={`rounded-2xl border overflow-hidden ${
                r.passed
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-red-200 bg-red-50/40'
              }`}
            >
              {/* Case header */}
              <div
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest ${
                  r.passed ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {r.passed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Caso #{i + 1} — {r.passed ? 'Correto' : 'Incorreto'}
              </div>

              {!r.passed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-red-200/50 border-t border-red-200">
                  {/* Expected */}
                  <div className="bg-slate-900 p-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Saída Esperada
                    </p>
                    <pre className="text-indigo-300 text-sm font-mono whitespace-pre-wrap break-all">
                      {r.expectedOutput || '(vazio)'}
                    </pre>
                  </div>
                  {/* Actual */}
                  <div className="bg-slate-800 p-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      {r.error ? 'Erro' : 'Sua Saída'}
                    </p>
                    <pre
                      className={`text-sm font-mono whitespace-pre-wrap break-all ${
                        r.error ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {r.error || r.actualOutput || '(vazio)'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
