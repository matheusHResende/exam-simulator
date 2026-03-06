# 📚 Simulador de Questões

A browser-based exam simulator built with **React + Vite**. Upload a CSV bank of questions and practice as many times as you like, tracking your performance over time.

## Features

- **CSV question bank** — load any UTF-8 CSV file with questions, options, correct answers, and explanations
- **Configurable quiz length** — choose between 5 and 50 questions per session
- **Randomised question order** — each session draws a random subset from the full bank
- **Instant feedback** — corrected answer sheet (gabarito) shown after every quiz
- **History & trends** — session results are persisted in `localStorage` with a performance trend chart
- **Review past exams** — revisit any previous session and inspect every answer

## CSV Format

The CSV must have the following columns (`;` or `,` delimited, first row is the header):

| Column | Description |
|--------|-------------|
| `question` | Question text |
| `options` | Options separated by `;` (e.g. `A) Foo;B) Bar;C) Baz;D) Qux`) |
| `correct_answer` | Letter of the correct option (`A`, `B`, `C`, or `D`) |
| `explanation` | Optional explanation shown in the answer sheet |

## Tech Stack

- [React 19](https://react.dev/)
- [Vite 7](https://vite.dev/)
- [Lucide React](https://lucide.dev/) — icons

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.
