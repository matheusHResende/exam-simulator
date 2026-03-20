# 📚 Simulador de Provas

A browser-based exam simulator built with **Next.js 16 · TypeScript · Tailwind CSS 4**. It covers two use cases:

1. **Simulador de Questões** – Upload a CSV question bank and practice multiple-choice exams with instant feedback, scoring and a performance-trend history.
2. **Prova de Programação** – Upload a JSON problem set and solve each problem with an in-browser Python IDE powered by [Pyodide](https://pyodide.org). Test cases are run client-side; results are saved to `localStorage`.
3. **Prática Livre** – Create and solve your own programming problems directly in the browser, then export the problem set as JSON or download your code as a `.tar.gz` archive.

---

## Features

### Simulador de Questões (`/exam`)
- **CSV question bank** — upload any UTF-8 CSV with questions, options, correct answers, and explanations
- **Configurable quiz length** — choose 5–50 questions per session via a slider
- **Randomised order** — each session draws a random subset from the full bank
- **Instant gabarito** — corrected answer sheet shown immediately after finishing
- **History & trends** — session results persisted in `localStorage`; SVG line chart shows the last 10 sessions
- **Review past exams** — revisit any saved session question by question

### Prova de Programação (`/programming`)
- **JSON problem set** — upload a problem set file (see format below)
- **Browser Python IDE** — Monaco editor with Python syntax highlighting and `Ctrl+Enter` shortcut to run
- **In-browser execution** — Pyodide (WebAssembly CPython) runs code 100% client-side, no server required
- **Per-problem test cases** — each test case checks `stdout` against expected output
- **Auto-save** — submitted code and test results are saved in `localStorage` per exam + problem index
- **Summary screen** — overall score, per-problem breakdown, download code as `.tar.gz`
- **Responsive layout** — split-panel IDE on desktop; stacked panels on mobile

### Prática Livre (`/programming/create`)
- **Editor-first workflow** — create exam title, problem titles, descriptions, and test cases in the browser
- **Live testing** — write & run Python code against your own test cases (same IDE as the exam mode)
- **Export** — when all problems pass, download the problem set as JSON (for later use in `/programming`) and/or download your code as a `.tar.gz`

---

## File Formats

### CSV (Simulador de Questões)

Delimiter: `;` or `,` (auto-detected from the header row). First row must be the header.

| Column | Description |
|--------|-------------|
| `question` | Question text |
| `options` | Options separated by `;` — e.g. `A) Foo;B) Bar;C) Baz;D) Qux` |
| `correct_answer` | Correct option letter (`A`, `B`, `C`, or `D`) |
| `explanation` | *(Optional)* Explanation shown in the gabarito |

### JSON (Prova de Programação / Prática Livre)

```json
{
  "title": "Nome da Prova",
  "problems": [
    {
      "title": "Problema 1",
      "description": "Leia dois inteiros e imprima a soma.",
      "testCases": [
        { "input": "2\n3", "expectedOutput": "5" },
        { "input": "10\n20", "expectedOutput": "30" }
      ]
    }
  ]
}
```

Test case matching is done by comparing `stdout.trimEnd()` against `expectedOutput.trimEnd()`.

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Code editor | [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) |
| Python runtime | [Pyodide v0.27](https://pyodide.org/) (loaded from CDN) |
| Split panels | [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) |
| Archive creation | [fflate](https://github.com/101arrowz/fflate) (tar + gzip) |
| Icons | [lucide-react](https://lucide.dev/) |
| Deployment | [Vercel](https://vercel.com/) |

---

## Project Structure

```
exam-simulator/
├── app/
│   ├── layout.tsx               # Root layout — Inter font, global SEO metadata
│   ├── page.tsx                 # Home: three mode-selection cards
│   ├── robots.ts                # /robots.txt
│   ├── sitemap.ts               # /sitemap.xml
│   ├── exam/
│   │   ├── layout.tsx           # /exam SEO metadata
│   │   └── page.tsx             # Full exam simulator (CSV upload → quiz → result → history)
│   └── programming/
│       ├── layout.tsx           # /programming SEO metadata
│       ├── page.tsx             # Programming exam (JSON upload → IDE per problem → summary)
│       └── create/
│           ├── layout.tsx       # /programming/create SEO metadata
│           └── page.tsx         # Free-practice exam builder
├── components/
│   ├── exam/
│   │   └── GabaritoList.tsx     # Renders the corrected answer sheet for MCQ exams
│   └── programming/
│       ├── CodeRunner.tsx        # Monaco IDE + Pyodide execution + test-case results panel
│       ├── ExamSummary.tsx       # Post-exam summary card with per-problem breakdown
│       ├── ExamUploader.tsx      # File drop/select UI with JSON schema hint
│       └── ProblemViewer.tsx     # Problem description + CodeRunner in split-panel layout
├── hooks/
│   └── useProgrammingExam.ts    # State management for /programming: file upload, navigation, results
├── lib/
│   ├── programming.ts           # formatPythonComment, createTarArchive, downloadCodeArchive
│   ├── pyodide.ts               # getPyodide (singleton loader), runPythonCode (stdin simulation)
│   └── storage.ts               # localStorage helpers: makeStorageKey, loadFromStorage, saveToStorage
├── types/
│   ├── exam.ts                  # Question, AnswerMap, ExamResult
│   └── programming.ts           # TestCase, Problem, ProblemSet, TestResult
├── public/                      # Static assets
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
```

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm start` | Start the production server |

---

## Architecture Notes

- **All Python execution is client-side.** Pyodide is lazy-loaded from the jsDelivr CDN the first time a user clicks "Executar". A singleton is cached on `window._pyodideInstance` to avoid repeated downloads.
- **`stdin` simulation.** `runPythonCode` wraps user code in a Python snippet that replaces `sys.stdin` and `builtins.input` with a list of pre-split input lines, so standard competitive-programming I/O patterns work out of the box.
- **localStorage keys** follow the pattern `prog_code_<storageKey>_<index>` (code) and `prog_results_<storageKey>_<index>` (results), where `storageKey` is a URL-safe slug derived from the exam title.
- **`CodeRunner`** is a `forwardRef` component exposing `runCode`, `resetCode`, and `hasCodeChanged` via an imperative handle, allowing parent components to trigger execution programmatically.
- **Responsive layout** breakpoint is `1024 px` (Tailwind `lg`). Below this width panels switch from side-by-side to stacked.

---

## SEO

- Static `metadata` exports on every layout and page.
- `app/robots.ts` and `app/sitemap.ts` are generated at build time.
- OpenGraph and Twitter card metadata defined in `app/layout.tsx`.
- Deployed at `https://exam-simulator.vercel.app`.
