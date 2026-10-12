# LARDER: Decision Memo

**To:** Marta · **Re:** What we build first · **Status:** Before any build

## Who specifically

Tallinn restaurant groups with **3–15 sites and a central finance person**: a CFO, controller or finance manager who pays supplier invoices but never sees a delivery. Think €50k–250k a month in food spend. The person who feels the problem is **finance, not the chef**. C6 is the archetype and C3 is next to it. Chefs and single-site owners are not the buyer yet.

## Riskiest assumption

**That suppliers will issue credit notes when we send them line-level evidence, so that the money we *recover* (not just the money we *find*) is clearly more than the restaurant pays us.**

We already have evidence that the money is there: 38 of 412 lines (9%) and €2,180 in three months at one site. We have almost no evidence that it can be recovered. Only 9 of those 38 were ever credited, and C1 is still waiting on a credit note for salmon. If suppliers stall, all we are selling is a report about the problem.

## What we're building, and why it's the smallest honest test

**A reconciliation and credit-request workbench for one pilot site, run by us.** We import invoice lines and delivery-note lines (CSV or keyed in by hand). It matches them, lists the discrepancies, drafts one credit request per supplier in Estonian or English, tracks each request (requested, credited or disputed) and exports a month-end file for accounting. The kitchen does nothing except photograph the signed delivery note, with real counted quantities, and send it to us on WhatsApp. We do the keying.

Why this and not more: it is exactly what the CFO said he needs to see "working on one site before we commit". It produces the one number that matters, **€ recovered vs € fee**. And it needs no supplier integration and no change in chef behaviour. Before the tool is even finished, we can send the **29 uncredited lines we already hold** to their suppliers. That is a recovery test with zero software.

## Where I think you're wrong

1. **Ordering isn't the pain.** Six of seven restaurants shrugged at it. Only C2 said yes, and she then worried about losing her prices with Jaan. The landing page got 11 signups from 340 visits, and only 2 people replied.
2. **Suppliers won't pay us.** C5 runs on 4–5% margins and said no outright. C8 can't integrate with anything. And we can't chase suppliers for credits while also asking them to pay us.
3. **The CFO isn't just a logo.** He's the only person who has offered money. C1 and C7 asked for the same thing without being prompted: get us our money back.

**Tell the CFO:** yes. We start with one site next week and chase the 29 open lines straight away. If it works, he signs the nine-site pilot at €1,500/month, as he offered.

## Kill criteria (six weeks)

- Suppliers credit less than 30% of the 29 open lines within 30 days.
- Real shortfall comes in under €170/site/month. Below that, nine sites don't cover the fee.
- Kitchen staff log actual quantities on fewer than 70% of deliveries.
- The CFO won't sign after the one-site results clear the bar he agreed to.

## What would change my mind

1. **Will suppliers pay up?** I expect 50–70% of the 29 open lines to be credited within a month. If it's under 30%, we sell the evidence instead, so the CFO can renegotiate or switch suppliers. If he won't pay for that, we stop. *How:* send the requests from his AP inbox this week and log every reply.
2. **Is the loss on paper or at the door?** The 38 mismatches are invoice against delivery note. The CFO's 3–4% is goods that never arrived, which a signed note can hide. I expect most of the loss to happen at the door. If it's mostly on paper, we skip the kitchen and sell through accounting bureaus. *How:* stand at the pilot's back door for five mornings, then have staff count for two weeks.
3. **Is this more than one CFO?** I expect 2 of 5 other groups to hand over three months of invoices, and 1 to pay for a pilot. If none do, we take the €4,500, learn what we can and stop. *How:* Marta books five warm intros in week one, starting with the C3 group.
