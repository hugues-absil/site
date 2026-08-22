/**
 * Tests manuels du tri catalogue : `npx tsx scripts/test-catalog-sort.ts`
 */
import assert from "node:assert/strict";
import {
  comparePaintingsCatalogOrder,
  normalizeReference,
  parseReference,
  yyToFullYear,
} from "../src/lib/catalogSort.ts";

assert.equal(normalizeReference(" 24t05 "), "24T05");
assert.equal(normalizeReference("24 C 01"), "24C01");

assert.equal(yyToFullYear(1), 2001);
assert.equal(yyToFullYear(99), 1999);
assert.equal(yyToFullYear(30), 1930);

const pCE = parseReference("24CE03");
assert.ok(pCE);
assert.equal(pCE!.mediaCode, "CE");
assert.equal(pCE!.sequence, 3);
assert.equal(pCE!.fullYear, 2024);

const pC = parseReference("24C01");
assert.ok(pC);
assert.equal(pC!.mediaCode, "C");
assert.equal(pC!.sequence, 1);

assert.equal(parseReference("24XX01"), null);

const order = [
  { year: 2024, reference: "24T02", title: "b" },
  { year: 2024, reference: "24T01", title: "a" },
  { year: 2023, reference: "23T01", title: "c" },
];
const sorted = [...order].sort(comparePaintingsCatalogOrder);
assert.equal(sorted[0].year, 2024);
assert.equal(sorted[0].reference, "24T01");
assert.equal(sorted[2].year, 2023);

console.log("catalogSort tests OK");
