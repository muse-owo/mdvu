# 🐺 mdvu v1.0.0.0

a minimal, offline browser-based dark-themed markdown viewer. drag n drop a `.md` file onto the page. doesn't upload or anything, completely local

## features

- drag & drop or click to open `.md` / `.markdown` / `.txt` files
- syntax highlighting via highlight.js (github-dark theme)
- scroll progress bar
- fully local. files stay on your machine

## stack

- [Astro](https://astro.build)
- [Svelte 5](https://svelte.dev)
- [marked](https://marked.js.org) — markdown parsing
- [highlight.js](https://highlightjs.org) — code highlighting

## dev

```bash
npm install
npm run dev
```

## build

```bash
npm run build
npm run preview
```

## license

MIT
