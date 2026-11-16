import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./App.css";
import { loadBirthdays } from "./sheet.js";
import { MONTH_FULL, daysUntil, ordinal, weekdayIn } from "./dates.js";
import Row, { titleCase } from "./Row.jsx";
import Calendar from "./Calendar.jsx";

const WINDOWS = [7, 14, 30, 60];

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// The current date, refreshed just after local midnight. Phones and laptops
// pause timers while asleep, so also re-check when the page becomes visible.
function useToday() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => {
      const now = new Date();
      setToday((prev) => (dateKey(prev) === dateKey(now) ? prev : now));
    };
    const nextMidnight = new Date(today);
    nextMidnight.setHours(24, 0, 1, 0);
    const timer = setTimeout(refresh, nextMidnight - Date.now());
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [today]);

  return today;
}

const MODES = [
  ["upcoming", "Upcoming"],
  ["calendar", "Calendar"],
];

// Remember the last view on this device; storage can be unavailable.
function readMode() {
  try {
    return localStorage.getItem("reg-mode") === "calendar" ? "calendar" : "upcoming";
  } catch {
    return "upcoming";
  }
}

function saveMode(mode) {
  try {
    localStorage.setItem("reg-mode", mode);
  } catch {
    // Not critical.
  }
}

export default function BirthdayRegister() {
  const today = useToday();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const todayYear = today.getFullYear();
  const todayWeekday = today.getDay();
  const [windowDays, setWindowDays] = useState(30);
  const [mode, setMode] = useState(readMode);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    loadBirthdays()
      .then((list) => {
        setPeople(list);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message || "Could not load birthdays.");
        setStatus("error");
      });
  }, []);

  useEffect(load, [load]);
  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || p.regno.toLowerCase().includes(q)
    )
      .map((p) => {
        const dist = daysUntil(p.month, p.day, todayMonth, todayDay, todayYear);
        return { ...p, dist, weekday: weekdayIn(todayWeekday, dist) };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, q, todayMonth, todayDay, todayYear, todayWeekday]);

  const { todayList, groups } = useMemo(() => {
    const withDist = people.map((p) => ({
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
        current = {
          month: p.month,
          day: p.day,
          dist: p.dist,
          weekday: weekdayIn(todayWeekday, p.dist),
          people: [],
        };
        groups.push(current);
      }
      current.people.push(p);
    }
    return { todayList, groups };
  }, [people, windowDays, todayMonth, todayDay, todayYear, todayWeekday]);

  return (
    <div className="reg-root">
      <div className="reg-bunting" aria-hidden="true" />
      <div className="reg-wrap">
        <header className="reg-header">
          <h1 className="reg-title">
            Birthday <span className="reg-title-accent">Register</span>
          </h1>
          <p className="reg-sub">MBA cohort</p>
        </header>

        <section className="reg-hero">
          <p className="reg-hero-date">
            {MONTH_FULL[todayMonth - 1]} {ordinal(todayDay)}, {todayYear}
          </p>
          {status === "loading" ? (
            <div className="reg-frame reg-hero-empty">Loading birthdays…</div>
          ) : status === "error" ? (
            <div className="reg-frame reg-hero-empty reg-error" role="alert">
              {error}{" "}
              <button type="button" className="reg-retry" onClick={load}>
                Retry
              </button>
            </div>
          ) : todayList.length === 0 ? (
            <div className="reg-frame reg-hero-empty">No birthdays today.</div>
          ) : (
            <div className="reg-frame reg-hero-card">
              <p className="reg-hero-headline">
                <span aria-hidden="true">🎂</span> Happy Birthday!
              </p>
              <p className="reg-hero-count">
                {todayList.length === 1 ? "1 birthday today" : `${todayList.length} birthdays today`}
              </p>
              {todayList.map((p) => (
                <div className="reg-hero-person" key={p.id}>
                  <span className="reg-hero-person-name">{titleCase(p.name)}</span>
                  {p.regno && <span className="reg-hero-person-reg">{p.regno}</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        {status === "ready" && (
          <>
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
                  <div className="reg-empty">No matches.</div>
                ) : (
                  matches.map((p) => (
                    <Row
                      key={p.id}
                      month={p.month}
                      day={p.day}
                      dist={p.dist}
                      weekday={p.weekday}
                      people={[p]}
                    />
                  ))
                )}
              </div>
            ) : (
              <>
                <div className="reg-controls">
                  <div className="reg-views" role="group" aria-label="View">
                    {MODES.map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={mode === key}
                        className={"reg-view" + (mode === key ? " active" : "")}
                        onClick={() => {
                          setMode(key);
                          saveMode(key);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {mode === "upcoming" && (
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
                  )}
                </div>

                {mode === "calendar" ? (
                  <Calendar people={people} today={today} />
                ) : (
                  <div className="reg-list">
                    {groups.length === 0 ? (
                      <div className="reg-empty">Nobody in the next {windowDays} days.</div>
                    ) : (
                      groups.map((g) => <Row key={`${g.month}-${g.day}`} {...g} />)
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
