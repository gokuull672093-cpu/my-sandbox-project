import sparklers from "@/assets/icons/sparklers.png.asset.json";
import groundChakkars from "@/assets/icons/ground-chakkars.png.asset.json";
import flowerPots from "@/assets/icons/flower-pots.png.asset.json";
import rockets from "@/assets/icons/rockets.png.asset.json";
import oneSound from "@/assets/icons/one-sound.png.asset.json";
import fancy from "@/assets/icons/fancy.png.asset.json";
import bombs from "@/assets/icons/bombs.png.asset.json";
import giftBoxes from "@/assets/icons/gift-boxes.png.asset.json";
import kids from "@/assets/icons/kids.png.asset.json";

const ICONS: Record<string, string> = {
  sparklers: sparklers.url,
  "ground-chakkars": groundChakkars.url,
  ground: groundChakkars.url,
  chakkars: groundChakkars.url,
  "flower-pots": flowerPots.url,
  rockets: rockets.url,
  "one-sound": oneSound.url,
  fancy: fancy.url,
  bombs: bombs.url,
  "gift-boxes": giftBoxes.url,
  kids: kids.url,
};

/** Soft pastel tint behind each category icon (matches the illustrated icon row). */
const TINTS = [
  "bg-rose-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-orange-50",
];

export const categoryIcon = (slug: string | null | undefined) =>
  (slug ? ICONS[slug] : undefined) ?? fancy.url;

export const categoryTint = (index: number) => TINTS[index % TINTS.length]!;

export const comboIcon = giftBoxes.url;
