// Drafts one credit-request email per supplier. A human reviews and sends it;
// nothing is sent automatically (see Build Sheet: #6 is "drafted, we send").
const eur = (n) => new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" }).format(n);
const q = (n) => String(Math.round(n * 100) / 100).replace(".", ",");

const T = {
  en: {
    subject: (site, n, total) => `Credit note request – ${site} – ${n} line${n === 1 ? "" : "s"} (${total})`,
    hello: "Hello,",
    intro: (supplier) => `We have checked ${supplier}'s invoices against the signed delivery notes and the goods counted on arrival. On the lines below we were invoiced for more than we received:`,
    line: (l) => l.kind === "not_on_note"
      ? `• Invoice ${l.invoice_no} (${l.invoice_date}), delivery note ${l.delivery_note_no}: ${l.item} – invoiced ${q(l.invoiced)} ${l.unit}, not on the delivery note → ${eur(l.value)}`
      : `• Invoice ${l.invoice_no} (${l.invoice_date}), delivery note ${l.delivery_note_no}: ${l.item} – invoiced ${q(l.invoiced)} ${l.unit}, received ${q(l.received)} ${l.unit}, short ${q(l.shortQty)} ${l.unit} × ${eur(l.unit_price)} = ${eur(l.value)}`,
    total: (t) => `Total: ${t}`,
    ask: (t) => `Please issue a credit note for ${t}. If your records differ on any line, let us know — we have photos of the signed delivery notes.`,
    deadline: "We'd appreciate a reply within 5 working days.",
    bye: "Kind regards,",
  },
  et: {
    subject: (site, n, total) => `Kreeditarve taotlus – ${site} – ${n} rida (${total})`,
    hello: "Tere,",
    intro: (supplier) => `Võrdlesime ettevõtte ${supplier} arveid allkirjastatud saatelehtede ja kohapeal üle loetud kaubaga. Järgmistel ridadel on arvel rohkem kaupa, kui meile tegelikult tarniti:`,
    line: (l) => l.kind === "not_on_note"
      ? `• Arve ${l.invoice_no} (${l.invoice_date}), saateleht ${l.delivery_note_no}: ${l.item} – arvel ${q(l.invoiced)} ${l.unit}, saatelehel puudub → ${eur(l.value)}`
      : `• Arve ${l.invoice_no} (${l.invoice_date}), saateleht ${l.delivery_note_no}: ${l.item} – arvel ${q(l.invoiced)} ${l.unit}, saabus ${q(l.received)} ${l.unit}, vahe ${q(l.shortQty)} ${l.unit} × ${eur(l.unit_price)} = ${eur(l.value)}`,
    total: (t) => `Kokku: ${t}`,
    ask: (t) => `Palume väljastada kreeditarve summas ${t}. Kui teie andmed mõne rea osas erinevad, andke palun teada – allkirjastatud saatelehtede fotod on meil olemas.`,
    deadline: "Palume vastust 5 tööpäeva jooksul.",
    bye: "Lugupidamisega",
  },
};

export function draftEmail({ supplier, lines, lang = "en", site = "Our restaurant", sender = "" }) {
  const t = T[lang] ?? T.en;
  const total = eur(lines.reduce((a, l) => a + l.value, 0));
  const body = [t.hello, "", t.intro(supplier), "", ...lines.map(t.line), "", t.total(total), "", t.ask(total), t.deadline, "", t.bye, sender, site]
    .filter((x) => x !== undefined).join("\n").trim();
  return { subject: t.subject(site, lines.length, total), body };
}
