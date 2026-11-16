import React, { useMemo, useState } from "react";
import { MONTH_FULL, WEEKDAY, daysInMonth } from "./dates.js";
import Row from "./Row.jsx";

const MAX_DOTS = 3;
// Countdown pills only make sense for dates coming up soon.
const PILL_WITHIN_DAYS = 60;

export default function Calendar({ people, today }) {
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const [shown, setShown] = useState({ year: todayYear, month: todayMonth });
  const [selected, setSelected] = useState(todayDay);

  const lastDay = daysInMonth(shown.month, shown.year);
  const firstWeekday = new Date(shown.year, shown.month - 1, 1).getDay();
  const isTodayMonth = shown.year === todayYear && shown.month === todayMonth;

  // Feb 29 birthdays land on Feb 28 in non-leap years, matching daysUntil.
  const byDay = useMemo(() => {
    const map = new Map();
    for (const p of people) {
      if (p.month !== shown.month) continue;
      const d = Math.min(p.day, lastDay);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(p);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [people, shown.month, lastDay]);

  const monthTotal = useMemo(
    () => [...byDay.values()].reduce((n, list) => n + list.length, 0),
    [byDay]
  );

  const shift = (delta) => {
    setShown(({ year, month }) => {
      const m = month - 1 + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 };
    });
    setSelected(null);
  };

  const goToday = () => {
    setShown({ year: todayYear, month: todayMonth });
    setSelected(todayDay);
  };

  const selectedPeople = selected ? byDay.get(selected) || [] : [];
  // Real distance to the date being viewed, so a day in another year never
  // reads as "tomorrow". Negative for past dates.
  const selectedDist = selected
    ? Math.round(
        (new Date(shown.year, shown.month - 1, selected) - new Date(todayYear, todayMonth - 1, todayDay)) /
          86400000
      )
    : null;
  const monthName = MONTH_FULL[shown.month - 1];

  return (
    <div className="reg-cal-wrap">
      <div className="reg-cal">
        <div className="reg-cal-head">
          <button type="button" className="reg-cal-nav" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <div className="reg-cal-title" aria-live="polite">
            {monthName} {shown.year}
          </div>
          <button type="button" className="reg-cal-nav" onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="reg-cal-grid">
          {WEEKDAY.map((w) => (
            <div className="reg-cal-dow" key={w} aria-hidden="true">
              {w[0]}
            </div>
          ))}
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: lastDay }, (_, i) => {
            const day = i + 1;
            const list = byDay.get(day) || [];
            const isToday = isTodayMonth && day === todayDay;
            const label =
              `${monthName} ${day}` +
              (list.length ? `, ${list.length} birthday${list.length === 1 ? "" : "s"}` : "") +
              (isToday ? ", today" : "");
            return (
              <button
                key={day}
                type="button"
                className={
                  "reg-cal-day" +
                  (list.length ? " has" : "") +
                  (isToday ? " is-today" : "") +
                  (selected === day ? " selected" : "")
                }
                aria-label={label}
                aria-pressed={selected === day}
                onClick={() => setSelected(day)}
              >
                <span>{day}</span>
                {list.length > 0 && (
                  <span className="reg-cal-dots" aria-hidden="true">
                    {list.slice(0, MAX_DOTS).map((p) => (
                      <i key={p.id} />
                    ))}
                    {list.length > MAX_DOTS && <b>+</b>}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="reg-cal-foot">
          <span>
            {monthTotal === 0
              ? `No birthdays in ${monthName}`
              : `${monthTotal} birthday${monthTotal === 1 ? "" : "s"} in ${monthName}`}
          </span>
          {!(isTodayMonth && selected === todayDay) && (
            <button type="button" className="reg-cal-today" onClick={goToday}>
              Today
            </button>
          )}
        </div>
      </div>

      <div className="reg-list reg-cal-panel" aria-live="polite">
        {selected == null ? (
          <div className="reg-empty">Tap a day to see whose birthday it is.</div>
        ) : selectedPeople.length === 0 ? (
          <div className="reg-empty">
            No birthdays on {monthName} {selected}.
          </div>
        ) : (
          <Row
            month={shown.month}
            day={selected}
            weekday={WEEKDAY[new Date(shown.year, shown.month - 1, selected).getDay()]}
            dist={selectedDist >= 0 && selectedDist <= PILL_WITHIN_DAYS ? selectedDist : undefined}
            people={selectedPeople}
          />
        )}
      </div>
    </div>
  );
}
