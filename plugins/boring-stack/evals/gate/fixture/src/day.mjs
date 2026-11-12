export const emptyDay = () => ({ lines: [] });

export function addLine(day, food, kcal) {
  day.lines.push({ food, kcal: String(kcal) });
  return day;
}

export function removeLine(day, food) {
  day.lines.splice(day.lines.findIndex((l) => l.food === food));
  return day;
}

export const total = (day) => day.lines.reduce((sum, l) => sum + l.kcal, "");

export function render(day) {
  const rows = day.lines.map((l) => `<li>${l.food} · ${l.kcal} kcal</li>`).join("");
  return `<ul>${rows}</ul><p>Total : ${total(day)} kcal</p>`;
}
