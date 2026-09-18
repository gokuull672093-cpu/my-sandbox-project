import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ta";

const dict = {
  browse: { en: "Browse Crackers", ta: "பட்டாசுகளை பார்க்க" },
  buildBox: { en: "Build My Diwali Box", ta: "என் தீபாவளி பெட்டி" },
  combos: { en: "View Combos", ta: "காம்போ பார்க்க" },
  sendEnquiry: { en: "Send Enquiry", ta: "விசாரணை அனுப்பு" },
  myEnquiry: { en: "My Diwali Enquiry", ta: "என் தீபாவளி விசாரணை" },
  addToEnquiry: { en: "Add to Enquiry", ta: "விசாரணையில் சேர்" },
  added: { en: "Added", ta: "சேர்க்கப்பட்டது" },
  catalogue: { en: "Catalogue", ta: "அட்டவணை" },
  track: { en: "Track Enquiry", ta: "விசாரணை நிலை" },
  available: { en: "Available", ta: "கிடைக்கிறது" },
  limited: { en: "Limited availability", ta: "குறைவாக உள்ளது" },
  unavailable: { en: "Currently unavailable", ta: "இப்போது இல்லை" },
  enquiry_only: { en: "Ask availability", ta: "கிடைப்பதை கேளுங்கள்" },
  estimated: { en: "Estimated catalogue value", ta: "மதிப்பீட்டு தொகை" },
  search: { en: "Search name or code (CRK-142)", ta: "பெயர் அல்லது குறியீடு தேடுங்கள்" },
  allCategories: { en: "All categories", ta: "அனைத்து வகைகள்" },
  emptyCart: { en: "Your enquiry list is empty.", ta: "உங்கள் விசாரணை பட்டியல் காலியாக உள்ளது." },
  announce: {
    en: "Enquiry only · No online payment · Our team confirms availability ✨",
    ta: "விசாரணை மட்டுமே · ஆன்லைன் பணம் இல்லை · எங்கள் குழு உறுதி செய்யும் ✨",
  },
  shopByCategory: { en: "Shop by category", ta: "வகைவாரியாக பாருங்கள்" },
  shopByExperience: { en: "Shop by experience", ta: "அனுபவத்தின்படி பாருங்கள்" },
  popular: { en: "Popular this season", ta: "இந்த சீசனில் பிரபலம்" },
  viewAll: { en: "View all", ta: "அனைத்தையும் பார்" },
  noMatch: { en: "No products match this filter.", ta: "இந்த வடிகட்டலுக்கு பொருட்கள் இல்லை." },
  clear: { en: "Clear", ta: "நீக்கு" },
  buildTitle: { en: "Build My Diwali Box", ta: "என் தீபாவளி பெட்டி" },
  buildSub: {
    en: "Choose a budget, then pick items category by category. Nothing is reserved until our team confirms.",
    ta: "பட்ஜெட்டை தேர்வு செய்து, வகைவாரியாக பொருட்களை தேர்ந்தெடுங்கள். எங்கள் குழு உறுதி செய்யும் வரை எதுவும் ஒதுக்கப்படாது.",
  },
  myBudget: { en: "My budget", ta: "என் பட்ஜெட்" },
  budgetHint: {
    en: "We'll show your running total against this budget as you pick items.",
    ta: "நீங்கள் தேர்ந்தெடுக்கும்போது மொத்தத் தொகையை பட்ஜெட்டுடன் காட்டுவோம்.",
  },
  pickOrSkip: { en: "Pick what you like, or skip this category.", ta: "விருப்பமானதை தேர்ந்தெடுங்கள், அல்லது இந்த வகையை தவிர்க்கவும்." },
  noneHere: { en: "No items in this category right now.", ta: "இந்த வகையில் இப்போது பொருட்கள் இல்லை." },
  nothingPicked: {
    en: "You haven't picked anything yet. Go back and choose a few items.",
    ta: "நீங்கள் இன்னும் எதையும் தேர்ந்தெடுக்கவில்லை. திரும்பிச் சென்று சில பொருட்களை தேர்வு செய்யுங்கள்.",
  },
  startPicking: { en: "Start picking", ta: "தேர்வு தொடங்கு" },
  next: { en: "Next", ta: "அடுத்து" },
  back: { en: "Back", ta: "பின்செல்" },
  review: { en: "Review", ta: "மறுபார்வை" },
  budget: { en: "Budget", ta: "பட்ஜெட்" },
  items: { en: "items", ta: "பொருட்கள்" },
  step: { en: "Step", ta: "படி" },
  of: { en: "of", ta: "/" },
  addMyBox: { en: "Add My Box to Enquiry", ta: "என் பெட்டியை விசாரணையில் சேர்" },
  contact: { en: "Contact", ta: "தொடர்பு" },
  add: { en: "Add", ta: "சேர்" },
} as const;


export type TKey = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("upcurv-lang");
    if (saved === "ta" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("upcurv-lang", l);
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);

export function pick(lang: Lang, en: string, ta?: string | null) {
  return lang === "ta" && ta ? ta : en;
}
