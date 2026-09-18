import { jsPDF } from "jspdf";
import { SHOP } from "@/lib/shop";

export type SlipLine = { name: string; qty: number };

type SlipOptions = {
  ref: string;
  customer: {
    name: string;
    mobile?: string | null;
    city?: string | null;
    state?: string | null;
    address?: string | null;
    pincode?: string | null;
  };
  lines: SlipLine[];
  /** Goods value before coupon and delivery charge. */
  subtotal?: number;
  couponCode?: string | null;
  discount?: number;
  deliveryCharge?: number;
  total: number;
  fileName: string;
};

const money = (n: number) => "Rs. " + Number(n || 0).toLocaleString("en-IN");

/** Rectangle-framed delivery slip: shop branding, customer block, item/qty table, total, signature. */
export function downloadDeliverySlip({
  ref,
  customer,
  lines,
  subtotal,
  couponCode,
  discount = 0,
  deliveryCharge = 0,
  total,
  fileName,
}: SlipOptions) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const L = 40;
  const R = 555;
  const W = R - L;

  const frame = (y: number, h: number) => {
    doc.setDrawColor(30);
    doc.setLineWidth(1);
    doc.rect(L, y, W, h);
  };

  let y = 40;

  // Branding band
  frame(y, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(SHOP.name, L + 14, y + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(SHOP.legalName, L + 14, y + 40);
  doc.text(SHOP.addressLines.join(", "), L + 14, y + 52);
  doc.text(`${SHOP.phone}  ·  ${SHOP.email}`, L + 14, y + 64);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("DELIVERY SLIP", R - 14, y + 26, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Ref: ${ref}`, R - 14, y + 42, { align: "right" });
  doc.text(new Date().toLocaleString("en-IN"), R - 14, y + 56, { align: "right" });

  y += 74;

  // Customer block
  const addressBits = [customer.address, customer.city, customer.state, customer.pincode]
    .filter(Boolean)
    .join(", ");
  const addressLines = doc.splitTextToSize(addressBits || "—", W - 120);
  const custH = 46 + addressLines.length * 12;
  frame(y, custH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Deliver to", L + 14, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(customer.name, L + 14, y + 34);
  doc.setFontSize(9);
  if (customer.mobile) doc.text(`Mobile: ${customer.mobile}`, R - 14, y + 34, { align: "right" });
  let ay = y + 48;
  for (const line of addressLines) {
    doc.text(line, L + 14, ay);
    ay += 12;
  }
  y += custH;

  // Table head
  const rowH = 22;
  frame(y, rowH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Cracker", L + 14, y + 15);
  doc.text("Qty", R - 14, y + 15, { align: "right" });
  doc.line(R - 70, y, R - 70, y + rowH);
  y += rowH;

  // Single aggregated row — the slip shows only the total cracker quantity.
  const totalQty = lines.reduce((s, l) => s + (l.qty || 0), 0);
  doc.setFont("helvetica", "normal");
  frame(y, rowH);
  doc.line(R - 70, y, R - 70, y + rowH);
  doc.text("Crackers", L + 14, y + 15);
  doc.text(String(totalQty), R - 14, y + 15, { align: "right" });
  y += rowH;

  // Bill breakdown — goods value, coupon discount, delivery charge, payable total.
  const breakdown: { label: string; value: number }[] = [];
  if (subtotal !== undefined) breakdown.push({ label: "Goods value", value: subtotal });
  if (discount > 0)
    breakdown.push({
      label: `Coupon discount${couponCode ? ` (${couponCode})` : ""}`,
      value: -discount,
    });
  if (deliveryCharge > 0) breakdown.push({ label: "Delivery charge", value: deliveryCharge });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const row of breakdown) {
    frame(y, 20);
    doc.text(row.label, L + 14, y + 14);
    doc.text((row.value < 0 ? "- " : "") + money(Math.abs(row.value)), R - 14, y + 14, {
      align: "right",
    });
    y += 20;
  }

  // Total
  frame(y, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total amount", L + 14, y + 17);
  doc.text(money(total), R - 14, y + 17, { align: "right" });
  y += 26;

  // Signature block
  y += 18;
  frame(y, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.line(L + 14, y + 56, L + 200, y + 56);
  doc.text("Customer signature", L + 14, y + 70);
  doc.line(R - 200, y + 56, R - 14, y + 56);
  doc.text("Authorised signatory", R - 14, y + 70, { align: "right" });

  y += 96;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  for (const line of doc.splitTextToSize(
    "Goods handed over as per the confirmed enquiry. Fireworks are sold and handled only in accordance with applicable laws, licences and safety requirements.",
    W,
  )) {
    doc.text(line, L, y);
    y += 10;
  }

  doc.save(fileName);
}
