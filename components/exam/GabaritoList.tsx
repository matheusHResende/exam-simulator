import type { Question, AnswerMap } from '@/types/exam';

interface GabaritoListProps {
  questions: Question[];
  answers: AnswerMap;
}

export default function GabaritoList({ questions, answers }: GabaritoListProps) {
  return (
    <div className="space-y-8 mb-20">
      {questions.map((q, idx) => {
        const userAns = answers[idx];
        const isCorrect = userAns === q.correctAnswer;
        return (
          <div
            key={idx}
            className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between mb-6">
                <span className="bg-slate-100 text-slate-500 text-xs font-black px-4 py-2 rounded-full uppercase tracking-tighter">
                  Questão {idx + 1}
                </span>
                <span
                  className={`flex items-center font-black bg-opacity-10 px-4 py-2 rounded-full text-sm ${
                    isCorrect ? 'text-green-600 bg-green-600' : 'text-red-600 bg-red-600'
                  }`}
                >
                  {isCorrect ? 'CORRETA' : 'INCORRETA'}
                </span>
              </div>

              <div className="mb-8 w-full overflow-x-auto">
                <p className="text-xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {q.question}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div
                  className={`p-5 rounded-2xl border-2 flex items-center ${
                    isCorrect
                      ? 'bg-green-50 border-green-200 text-green-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black mr-4 flex-shrink-0 ${
                      isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {userAns || '?'}
                  </div>
                  <div>
                    <p className="text-xs opacity-60 font-bold uppercase">Sua Resposta</p>
                    <p className="font-bold">
                      {userAns
                        ? q.options[userAns.charCodeAt(0) - 65]
                        : 'Não respondida'}
                    </p>
                  </div>
                </div>

                {!isCorrect && (
                  <div className="p-5 rounded-2xl border-2 bg-indigo-50 border-indigo-200 text-indigo-900 flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black mr-4 flex-shrink-0">
                      {q.correctAnswer}
                    </div>
                    <div>
                      <p className="text-xs opacity-60 font-bold uppercase">Opção Correta</p>
                      <p className="font-bold">
                        {q.options[q.correctAnswer.charCodeAt(0) - 65]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] border border-slate-100 relative">
                <div className="absolute -top-3 left-8 bg-white px-4 border border-slate-100 rounded-full">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                    Justificativa
                  </span>
                </div>
                <p className="text-slate-600 font-medium italic leading-relaxed pt-2">
                  {q.explanation || 'Sem comentário disponível.'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
