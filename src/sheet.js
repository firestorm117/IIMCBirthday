import { SHEET_ID, SHEET_TAB } from "./config.js";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function sheetCsvUrl() {
  return (
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}` +
    `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`
  );
}

// Minimal RFC 4180 parser: quoted fields, escaped quotes, commas and newlines inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseMonth(value) {
  const v = value.trim().toLowerCase();
  const n = Number(v);
  if (Number.isInteger(n)) return n;
  const i = MONTHS.indexOf(v.slice(0, 3));
  return i === -1 ? NaN : i + 1;
}

// Turns sheet rows into { id, name, regno, month, day }, matching columns by header
// name and skipping rows with a missing name or an impossible date.
export function rowsToPeople(rows) {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  const col = (...names) => header.findIndex((h) => names.includes(h));
  const iName = col("name");
  const iReg = col("regno", "registrationno", "registrationnumber", "reg");
  const iMonth = col("month");
  const iDay = col("day");
  if (iName === -1 || iMonth === -1 || iDay === -1) {
    throw new Error("Sheet needs Name, Month and Day columns.");
  }

  const people = [];
  for (const r of rows.slice(1)) {
    const name = (r[iName] || "").trim();
    const regno = iReg === -1 ? "" : (r[iReg] || "").trim();
    const month = parseMonth(r[iMonth] || "");
    const day = Number((r[iDay] || "").trim());
    if (!name || !Number.isInteger(day) || month < 1 || month > 12) continue;
    if (day < 1 || day > DAYS_IN_MONTH[month - 1]) continue;
    people.push({ id: people.length, name, regno, month, day });
  }
  return people;
}

export async function loadBirthdays() {
  const res = await fetch(sheetCsvUrl());
  if (!res.ok) throw new Error(`Could not load the sheet (HTTP ${res.status}).`);
  const text = await res.text();
  // A private sheet answers with Google's sign-in page instead of CSV.
  if (/^\s*</.test(text)) throw new Error("The sheet is not public. Share it as \"Anyone with the link can view\".");
  return rowsToPeople(parseCsv(text));
}
