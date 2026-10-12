import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcile, summarize } from "./reconcile.mjs";

const inv = (o) => ({ invoice_no: "A1", invoice_date: "2026-09-01", supplier: "Fish OÜ", delivery_note_no: "DN1", item: "Salmon", unit: "kg", qty: 14, unit_price: 20, ...o });
const del = (o) => ({ delivery_note_no: "DN1", delivery_date: "2026-09-01", supplier: "Fish OÜ", item: "salmon", unit: "kg", qty_on_note: 14, qty_received: "", ...o });

test("matching line is ok", () => {
  const [l] = reconcile([inv()], [del({ qty_received: 14 })]);
  assert.equal(l.kind, "ok"); assert.equal(l.value, 0);
});
test("C1 salmon: note says 14, 11 counted -> door shortfall of 60", () => {
  const [l] = reconcile([inv()], [del({ qty_received: 11 })]);
  assert.equal(l.kind, "door"); assert.equal(l.value, 60); assert.equal(l.doorValue, 60);
});
test("invoice above note -> paper shortfall", () => {
  const [l] = reconcile([inv()], [del({ qty_on_note: 12 })]);
  assert.equal(l.kind, "paper"); assert.equal(l.value, 40);
});
test("both gaps split correctly", () => {
  const [l] = reconcile([inv()], [del({ qty_on_note: 12, qty_received: "10,5" })]);
  assert.equal(l.kind, "paper_and_door"); assert.equal(l.paperValue, 40); assert.equal(l.doorValue, 30);
});
test("invoiced but on no note", () => {
  const [l] = reconcile([inv()], []);
  assert.equal(l.kind, "not_on_note"); assert.equal(l.value, 280);
});
test("over-delivery is flagged, not claimed", () => {
  const [l] = reconcile([inv()], [del({ qty_received: 15 })]);
  assert.equal(l.kind, "over"); assert.equal(l.value, 0);
});
test("summary recovery rate", () => {
  const lines = reconcile([inv(), inv({ invoice_no: "A2", delivery_note_no: "DN2" })],
    [del({ qty_received: 11 }), del({ delivery_note_no: "DN2", qty_on_note: 13 })]);
  const s = summarize(lines, { [lines[0].id]: { status: "credited", creditedAmount: 60 }, [lines[1].id]: { status: "requested" } });
  assert.equal(s.found, 80); assert.equal(s.requested, 80); assert.equal(s.credited, 60); assert.equal(s.recoveryRate, 0.75);
});
