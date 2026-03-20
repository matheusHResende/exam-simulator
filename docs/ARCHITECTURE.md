# Architecture Overview – Exam Simulator

## Layer Diagram

```
app/              ← Next.js App Router pages & layouts (presentation layer)
  └─ page.tsx     ← Orchestrates components; holds page-level state (exam/page.tsx is self-contained)

components/       ← Reusable React components (no direct I/O)
  exam/           ← MCQ-specific UI
  programming/    ← IDE, summary, uploader, problem viewer

hooks/            ← Custom React hooks (state + business logic)
  useProgrammingExam.ts  ← All /programming page state in one place

lib/              ← Pure utility modules (no React, no DOM except where noted)
  programming.ts  ← Archive creation & download (uses DOM)
  pyodide.ts      ← Pyodide loading & Python execution (browser-only)
  storage.ts      ← localStorage wrappers (browser-only, SSR-safe guards)

types/            ← Shared TypeScript interfaces only — no logic
```

---

## Data Flow — Prova de Programação (`/programming`)

```
JSON file selected
    │
    ▼
useProgrammingExam.handleFileUpload
    │  parses JSON → ProblemSet
    │  derives storageKey (slug of title)
    │
    ▼
ProgrammingPage renders ProblemViewer
    │
    ├─► ProblemViewer — renders left (description) / right (IDE) panels
    │       │
    │       └─► CodeRunner
    │               │  on mount: reads code & results from localStorage
    │               │  on code change: saves to localStorage
    │               │  on "Executar":
    │               │      getPyodide() ──► CDN load (first time only)
    │               │      runPythonCode() per test case
    │               │      saves results to localStorage
    │               │      calls onResultsChange(results)
    │               │
    │               └─► useProgrammingExam.handleResultsChange
    │                       updates allResults[index]
    │
    └─► "Finalizar" → handleFinish → showSummary = true
            │
            ▼
        ExamSummary
            reads storageKey + problem codes from localStorage
            offers: download .tar.gz, load new exam, go back to problem
```

---

## Data Flow — Simulador de Questões (`/exam`)

```
CSV file selected
    │
    ▼
parseCSV() → Question[]     (defined inline in exam/page.tsx)
    │
    ▼
generateNewQuiz()
    shuffles + slices → currentQuiz
    │
    ▼
quiz status: one question at a time
    handleAnswer() → userAnswers[currentIndex]
    │
    ▼
finishExam()
    calculateScore()
    saveToHistory() → localStorage("exam_simulator_history")
    status = 'result'
    │
    ├─► GabaritoList — rendered for both 'result' and 'review' statuses
    │
    └─► history status
            renders SVG line chart (built inline; no chart library)
            lists ExamResult[] from localStorage
```

---

## localStorage Key Schema

| Key pattern | Content | Cleared by |
|-------------|---------|------------|
| `exam_simulator_history` | `ExamResult[]` (JSON) | User via "Apagar histórico" |
| `prog_code_<slug>_<n>` | Python source code string | Never (accumulates) |
| `prog_results_<slug>_<n>` | `TestResult[]` (JSON) | Re-running a problem |

`<slug>` is derived by `makeStorageKey(title)` — lowercase alphanumeric, underscores, max 40 chars.

---

## Pyodide Execution Model

1. **Lazy load** – `getPyodide()` injects a `<script>` tag the first time it is called and then calls `window.loadPyodide()`.
2. **Singleton** – the resolved instance is stored on `window._pyodideInstance`; subsequent calls return it immediately.
3. **stdin simulation** – `runPythonCode()` wraps user code in a Python harness that:
   - Splits the input string on `\n` and stores each line in a list.
   - Replaces `builtins.input` with a custom function that pops from the list.
   - Replaces `sys.stdin` with `io.StringIO(inputString)`.
   - Redirects `sys.stdout` to an `io.StringIO` buffer and returns it after execution.
4. **Comparison** – `stdout.trimEnd()` is compared against `expectedOutput.trimEnd()` (trailing whitespace is ignored).

---

## Component: `CodeRunner`

`CodeRunner` is the core interactive component for both `/programming` and `/programming/create`.

| Aspect | Detail |
|--------|--------|
| Ref API | `forwardRef<CodeRunnerRef, CodeRunnerProps>` — exposes `runCode()`, `resetCode()`, `hasCodeChanged` |
| State | `code`, `results`, `isRunning`, `loadingPyodide`, `globalError` |
| Persistence | Reads on mount via `loadFromStorage`; writes on every code change (`saveToStorage`) |
| Navigation | When `problemIndex` changes, loads the saved state for the new problem |
| Keyboard | `Ctrl+Enter` (or `Cmd+Enter`) bound inside Monaco to call `runCode` via a stable ref |
| Layout | Vertical `PanelGroup` — top: Monaco editor; bottom: test-case results panel |

---

## Responsiveness

Breakpoint: `1024 px` (`lg` in Tailwind).

| Viewport | Layout |
|----------|--------|
| `≥ 1024 px` | Horizontal `PanelGroup` — description left, IDE right; page height locked to viewport (`lg:h-screen`) |
| `< 1024 px` | Stacked flex column; panels scroll freely; IDE panel has a fixed `h-[500px]` |

The breakpoint is detected via `window.matchMedia` in a `useEffect` and stored in component state (`isMobile`).
