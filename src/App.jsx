import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Award,
  BookOpen,
  Upload,
  FileText,
  AlertTriangle,
  TrendingUp,
  History,
  Trash2,
  Calendar,
  Settings,
  Eye
} from 'lucide-react';

const App = () => {
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [status, setStatus] = useState('idle'); // 'idle', 'quiz', 'result', 'history', 'review'
  const [fileName, setFileName] = useState("");
  const [examHistory, setExamHistory] = useState([]);
  const [numQuestions, setNumQuestions] = useState(30);
  const [selectedExam, setSelectedExam] = useState(null); // Para revisão de prova antiga

  // Carregar histórico do LocalStorage ao iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('exam_simulator_history');
    if (savedHistory) {
      setExamHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar resultado no histórico com detalhes das questões para revisão posterior
  const saveToHistory = (score, total, questions, answers) => {
    const newResult = {
      id: Date.now(),
      date: new Date().toLocaleString('pt-BR'),
      score,
      total,
      percentage: Math.round((score / total) * 100),
      questions, // Armazena as questões desta sessão
      answers    // Armazena as respostas dadas
    };
    const updatedHistory = [newResult, ...examHistory];
    setExamHistory(updatedHistory);
    localStorage.setItem('exam_simulator_history', JSON.stringify(updatedHistory));
  };

  const cleanField = (text) => {
    if (!text) return "";
    return text.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    const data = [];
    const firstLine = lines[0] || "";
    const delimiter = firstLine.includes(';') ? ';' : ',';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = [];
      let currentPart = "";
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') { currentPart += '"'; j++; }
          else { inQuotes = !inQuotes; }
        } else if (char === delimiter && !inQuotes) { parts.push(currentPart); currentPart = ""; }
        else { currentPart += char; }
      }
      parts.push(currentPart);
      if (parts.length < 3) continue;
      const options = cleanField(parts[1]).split(';').map(opt => opt.replace(/^[A-D]\)\s*/i, '').trim()).filter(opt => opt !== "");
      data.push({
        question: cleanField(parts[0]),
        options,
        correctAnswer: cleanField(parts[2]).toUpperCase(),
        explanation: cleanField(parts[3]),
      });
    }
    return data;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsedData = parseCSV(e.target.result);
      if (parsedData.length > 0) {
        setAllQuestions(parsedData);
        if (parsedData.length < 30) setNumQuestions(parsedData.length);
      }
      else alert("Erro no formato do CSV.");
    };
    reader.readAsText(file, 'UTF-8');
  };

  const generateNewQuiz = useCallback(() => {
    if (allQuestions.length === 0) return;
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(numQuestions, allQuestions.length));
    setCurrentQuiz(selected);
    setCurrentIndex(0);
    setUserAnswers({});
    setStatus('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [allQuestions, numQuestions]);

  const handleAnswer = (optionIndex) => {
    const letter = String.fromCharCode(65 + optionIndex);
    setUserAnswers(prev => ({ ...prev, [currentIndex]: letter }));
  };

  const finishExam = () => {
    const score = calculateScore();
    saveToHistory(score, currentQuiz.length, currentQuiz, userAnswers);
    setStatus('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateScore = () => {
    let score = 0;
    currentQuiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  const handleReviewExam = (exam) => {
    setSelectedExam(exam);
    setStatus('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (confirm("Deseja apagar todo o seu histórico de evolução?")) {
      setExamHistory([]);
      localStorage.removeItem('exam_simulator_history');
    }
  };

  // Lógica para o gráfico de linhas via SVG
  const lineChartData = useMemo(() => {
    const data = [...examHistory].slice(0, 10).reverse();
    if (data.length < 2) return null;

    const width = 800;
    const height = 200;
    const padding = 40;

    const points = data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding) / (data.length - 1));
      const y = height - padding - (d.percentage * (height - 2 * padding) / 100);
      return { x, y, percentage: d.percentage };
    });

    const d = points.reduce((acc, p, i) =>
      acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");

    return { points, d, width, height };
  }, [examHistory]);

  // Componente Reutilizável de Gabarito
  const GabaritoList = ({ questions, answers }) => (
    <div className="space-y-8 mb-20">
      {questions.map((q, idx) => {
        const userAns = answers[idx];
        const isCorrect = userAns === q.correctAnswer;
        return (
          <div key={idx} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between mb-6">
                <span className="bg-slate-100 text-slate-500 text-xs font-black px-4 py-2 rounded-full uppercase tracking-tighter">Questão {idx + 1}</span>
                <span className={`flex items-center font-black bg-opacity-10 px-4 py-2 rounded-full text-sm ${isCorrect ? 'text-green-600 bg-green-600' : 'text-red-600 bg-red-600'}`}>
                  {isCorrect ? 'CORRETA' : 'INCORRETA'}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-800 mb-8 leading-relaxed">{q.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`p-5 rounded-2xl border-2 flex items-center ${isCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black mr-4 flex-shrink-0 ${isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{userAns || "?"}</div>
                  <div>
                    <p className="text-xs opacity-60 font-bold uppercase">Sua Resposta</p>
                    <p className="font-bold">{userAns ? q.options[userAns.charCodeAt(0) - 65] : "Não respondida"}</p>
                  </div>
                </div>
                {!isCorrect && (
                  <div className="p-5 rounded-2xl border-2 bg-indigo-50 border-indigo-200 text-indigo-900 flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black mr-4 flex-shrink-0">{q.correctAnswer}</div>
                    <div>
                      <p className="text-xs opacity-60 font-bold uppercase">Opção Correta</p>
                      <p className="font-bold">{q.options[q.correctAnswer.charCodeAt(0) - 65]}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-6 md:p-8 rounded-[1.5rem] border border-slate-100 relative">
                <div className="absolute -top-3 left-8 bg-white px-4 border border-slate-100 rounded-full">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Justificativa</span>
                </div>
                <p className="text-slate-600 font-medium italic leading-relaxed pt-2">
                  {q.explanation || "Sem comentário disponível."}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- RENDERS ---

  if (status === 'history') {
    const avgScore = examHistory.length
      ? Math.round(examHistory.reduce((acc, curr) => acc + curr.percentage, 0) / examHistory.length)
      : 0;

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setStatus('idle')} className="text-slate-500 hover:text-slate-800 font-bold flex items-center transition-colors">
              <ChevronLeft className="w-5 h-5 mr-1" /> Voltar
            </button>
            <h2 className="text-2xl font-black text-slate-800">Sua Evolução</h2>
            <button onClick={clearHistory} className="text-red-400 hover:text-red-600 p-2 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Média Geral</p>
              <p className="text-4xl font-black text-indigo-600">{avgScore}%</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Provas Realizadas</p>
              <p className="text-4xl font-black text-slate-800">{examHistory.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <p className="text-slate-400 text-xs font-black uppercase mb-1">Status Atual</p>
              <p className={`text-xl font-black ${avgScore >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                {avgScore >= 70 ? 'Ótimo desempenho!' : 'Continue praticando'}
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-10 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" /> Tendência de Desempenho (Últimas 10 provas)
            </h3>

            {lineChartData ? (
              <div className="relative w-full overflow-x-auto">
                <svg viewBox={`0 0 ${lineChartData.width} ${lineChartData.height}`} className="w-full h-auto min-w-[600px]">
                  {[0, 25, 50, 75, 100].map(val => {
                    const y = 200 - 40 - (val * (200 - 80) / 100);
                    return (
                      <g key={val}>
                        <line x1="40" y1={y} x2="760" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x="30" y={y + 4} fontSize="10" className="fill-slate-400 font-bold" textAnchor="end">{val}%</text>
                      </g>
                    );
                  })}
                  <path d={lineChartData.d} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
                  {lineChartData.points.map((p, i) => (
                    <g key={i} className="group cursor-help">
                      <circle cx={p.x} cy={p.y} r="6" fill="white" stroke="#4f46e5" strokeWidth="3" />
                      <text x={p.x} y={p.y - 15} fontSize="12" fontWeight="900" textAnchor="middle" className="fill-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">{p.percentage}%</text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Realize pelo menos 2 simulados para ver o gráfico de tendência.</p>
              </div>
            )}
            <div className="flex justify-between mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-10">
              <span>Provas Antigas</span>
              <span>Mais Recente</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 px-2">Histórico Detalhado (Clique para Revisar)</h3>
            {examHistory.map((test) => (
              <button
                key={test.id}
                onClick={() => handleReviewExam(test)}
                className="w-full bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-indigo-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${test.percentage >= 70 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    <span className="font-black text-sm">{test.percentage}%</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{test.score} de {test.total} acertos</p>
                    <p className="text-xs text-slate-400 flex items-center"><Calendar className="w-3 h-3 mr-1" /> {test.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-xs font-black px-3 py-1 rounded-full ${test.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {test.percentage >= 70 ? 'APROVADO' : 'REPROVADO'}
                  </div>
                  <Eye className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'review' && selectedExam) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setStatus('history')} className="text-slate-500 hover:text-slate-800 font-bold flex items-center transition-colors">
              <ChevronLeft className="w-5 h-5 mr-1" /> Voltar ao Histórico
            </button>
            <div className="text-right">
              <h2 className="text-xl font-black text-slate-800">Revisão de Prova</h2>
              <p className="text-xs text-slate-400 font-bold">{selectedExam.date}</p>
            </div>
          </div>

          <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-lg mb-10 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">Desempenho nesta prova</p>
              <h3 className="text-4xl font-black">{selectedExam.score} de {selectedExam.total} acertos</h3>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl">
              <p className="text-5xl font-black">{selectedExam.percentage}%</p>
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-800 flex items-center mb-8 px-4">
            <CheckCircle2 className="w-8 h-8 mr-3 text-indigo-600" /> Gabarito da Sessão
          </h3>

          <GabaritoList questions={selectedExam.questions} answers={selectedExam.answers} />

          <div className="text-center pb-20">
            <button
              onClick={() => setStatus('history')}
              className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200"
            >
              Voltar ao Histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 max-w-2xl w-full text-center">
          <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
            <BookOpen className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Simulador de Questões</h1>
          <p className="text-slate-600 mb-10 text-lg leading-relaxed">
            Carregue seu banco de questões em CSV e pratique quantas vezes quiser, acompanhando sua evolução.
          </p>

          {!allQuestions.length ? (
            <div className="relative group mb-4">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 group-hover:border-indigo-500 group-hover:bg-indigo-50 transition-all flex flex-col items-center">
                <Upload className="w-12 h-12 text-slate-400 mb-4 group-hover:text-indigo-500" />
                <span className="text-slate-500 font-medium group-hover:text-indigo-600">Selecionar ficheiro CSV (UTF-8)</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center text-green-700">
                  <FileText className="w-6 h-6 mr-3" />
                  <div className="text-left"><p className="font-bold text-sm leading-none">{fileName}</p><p className="text-xs opacity-75">{allQuestions.length} questões</p></div>
                </div>
                <button onClick={() => { setAllQuestions([]); setFileName(""); }} className="text-xs font-bold text-green-700 hover:underline">Alterar</button>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center font-bold text-slate-700">
                    <Settings className="w-4 h-4 mr-2 text-indigo-500" /> Quantidade de Questões
                  </span>
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-black text-sm">
                    {numQuestions}
                  </span>
                </div>
                <input type="range" min="5" max={Math.min(50, allQuestions.length)} step="5" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                  <span>Mín: 5</span>
                  <span>Máx sugerido: {Math.min(50, allQuestions.length)}</span>
                </div>
              </div>

              <button onClick={generateNewQuiz} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 transform transition active:scale-95 shadow-xl shadow-indigo-200">
                Gerar Simulado de {numQuestions} Questões
              </button>
            </div>
          )}

          {examHistory.length > 0 && (
            <button onClick={() => setStatus('history')} className="mt-6 flex items-center justify-center w-full p-4 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
              <History className="w-5 h-5 mr-2" /> Ver Histórico e Evolução
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'quiz') {
    const question = currentQuiz[currentIndex];
    const progress = ((currentIndex + 1) / currentQuiz.length) * 100;
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Simulado Ativo</p>
              <h2 className="text-2xl font-bold text-slate-800">Questão {currentIndex + 1} <span className="text-slate-400 font-normal">de {currentQuiz.length}</span></h2>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-sm font-bold text-slate-400">{Math.round(progress)}% concluído</span>
              <div className="w-40 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-12 rounded-[2rem] shadow-sm border border-slate-200 mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-10 leading-snug">{question.question}</h3>
            <div className="space-y-4">
              {question.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = userAnswers[currentIndex] === letter;
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center group ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-4 ring-indigo-50' : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'}`}>
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black mr-4 flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>{letter}</span>
                    <span className="font-semibold text-lg">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0} className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all ${currentIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}>
              <ChevronLeft className="w-5 h-5 mr-2" /> Anterior
            </button>
            <button onClick={() => currentIndex === currentQuiz.length - 1 ? finishExam() : setCurrentIndex(currentIndex + 1)} disabled={!userAnswers[currentIndex]} className={`flex items-center px-8 py-4 rounded-xl font-black transition-all shadow-lg ${!userAnswers[currentIndex] ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 transform hover:-translate-y-0.5'}`}>
              {currentIndex === currentQuiz.length - 1 ? 'Finalizar Prova' : 'Próxima Questão'} <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'result') {
    const score = calculateScore();
    const total = currentQuiz.length;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-xl border border-slate-200 text-center mb-12 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-3 ${passed ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <div className={`w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-3 ${passed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}><Award className="w-16 h-16" /></div>
            <h2 className="text-4xl font-black text-slate-900 mb-2">{passed ? "Aprovação!" : "Continue Praticando"}</h2>
            <p className="text-slate-500 text-xl mb-10">Resultado salvo no seu histórico pessoal.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-xs font-black text-slate-400 uppercase mb-1">Acertos</p><p className="text-3xl font-black text-slate-800">{score}</p></div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-xs font-black text-slate-400 uppercase mb-1">Erros</p><p className="text-3xl font-black text-slate-800">{total - score}</p></div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-xs font-black text-slate-400 uppercase mb-1">Média</p><p className={`text-3xl font-black ${passed ? 'text-green-600' : 'text-amber-600'}`}>{percentage}%</p></div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-xs font-black text-slate-400 uppercase mb-1">Total</p><p className="text-3xl font-black text-slate-800">{total}</p></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={generateNewQuiz} className="flex items-center justify-center px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 transform hover:-translate-y-1"><RotateCcw className="w-6 h-6 mr-3" /> Repetir Simulado</button>
              <button onClick={() => setStatus('history')} className="flex items-center justify-center px-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"><TrendingUp className="w-6 h-6 mr-3" /> Ver Evolução</button>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 flex items-center mb-8 px-4"><CheckCircle2 className="w-8 h-8 mr-3 text-indigo-600" /> Gabarito Corrigido</h3>
          <GabaritoList questions={currentQuiz} answers={userAnswers} />
        </div>
      </div>
    );
  }
  return null;
};

export default App;