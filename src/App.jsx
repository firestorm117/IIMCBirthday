import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./App.css";
import { loadBirthdays } from "./sheet.js";

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

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Sheet names are usually all caps; show them as "Ashutosh Samal".
function titleCase(name) {
  return name.toLowerCase().replace(/(^|[\s'.-])\p{L}/gu, (c) => c.toUpperCase());
}

function weekdayIn(todayWeekday, dist) {
  return WEEKDAY[(todayWeekday + dist) % 7];
}

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

function distLabel(dist) {
  if (dist === 0) return "🎉 today";
  if (dist === 1) return "🎉 tomorrow";
  return `in ${dist} days`;
}

function DateTile({ month, day, weekday }) {
  return (
    <div className="reg-tile" aria-label={`${MONTH_FULL[month - 1]} ${day}`}>
      <span className="reg-tile-month">{MONTH_ABBR[month - 1]}</span>
      <span className="reg-tile-day">{day}</span>
      <span className="reg-tile-weekday">{weekday}</span>
    </div>
  );
}

function Row({ month, day, dist, weekday, people }) {
  return (
    <div className="reg-row">
      <DateTile month={month} day={day} weekday={weekday} />
      <div className="reg-row-people">
        {people.map((p) => (
          <div className="reg-row-person" key={p.id}>
            <span className="reg-row-name">{titleCase(p.name)}</span>
            {p.regno && <span className="reg-row-reg">{p.regno}</span>}
          </div>
        ))}
      </div>
      <span className={"reg-pill" + (dist <= 1 ? " soon" : "")}>{distLabel(dist)}</span>
    </div>
  );
}

export default function BirthdayRegister() {
  const today = useToday();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const todayYear = today.getFullYear();
  const todayWeekday = today.getDay();
  const [windowDays, setWindowDays] = useState(30);
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
                    <div className="reg-empty">Nobody in the next {windowDays} days.</div>
                  ) : (
                    groups.map((g) => <Row key={`${g.month}-${g.day}`} {...g} />)
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
