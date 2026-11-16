export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

// Days from today until the next occurrence of month/day. A Feb 29 birthday
// counts as Feb 28 in non-leap years.
export function daysUntil(month, day, todayMonth, todayDay, todayYear) {
  if (month === todayMonth && day === todayDay) return 0;
  let target = new Date(todayYear, month - 1, Math.min(day, daysInMonth(month, todayYear)));
  const today = new Date(todayYear, todayMonth - 1, todayDay);
  if (target < today) {
    target = new Date(todayYear + 1, month - 1, Math.min(day, daysInMonth(month, todayYear + 1)));
  }
  return Math.round((target - today) / 86400000);
}

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function weekdayIn(todayWeekday, dist) {
  return WEEKDAY[(todayWeekday + dist) % 7];
}
