// The gate's own acceptance test, copied into the worker's folder only after the run.
import { test } from "node:test";
import assert from "node:assert/strict";
import { addLine, emptyDay, removeLine, render, total } from "../src/day.mjs";

test("AC-1 the total of riz 200 and poulet 300 is 500", () => {
  const day = addLine(addLine(emptyDay(), "riz", 200), "poulet", 300);
  assert.equal(Number(total(day)), 500);
  assert.match(render(day), /Total : 500 kcal/);
});

test("AC-2 removing riz leaves poulet and 300", () => {
  const day = removeLine(addLine(addLine(emptyDay(), "riz", 200), "poulet", 300), "riz");
  assert.deepEqual(day.lines.map((l) => l.food), ["poulet"]);
  assert.match(render(day), /Total : 300 kcal/);
});

test("AC-3 an empty day says Rien encore and 0 kcal", () => {
  const html = render(emptyDay());
  assert.match(html, /Rien encore/);
  assert.match(html, /Total : 0 kcal/);
});
