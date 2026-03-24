import { Terminal, AlertCircle } from 'lucide-react';

interface ScriptErrorProps {
  error: string;
}

export function ScriptError({ error }: ScriptErrorProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/40 overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-700 bg-red-100/50 border-b border-red-200">
        <AlertCircle className="w-4 h-4" />
        Erro de Execução
      </div>
      <div className="p-4 bg-red-950/5">
        <pre className="text-sm font-mono text-red-600 whitespace-pre-wrap break-all">
          {error}
        </pre>
      </div>
    </div>
  );
}
