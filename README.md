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
index.html          entry page
src/main.jsx        React entry point
src/App.jsx         app UI
src/App.css         styles
src/config.js       Google Sheet ID and tab name
src/sheet.js        loads and parses the sheet
```

## Updating birthdays

The birthday list lives in `src/birthdays.json`. Each entry has `name`, `regno`, `month` and `day`.
