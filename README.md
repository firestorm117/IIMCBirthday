# IIMCBirthday

A birthday register for the MBA cohort, built with React and Vite.

## Getting started

Requires Node (see `.nvmrc`).

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Project layout

```
index.html       entry page
src/main.jsx     React entry point
src/App.jsx      app UI and birthday data
src/App.css      styles
```

## Updating birthdays

The birthday list is the `BIRTHDAYS` array at the top of `src/App.jsx`. Each entry has `name`, `regno`, `month` and `day`.
