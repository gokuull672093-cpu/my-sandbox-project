/** Payment collection methods available at the seller desk. */
export const PAYMENT_METHODS = ["upi", "cash", "card", "bank", "other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  cash: "Cash",
  card: "Card",
  bank: "Bank transfer",
  other: "Other",
};

export const PAYMENT_METHOD_TONE: Record<string, string> = {
  upi: "bg-report-violet/10 text-report-violet border-report-violet/20",
  cash: "bg-report-green/10 text-report-green border-report-green/20",
  card: "bg-report-blue/10 text-report-blue border-report-blue/20",
  bank: "bg-report-teal/10 text-report-teal border-report-teal/20",
  other: "bg-muted text-muted-foreground border-border",
};
