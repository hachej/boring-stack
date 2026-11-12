import { test } from "node:test";
import assert from "node:assert/strict";
import { addLine, emptyDay } from "../src/day.mjs";

test("a line is added to the day", () => {
  const day = addLine(emptyDay(), "pomme", 80);
  assert.equal(day.lines.length, 1);
  assert.equal(day.lines[0].food, "pomme");
});
