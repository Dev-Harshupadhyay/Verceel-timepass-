/** Shared config types — mirrors api/_lib/config-schema.js (v2). */

export type Lang = "en" | "hinglish" | "hi";
export type Tri = Record<Lang, string>;

export type ThemeId =
  | "obsidian"
  | "violet-dark"
  | "amethyst"
  | "cyber"
  | "crimson"
  | "emerald"
  | "pearl";

export type PackKey = "movies" | "adult" | "combo";
export type PayMode = "auto" | "razorpay" | "upi" | "universal";
export type FaqCat = "pricing" | "payment" | "access" | "support" | "policy";
export type AnnounceTone = "gold" | "violet" | "red";
export type AnnounceAnim = "shimmer" | "marquee" | "none";

export interface DevStat {
  value: string;
  label: string;
}

export interface Brand {
  name: string;
  shortName: string;
  logoUrl: string;
  devName: string;
  devCrown: string;
  devHandle: string;
  devUrl: string;
  devRole: string;
  devBio: string;
  devQuote: string;
  devPortfolioLabel: string;
  devTags: string[];
  devStats: DevStat[];
}

export interface TrustItem {
  icon: string;
  title: string;
  sub: string;
}

export interface Hero {
  title: string;
  tagline: string;
  badge: string;
  ctaLabel: string;
  image: string;
  sectionLabel: string;
  sectionSub: string;
  faqLabel: string;
  faqSub: string;
  trust: TrustItem[];
}

export interface Announcement {
  enabled: boolean;
  text: string;
  badge: string;
  ctaLabel: string;
  ctaUrl: string;
  tone: AnnounceTone;
  animation: AnnounceAnim;
  dismissible: boolean;
  expiresAt: string | null;
  showOnBuyPage: boolean;
}

export interface Plan {
  id: string;
  /** small emoji sticker shown next to the plan on cards */
  sticker: string;
  name: string;
  price: number;
  razorpayButtonId: string;
  razorpayAmount: number | null;
  payMode: PayMode;
  active: boolean;
  soldOut: boolean;
  featured: boolean;
}

export interface Pack {
  title: string;
  sub: string;
  emoji: string;
  cta: string;
  suffix: string;
  crown: boolean;
  active: boolean;
  plans: Plan[];
}

export interface Links {
  upi: string;
  /** optional 10-digit mobile linked to the UPI id — lets Paytm/GPay users
      "pay via mobile number" when the UPI risk policy blocks a deep link */
  payeeMobile: string;
  razorpay: string;
  telegram: string;
  channel: string;
  bot: string;
  email: string;
  portfolio: string;
}

export interface Content {
  payLabel: string;
  paymentHeading: string;
  upiCaption: string;
  upiHint: string;
  upiNoteTemplate: string;
  paymentNoteTitle: string;
  paymentNote: string;
  screenshotTitle: string;
  screenshotDesc: string;
  screenshotCta: string;
  universalLabel: string;
  universalCta: string;
  buyTitle: string;
  buySub: string;
  proceedLabel: string;
  supportPrefix: string;
  supportSuffix: string;
  footerLine: string;
  footerBy: string;
  footerCredit: string;
  telegramEyebrow: string;
  telegramTitle: string;
  telegramDesc: string;
  devDrawerTitle: string;
  devGuideTitle: string;
  infoButton: string;
  infoBack: string;
  faqViewAll: string;
  faqTeaserTitle: string;
}

export interface InfoPoint {
  icon: string;
  title: Tri;
  desc: Tri;
}

export interface HowStep {
  title: Tri;
  desc: Tri;
}

export interface Policy {
  title: Tri;
  desc: Tri;
}

export interface InfoContent {
  title: Tri;
  intro: Tri;
  valueTitle: Tri;
  whatYouGet: Tri;
  points: InfoPoint[];
  howTitle: Tri;
  howItWorks: HowStep[];
  policyTitle: Tri;
  policies: Policy[];
  supportNote: Tri;
}

export interface FaqItem {
  id: string;
  cat: FaqCat;
  active: boolean;
  q: Tri;
  a: Tri;
}

export interface Appearance {
  defaultTheme: ThemeId;
  darkTheme: ThemeId;
}

export interface Config {
  v: number;
  revision: number;
  updatedAt: string | null;
  restoredFrom?: number;
  migratedFrom?: string;
  brand: Brand;
  hero: Hero;
  announcement: Announcement;
  packs: Record<PackKey, Pack>;
  links: Links;
  content: Content;
  info: InfoContent;
  faq: FaqItem[];
  appearance: Appearance;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface RevisionSummary {
  id: number;
  at: string;
  sections: string[];
  prices: string[];
  source?: string;
  restoredFrom?: number;
}

export interface PublishResponse {
  ok: boolean;
  config?: Config;
  data?: Config;
  revisions?: RevisionSummary[];
  current?: { revision: number; updatedAt: string | null };
  revision?: number;
  updatedAt?: string;
  summary?: { sections: string[]; prices: string[] };
  error?: string;
  details?: ValidationError[];
  hint?: string;
}
