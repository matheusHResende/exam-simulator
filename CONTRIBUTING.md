# Contributing

## Development setup

```bash
npm install
npm run dev   # starts Next.js dev server at http://localhost:3000
```

## Adding a new route / feature

| What you want to add | Where to put it |
|----------------------|----------------|
| A new page | `app/<route>/page.tsx` |
| Page-level metadata (SEO) | `app/<route>/layout.tsx` |
| Reusable UI component | `components/<area>/<ComponentName>.tsx` |
| State logic shared across components | `hooks/use<Name>.ts` |
| Pure utility function (no React) | `lib/<name>.ts` |
| Shared TypeScript types | `types/<name>.ts` |

## Coding conventions

- TypeScript strict mode is active — avoid `any` where possible.
- Name files and components in **PascalCase** for components, **camelCase** for hooks and lib modules.
- Keep `lib/` modules free of JSX and React hooks.
- Keep `types/` modules free of logic — interfaces/types only.
- Wrap browser-only code (`localStorage`, `window`, `document`) in `typeof window !== 'undefined'` guards so pages survive server-side rendering.

## Adding a new problem type / exam mode

1. Define the data shape in `types/`.
2. Add localStorage helpers in `lib/storage.ts` if needed.
3. Create a custom hook in `hooks/` for page-level state management.
4. Build the components in `components/<mode>/`.
5. Create the route in `app/<mode>/page.tsx` and wire the hook + components together.
6. Add the new mode card to `app/page.tsx` (home).
7. Update `app/sitemap.ts` with the new route.

## Code style

- Tailwind utility classes only — no inline `style` props (except for dynamic SVG `d` paths etc.).
- Use the `lucide-react` icon library for all iconography.
- Keep component files focused: if a `page.tsx` grows beyond ~200 lines of JSX, extract parts into `components/`.

## Build & deploy

```bash
npm run build   # type-checks and builds Next.js
npm start       # runs the production server locally
```

Deployments are handled automatically by Vercel on push to `main`.
