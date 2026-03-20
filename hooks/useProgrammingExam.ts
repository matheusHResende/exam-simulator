import { useState, useCallback } from 'react';
import type { ProblemSet, TestResult } from '@/types/programming';
import { makeStorageKey } from '@/lib/storage';

export function useProgrammingExam() {
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [storageKey, setStorageKey] = useState('');
  const [allResults, setAllResults] = useState<(TestResult[] | null)[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: ProblemSet = JSON.parse(e.target?.result as string);
        if (!parsed.problems || !Array.isArray(parsed.problems)) {
          throw new Error('O JSON não contém um array "problems".');
        }
        const key = makeStorageKey(parsed.title || file.name);
        setProblemSet(parsed);
        setStorageKey(key);
        setCurrentIndex(0);
        setAllResults(new Array(parsed.problems.length).fill(null));
        setShowSummary(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Formato JSON inválido.');
        setProblemSet(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleResultsChange = useCallback((index: number, results: TestResult[] | null) => {
    setAllResults((prev) => {
      const next = [...prev];
      next[index] = results;
      return next;
    });
  }, []);

  const handleFinish = useCallback(() => setShowSummary(true), []);
  
  const handleRestart = useCallback(() => {
    setShowSummary(false);
    setCurrentIndex(0);
  }, []);

  return {
    problemSet,
    currentIndex,
    setCurrentIndex,
    fileName,
    error,
    storageKey,
    allResults,
    showSummary,
    setShowSummary,
    handleFileUpload,
    handleResultsChange,
    handleFinish,
    handleRestart,
  };
}
