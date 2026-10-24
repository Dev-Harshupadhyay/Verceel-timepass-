import { DEFAULT_CONFIG as RAW_DEFAULT } from "@shared/defaults.js";
import { normalizeConfig, summarizeChanges } from "@shared/config-schema.js";
import type { Config, ValidationError } from "@/types";

/** Factory defaults — exactly the content the site shipped with. */
export const DEFAULT_CONFIG = RAW_DEFAULT as unknown as Config;

export function normalize(input: unknown): { config: Config; errors: ValidationError[] } {
  const res = normalizeConfig(input);
  return { config: res.config as Config, errors: res.errors as ValidationError[] };
}

export { summarizeChanges };

/** Deep structural equality for dirty checks. */
export function sameConfig(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function effectiveThemeIds(): string[] {
  return ["obsidian", "pearl", "violet-dark", "amethyst", "cyber", "crimson", "emerald"];
}

export const DARK_THEME_IDS = ["obsidian", "violet-dark", "amethyst", "cyber", "crimson", "emerald"];

export interface ThemeMeta {
  id: string;
  name: string;
  short: string;
  dark: boolean;
  meta: string;
  sw: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "obsidian",
    name: "Obsidian Gold",
    short: "Gold",
    dark: true,
    meta: "#07060a",
    sw: "linear-gradient(135deg,#0a090e 45%,#d4af37)"
  },
  {
    id: "pearl",
    name: "Pearl Light",
    short: "Light",
    dark: false,
    meta: "#f7f4ed",
    sw: "linear-gradient(135deg,#f7f4ed 45%,#b8912c)"
  },
  {
    id: "violet-dark",
    name: "Violet Dark",
    short: "Violet",
    dark: true,
    meta: "#0b0b10",
    sw: "linear-gradient(135deg,#15131d 45%,#8b5cf6)"
  },
  {
    id: "amethyst",
    name: "Royal Amethyst",
    short: "Amethyst",
    dark: true,
    meta: "#08060e",
    sw: "linear-gradient(135deg,#0c0916 45%,#a855f7)"
  },
  {
    id: "cyber",
    name: "Neon Cyber",
    short: "Cyber",
    dark: true,
    meta: "#04080c",
    sw: "linear-gradient(135deg,#06101a 45%,#22d3ee)"
  },
  {
    id: "crimson",
    name: "Crimson Blood",
    short: "Crimson",
    dark: true,
    meta: "#0a0406",
    sw: "linear-gradient(135deg,#10060a 45%,#ef4444)"
  },
  {
    id: "emerald",
    name: "Emerald Luxe",
    short: "Emerald",
    dark: true,
    meta: "#040907",
    sw: "linear-gradient(135deg,#061210 45%,#10b981)"
  }
];

export function themeMeta(id: string): ThemeMeta {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function isDarkTheme(id: string): boolean {
  return !!themeMeta(id).dark;
}
