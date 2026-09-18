// Store information is intentionally hard-coded here (single shop, no seller settings UI).
export const SHOP = {
  name: "Upcurv Crackers",
  tagline: "Digital catalogue & enquiry desk",
  legalName: "Upcurv Crackers, Licensed Fireworks Retailer",
  phone: "+91 63807 12345",
  phoneDial: "+916380712345",
  whatsapp: "916380712345",
  email: "hello@upcurv.in",
  addressLines: ["No. 12, Bazaar Main Road", "Ganapathy, Coimbatore", "Tamil Nadu 641006"],
  hours: "Mon – Sun · 9:00 AM – 9:00 PM (Diwali season)",
  licence: "Explosives Rules licence held by the seller. Displayed for reference only.",
  season: "Diwali 2026",
  fulfilment: [
    { value: "pickup", label: "Shop pickup" },
    { value: "contact", label: "Seller will contact me regarding available options" },
    { value: "other", label: "Other / discuss with seller" },
  ],
  contactMethods: [
    { value: "call", label: "Phone call" },
    { value: "whatsapp", label: "WhatsApp" },
  ],
} as const;

export const LEGAL_NOTICE =
  "Enquiry Only: This website is a digital catalogue and enquiry platform. Submitting an enquiry does not constitute a confirmed sale or payment. Our team will contact you to confirm availability, applicable terms, and order fulfilment.";

export const LEGAL_NOTICE_TA =
  "விசாரணை மட்டும்: இந்த இணையதளம் ஒரு டிஜிட்டல் அட்டவணை மற்றும் விசாரணை தளம் மட்டுமே. விசாரணை அனுப்புவது உறுதி செய்யப்பட்ட விற்பனை அல்லது பணப்பரிவர்த்தனை அல்ல. கிடைக்கும் தன்மை மற்றும் விவரங்களை உறுதி செய்ய எங்கள் குழு உங்களை தொடர்பு கொள்ளும்.";

export const SAFETY_NOTICE =
  "Fireworks are sold and handled only in accordance with applicable laws, licences and safety requirements.";

export function inr(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
