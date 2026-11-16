import React from "react";
import { MONTH_ABBR, MONTH_FULL } from "./dates.js";

// Sheet names are usually all caps; show them as "Ashutosh Samal".
export function titleCase(name) {
  return name.toLowerCase().replace(/(^|[\s'.-])\p{L}/gu, (c) => c.toUpperCase());
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

// One date with everyone born on it. Leave dist out to hide the countdown pill.
export default function Row({ month, day, dist, weekday, people }) {
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
      {dist != null && (
        <span className={"reg-pill" + (dist <= 1 ? " soon" : "")}>{distLabel(dist)}</span>
      )}
    </div>
  );
}
