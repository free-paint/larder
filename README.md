# Larder · Delivery check

A small workbench for one pilot site. It matches what suppliers **invoiced** against what the signed **delivery note** says and what staff **counted at the door**. It then drafts one credit-request email per supplier and tracks what comes back.

It exists to test one thing: **will suppliers actually pay back money when shown line-level evidence?** (See `docs/DECISION_MEMO.md`.)

## Try it

Live: _[add Vercel URL]_

The app opens on a **fictional sample month** (one site, five made-up suppliers, ~170 lines), so you can click through it straight away:

1. **Overview**: money found, requested and credited, checked against the pilot bar from the memo (≥30% recovered, shortfall ≥ fee per site, staff count ≥70% of deliveries).
2. **Discrepancies**: every line that's off, and where it went wrong: *on paper* (invoice above the signed note), *at the door* (note signed in full, less counted) or *not on note*. Change a line's status here, e.g. *Credited* with the amount and credit note number.
3. **Credit requests**: one draft per supplier in Estonian or English. Copy it or open it in your mail app, send it yourself, then click *Mark as sent*.
4. **Data & settings**: upload your own CSVs (column names are listed there, and you can download the sample files as templates), set the site name, and download the month-end CSV for accounting.

All data stays in your browser (localStorage). No account, no backend.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # reconciliation logic tests
node scripts/make-sample.mjs   # regenerate the sample month
```

## Decisions

- **Run by us, not the restaurant.** In the pilot, the kitchen only photographs the signed note with counted quantities and sends it on WhatsApp. We key it in. So the tool takes CSVs: no OCR, no app for chefs, nothing to install.
- **Paper vs door split.** The C6 data compared invoice against delivery note. The CFO's 3–4% is goods that never arrived, which a signed note can hide. Every shortfall is split into those two parts, so the pilot answers "do we need people counting at the door?"
- **Emails are drafts, a human sends them.** Credit requests go from the restaurant's own mailbox. That's more credible to a supplier, and we learn what they push back on.
- **Over-deliveries are flagged, not claimed.**
- **Month-end export is a plain CSV**, not a Merit/e-arveldaja integration. The column mapping gets confirmed with the CFO's accountant first (Build Sheet #12).
- **Not built (on purpose):** ordering, catalogues, chef app, supplier portal, ratings, stock. See `docs/BUILD_SHEET.md`.

## Known limits

- Matching key is supplier + delivery note number + item name (case- and accent-insensitive). Different item names on the invoice and the note won't match and will show as *not on note*.
- Price differences (invoiced price ≠ agreed price) aren't checked yet. That's Build Sheet #9.
- The Estonian email text needs a native speaker to check it before it goes to a real supplier.
- The sample data is invented. Its paper/door split says nothing about real kitchens.

## Next

1. Run it on the CFO's site with the 29 uncredited lines from his data. Log replies and credits.
2. Two weeks of door counts at that site, then read the paper/door split.
3. If recovery is ≥30%: accounting export in Merit's import format, then add multiple sites.
