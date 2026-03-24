export class PyodideWorkerManager {
  private worker: Worker | null = null;
  private messageId = 0;
  private callbacks = new Map<
    number,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >();

  async init(): Promise<void> {
    if (!this.worker) {
      // NOTE: Next.js supports this Webpack 5 syntax natively
      this.worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url));
      
      this.worker.onmessage = (e) => {
        const { id, type, stdout, stderr, error } = e.data;
        const callback = this.callbacks.get(id);
        
        if (callback) {
          if (type === 'RUN_DONE') {
            callback.resolve({ stdout, stderr });
          } else if (type === 'INIT_DONE') {
            callback.resolve(undefined);
          } else {
            callback.reject(new Error(error));
          }
          this.callbacks.delete(id);
        }
      };

      this.worker.onerror = (err: ErrorEvent) => {
        for (const cb of this.callbacks.values()) {
          cb.reject(new Error('Worker error: ' + err.message));
        }
        this.callbacks.clear();
      };
    }
    await this.postMessage('INIT');
  }

  runCode(code: string, input: string): Promise<{ stdout: string; stderr: string }> {
    return this.postMessage('RUN', { code, input });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      for (const cb of this.callbacks.values()) {
        cb.reject(new Error('Execução interrompida manualmente.'));
      }
      this.callbacks.clear();
    }
  }

  private postMessage(type: string, payload: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        return reject(new Error('Worker is not initialized.'));
      }
      const id = this.messageId++;
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, ...payload });
    });
  }
}

export type PyodideInstance = PyodideWorkerManager;

let sharedManager: PyodideWorkerManager | null = null;

export async function getPyodide(): Promise<PyodideInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Pyodide can only be loaded in the browser');
  }
  if (!sharedManager) {
    sharedManager = new PyodideWorkerManager();
  }
  await sharedManager.init();
  return sharedManager;
}

export async function runPythonCode(
  manager: PyodideInstance,
  code: string,
  input: string
): Promise<{ stdout: string; stderr: string }> {
  return manager.runCode(code, input);
}
