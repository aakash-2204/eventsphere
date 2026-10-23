import {
  BriefcaseBusiness,
  Laptop,
  MicVocal,
  Theater,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { EventCategoryId } from "@/types/event";

type CategoryStyle = {
  icon: LucideIcon;
  /** Gradient used for event card covers (stands in for real event images). */
  gradient: string;
  /** Text colour for the category icon. */
  accent: string;
};

export const categoryStyles: Record<EventCategoryId, CategoryStyle> = {
  music: { icon: MicVocal, gradient: "from-violet-600 to-fuchsia-500", accent: "text-fuchsia-300" },
  tech: { icon: Laptop, gradient: "from-indigo-600 to-sky-500", accent: "text-sky-300" },
  sports: { icon: Trophy, gradient: "from-emerald-600 to-teal-400", accent: "text-emerald-300" },
  arts: { icon: Theater, gradient: "from-rose-600 to-orange-400", accent: "text-rose-300" },
  food: { icon: UtensilsCrossed, gradient: "from-amber-500 to-orange-500", accent: "text-amber-300" },
  business: { icon: BriefcaseBusiness, gradient: "from-slate-600 to-violet-600", accent: "text-violet-300" },
};
