import { Code2, Upload } from 'lucide-react';

interface ExamUploaderProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export default function ExamUploader({ onUpload, error }: ExamUploaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-10 md:p-14 rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full text-center">
        <div className="bg-violet-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-violet-200">
          <Code2 className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Prova de Programação</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Carregue um arquivo JSON com a lista de problemas para começar. Você poderá navegar pelos enunciados e ver os casos de teste.
        </p>

        <div className="relative group mb-4">
          <input
            type="file"
            accept=".json"
            onChange={onUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 group-hover:border-violet-500 group-hover:bg-violet-50 transition-all flex flex-col items-center">
            <Upload className="w-12 h-12 text-slate-400 mb-4 group-hover:text-violet-500" />
            <span className="text-slate-500 font-medium group-hover:text-violet-600">
              Selecionar arquivo JSON
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Schema hint */}
        <div className="mt-6 bg-slate-50 rounded-2xl p-5 text-left border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Formato esperado
          </p>
          <pre className="text-xs text-slate-600 overflow-x-auto">{`{
  "title": "Nome da Prova",
  "problems": [
    {
      "title": "Problema 1",
      "description": "...",
      "testCases": [
        { "input": "...", "expectedOutput": "..." }
      ]
    }
  ]
}`}</pre>
        </div>
      </div>
    </div>
  );
}
