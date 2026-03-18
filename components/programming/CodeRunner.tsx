'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
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

export interface TestResult {
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  error?: string;
}

interface CodeRunnerProps {
  testCases: TestCase[];
  problemIndex: number;
  storageKey: string;
  onResultsChange?: (results: TestResult[] | null) => void;
  onRunningStateChange?: (isRunning: boolean, loadingPyodide: boolean) => void;
}

export interface CodeRunnerRef {
  runCode: () => Promise<void>;
  resetCode: () => void;
  hasCodeChanged: boolean;
}

const STARTER_CODE = `# Escreva sua solução aqui\n`;

function makeCodeKey(storageKey: string, index: number) {
  return `prog_code_${storageKey}_${index}`;
}

function makeResultsKey(storageKey: string, index: number) {
  return `prog_results_${storageKey}_${index}`;
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

async function getPyodide(): Promise<PyodideInstance> {
  if (window._pyodideInstance) return window._pyodideInstance;

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

const CodeRunner = forwardRef<CodeRunnerRef, CodeRunnerProps>(({ testCases, problemIndex, storageKey, onResultsChange, onRunningStateChange }, ref) => {
  const codeKey = makeCodeKey(storageKey, problemIndex);
  const resultsKey = makeResultsKey(storageKey, problemIndex);

  const [code, setCode] = useState<string>(() => {
    return loadFromStorage<string>(codeKey) ?? STARTER_CODE;
  });
  const [results, setResults] = useState<TestResult[] | null>(() => {
    return loadFromStorage<TestResult[]>(resultsKey);
  });
  const [isRunning, setIsRunning] = useState(false);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const prevIndexRef = useRef(problemIndex);

  // Sync state upward when it changes
  useEffect(() => {
    onRunningStateChange?.(isRunning, loadingPyodide);
  }, [isRunning, loadingPyodide, onRunningStateChange]);

  // Notify parent of restored results on mount
  useEffect(() => {
    onResultsChange?.(results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When navigating to a new problem, load its saved state
  useEffect(() => {
    if (prevIndexRef.current !== problemIndex) {
      const savedCode = loadFromStorage<string>(codeKey) ?? STARTER_CODE;
      const savedResults = loadFromStorage<TestResult[]>(resultsKey);
      setCode(savedCode);
      setResults(savedResults);
      setGlobalError('');
      onResultsChange?.(savedResults);
      prevIndexRef.current = problemIndex;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemIndex]);

  // Persist code whenever it changes
  useEffect(() => {
    saveToStorage(codeKey, code);
  }, [code, codeKey]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setGlobalError('');
    setResults(null);
    onResultsChange?.(null);

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
    saveToStorage(resultsKey, newResults);
    onResultsChange?.(newResults);
    setIsRunning(false);
  }, [code, testCases, resultsKey, onResultsChange]);

  const handleReset = useCallback(() => {
    setCode(STARTER_CODE);
    setResults(null);
    setGlobalError('');
    saveToStorage(codeKey, STARTER_CODE);
    saveToStorage(resultsKey, null);
    onResultsChange?.(null);
  }, [codeKey, resultsKey, onResultsChange]);

  const passCount = results?.filter((r) => r.passed).length ?? 0;
  const totalCount = results?.length ?? 0;
  const allPassed = results !== null && passCount === totalCount;

  useImperativeHandle(ref, () => ({
    runCode: handleRun,
    resetCode: handleReset,
    hasCodeChanged: code !== STARTER_CODE,
  }));

  return (
    <PanelGroup direction="vertical" className="h-full w-full p-4 md:p-6 pb-2 bg-transparent">
      {/* Top Panel: Monaco Editor */}
      <Panel defaultSize={60} minSize={20} className="flex flex-col relative bg-transparent">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Seu Código (Python)
          </h3>
        </div>
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-300 shadow-sm min-h-[150px]">
          <Editor
            height="100%"
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
      </Panel>

      {/* Resize Handle */}
      <PanelResizeHandle className="h-6 bg-transparent hover:bg-violet-50/50 active:bg-violet-50 transition-colors cursor-row-resize flex items-center justify-center group my-1">
        <div className="w-10 h-1 bg-slate-200 group-hover:bg-violet-400 rounded-full transition-colors" />
      </PanelResizeHandle>

      {/* Bottom Panel: Test Results / Console */}
      <Panel defaultSize={40} minSize={20} className="flex flex-col bg-transparent overflow-hidden">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Resultados / Casos de Teste
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-4 space-y-4 pr-1">
          {/* Global error (e.g. Pyodide failed to load) */}
          {globalError && (
            <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/50 text-red-500 text-sm font-medium p-4 rounded-xl">
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
                  <div className="bg-indigo-50 p-4">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
                      Saída Esperada
                    </p>
                    <pre className="text-indigo-900 text-sm font-mono whitespace-pre-wrap break-all">
                      {r.expectedOutput || '(vazio)'}
                    </pre>
                  </div>
                  {/* Actual */}
                  <div className="bg-red-50 p-4">
                    <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">
                      {r.error ? 'Erro' : 'Sua Saída'}
                    </p>
                    <pre
                      className={`text-sm font-mono whitespace-pre-wrap break-all ${
                        r.error ? 'text-red-600' : 'text-slate-700'
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
        {!results && !globalError && (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm italic py-10">
            Execute seu código para ver os resultados aqui
          </div>
        )}
        </div>
      </Panel>
    </PanelGroup>
  );
});

CodeRunner.displayName = 'CodeRunner';
export default CodeRunner;
