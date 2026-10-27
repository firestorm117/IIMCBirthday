import React, { useState, useMemo } from "react";
import "./App.css";
import BIRTHDAYS from "./birthdays.json";

const TOTAL_RECORDS = 484;

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WINDOWS = [7, 14, 30, 60];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function daysUntil(month, day, todayMonth, todayDay, todayYear) {
  if (month === todayMonth && day === todayDay) return 0;
  let target = new Date(todayYear, month - 1, Math.min(day, daysInMonth(month, todayYear)));
  const today = new Date(todayYear, todayMonth - 1, todayDay);
  if (target < today) {
    target = new Date(todayYear + 1, month - 1, Math.min(day, daysInMonth(month, todayYear + 1)));
  }
  const diff = Math.round((target - today) / 86400000);
  return diff;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function BirthdayRegister() {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const todayYear = now.getFullYear();
  const [windowDays, setWindowDays] = useState(30);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    return BIRTHDAYS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.regno.toLowerCase().includes(q)
    )
      .map((p) => ({ ...p, dist: daysUntil(p.month, p.day, todayMonth, todayDay, todayYear) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [q, todayMonth, todayDay, todayYear]);

  const { todayList, groups } = useMemo(() => {
    const withDist = BIRTHDAYS.map((p) => ({
      ...p,
      dist: daysUntil(p.month, p.day, todayMonth, todayDay, todayYear),
    }));
    const todayList = withDist.filter((p) => p.dist === 0);
    const upcoming = withDist
      .filter((p) => p.dist > 0 && p.dist <= windowDays)
      .sort((a, b) => a.dist - b.dist || a.name.localeCompare(b.name));

    const groups = [];
    let current = null;
    for (const p of upcoming) {
      if (!current || current.month !== p.month || current.day !== p.day) {
        current = { month: p.month, day: p.day, dist: p.dist, people: [] };
        groups.push(current);
      }
      current.people.push(p);
    }
    return { todayList, groups };
  }, [windowDays, todayMonth, todayDay, todayYear]);

  return (
    <div className="reg-root">
      <div className="reg-wrap">
        <div className="reg-header">
          <h1 className="reg-title">Birthday Register</h1>
          <p className="reg-sub">MBA cohort · {BIRTHDAYS.length} entries with a recorded date of birth</p>
        </div>

        <div className="reg-hero">
          <p className="reg-hero-date">
            {MONTH_FULL[todayMonth - 1]} {ordinal(todayDay)}, {todayYear}
          </p>
          {todayList.length === 0 ? (
            <div className="reg-hero-empty">No birthdays today.</div>
          ) : (
            <div className="reg-hero-card">
              <p className="reg-hero-headline">
                {todayList.length === 1 ? "Birthday today" : `${todayList.length} birthdays today`}
              </p>
              {todayList.map((p) => (
                <div className="reg-hero-person" key={p.regno}>
                  <span className="reg-hero-person-name">{p.name}</span>
                  <span className="reg-hero-person-reg">{p.regno}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          className="reg-search"
          type="search"
          placeholder="Search by name or reg no."
          aria-label="Search birthdays"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
          }}
        />

        {q ? (
          <div className="reg-list" aria-live="polite">
            {matches.length === 0 ? (
              <div className="reg-empty-upcoming">No matches.</div>
            ) : (
              matches.map((p) => (
                <div className="reg-row" key={p.regno}>
                  <div className="reg-row-date">
                    {MONTH_ABBR[p.month - 1]} {p.day}
                  </div>
                  <div className="reg-row-people">
                    <div className="reg-row-name-line">
                      <span className="reg-row-name">{p.name}</span>
                      <span className="reg-row-reg">{p.regno}</span>
                    </div>
                  </div>
                  <div className="reg-row-dist">
                    {p.dist === 0 ? "today" : p.dist === 1 ? "tomorrow" : `in ${p.dist} days`}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="reg-controls">
              <h2 className="reg-controls-title">Upcoming</h2>
              <div className="reg-tabs" role="group" aria-label="Upcoming window">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={windowDays === w}
                    aria-label={`Next ${w} days`}
                    className={"reg-tab" + (windowDays === w ? " active" : "")}
                    onClick={() => setWindowDays(w)}
                  >
                    {w}d
                  </button>
                ))}
              </div>
            </div>

            <div className="reg-list">
              {groups.length === 0 ? (
                <div className="reg-empty-upcoming">Nobody in the next {windowDays} days.</div>
              ) : (
                groups.map((g) => (
                  <div className="reg-row" key={`${g.month}-${g.day}`}>
                    <div className="reg-row-date">
                      {MONTH_ABBR[g.month - 1]} {g.day}
                    </div>
                    <div className="reg-row-people">
                      {g.people.map((p) => (
                        <div className="reg-row-name-line" key={p.regno}>
                          <span className="reg-row-name">{p.name}</span>
                          <span className="reg-row-reg">{p.regno}</span>
                        </div>
                      ))}
                    </div>
                    <div className="reg-row-dist">
                      {g.dist === 1 ? "tomorrow" : `in ${g.dist} days`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="reg-footer">
          {BIRTHDAYS.length} of {TOTAL_RECORDS} records had a parseable date of birth.
        </div>
      </div>
    </div>
  );
}
