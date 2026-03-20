declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadPyodide: (opts: { indexURL: string }) => Promise<any>;
    _pyodideInstance: PyodideInstance | null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PyodideInstance = any;

/**
 * Returns the shared Pyodide WebAssembly instance, loading it on demand.
 *
 * The Pyodide runtime (~10 MB) is fetched from the jsDelivr CDN the first
 * time this function is called and then cached on `window._pyodideInstance`.
 * Subsequent calls return the cached instance immediately.
 *
 * @throws {Error} If called outside a browser environment (e.g. during SSR).
 */
export async function getPyodide(): Promise<PyodideInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide can only be loaded in the browser');
  }

  if (window._pyodideInstance) {
    return window._pyodideInstance;
  }

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

/**
 * Executes Python `code` in the provided Pyodide instance with the given
 * standard input and captures the output.
 *
 * **stdin simulation:** The input string is split on `\n` and injected via:
 * - A custom `builtins.input()` that pops one line at a time.
 * - An `io.StringIO` replacement of `sys.stdin` (for direct `sys.stdin.read`
 *   style code).
 *
 * **stdout capture:** `sys.stdout` is temporarily replaced with an
 * `io.StringIO` buffer; its value is returned after execution.
 *
 * @param pyodide - A loaded Pyodide instance (from {@link getPyodide}).
 * @param code    - The Python source code to execute.
 * @param input   - The full stdin string (newline-separated test-case input).
 * @returns An object with `stdout` (captured output) and `stderr` (error text).
 */
export async function runPythonCode(
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
