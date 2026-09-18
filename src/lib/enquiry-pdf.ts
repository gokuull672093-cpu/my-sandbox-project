import { jsPDF } from "jspdf";
import { SHOP } from "@/lib/shop";

export type PdfLine = { name: string; code?: string | null; qty: number; price: number };

type PdfOptions = {
  title: string;
  ref: string;
  customer: { name: string; mobile?: string; city?: string };
  items: PdfLine[];
  note?: string;
  fileName: string;
};

const money = (n: number) => "Rs. " + Number(n || 0).toLocaleString("en-IN");

/** Builds a simple A4 summary document and triggers a browser download. */
export function downloadSummaryPdf({ title, ref, customer, items, note, fileName }: PdfOptions) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(SHOP.name, left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 16;
  doc.text(SHOP.legalName, left, y);
  for (const line of SHOP.addressLines) {
    y += 12;
    doc.text(line, left, y);
  }
  y += 12;
  doc.text(`${SHOP.phone} · ${SHOP.email}`, left, y);

  y += 28;
  doc.setDrawColor(220);
  doc.line(left, y, 547, y);

  y += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 18;
  doc.text(`Reference: ${ref}`, left, y);
  y += 14;
  doc.text(`Date: ${new Date().toLocaleString("en-IN")}`, left, y);
  y += 14;
  doc.text(`Name: ${customer.name}`, left, y);
  if (customer.mobile) {
    y += 14;
    doc.text(`Mobile: ${customer.mobile}`, left, y);
  }
  if (customer.city) {
    y += 14;
    doc.text(`City / Area: ${customer.city}`, left, y);
  }

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.text("Item", left, y);
  doc.text("Qty", 360, y);
  doc.text("Rate", 410, y);
  doc.text("Amount", 480, y);
  doc.setDrawColor(220);
  y += 6;
  doc.line(left, y, 547, y);
  doc.setFont("helvetica", "normal");

  let total = 0;
  for (const item of items) {
    y += 18;
    if (y > 760) {
      doc.addPage();
      y = 60;
    }
    const label = item.code ? `${item.name} (${item.code})` : item.name;
    doc.text(doc.splitTextToSize(label, 290)[0] ?? label, left, y);
    doc.text(String(item.qty), 360, y);
    doc.text(money(item.price), 410, y);
    doc.text(money(item.qty * item.price), 480, y);
    total += item.qty * item.price;
  }

  if (!items.length) {
    y += 18;
    doc.text("No catalogue items selected (free-text enquiry).", left, y);
  }

  y += 10;
  doc.line(left, y, 547, y);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Indicative total", left, y);
  doc.text(money(total), 480, y);

  if (note) {
    y += 26;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const line of doc.splitTextToSize(note, 499)) {
      doc.text(line, left, y);
      y += 12;
    }
  }

  y += 22;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  for (const line of doc.splitTextToSize(
    "Enquiry only: this document is not an invoice, sale confirmation or payment receipt. Availability, pricing and fulfilment are confirmed by our team. " +
      "Fireworks are sold and handled only in accordance with applicable laws, licences and safety requirements.",
    499,
  )) {
    doc.text(line, left, y);
    y += 10;
  }

  doc.save(fileName);
}
