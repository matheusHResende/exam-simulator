/// <reference lib="webworker" />

export {}; // Make this file a module

// Define pyodide interface locally to avoid npm install requirement
interface PyodideInterface {
  runPythonAsync(code: string): Promise<string>;
  setStderr(opts: { batched: (s: string) => void }): void;
}

declare const self: DedicatedWorkerGlobalScope & {
  importScripts(...urls: string[]): void;
  loadPyodide(config: { indexURL: string }): Promise<PyodideInterface>;
};

let pyodide: PyodideInterface | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, id, code, input } = event.data;

  if (type === 'INIT') {
    try {
      if (!pyodide) {
        self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js');
        pyodide = await self.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/',
        });
      }
      self.postMessage({ type: 'INIT_DONE', id });
    } catch (error: any) {
      self.postMessage({ type: 'INIT_ERROR', id, error: error.message || String(error) });
    }
    return;
  }

  if (type === 'RUN') {
    if (!pyodide) {
      self.postMessage({ type: 'RUN_ERROR', id, error: 'Pyodide não foi inicializado.' });
      return;
    }

    try {
      const lines = (input || '').split('\n');
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
sys.stdin = io.StringIO(${JSON.stringify(input || '')})
__builtins__.input = _fake_input

try:
${code
  .split('\n')
  .map((l: string) => '    ' + l)
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

      const stdout = await pyodide.runPythonAsync(wrapper);
      self.postMessage({ type: 'RUN_DONE', id, stdout: stdout ?? '', stderr });
    } catch (error: any) {
      self.postMessage({ type: 'RUN_ERROR', id, error: error.message || String(error) });
    }
  }
};
