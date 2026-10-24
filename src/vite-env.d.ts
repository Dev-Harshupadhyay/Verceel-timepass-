/// <reference types="vite/client" />

declare module "@shared/defaults.js" {
  export const DEFAULT_CONFIG: any;
  export default DEFAULT_CONFIG;
}

declare module "@shared/config-schema.js" {
  export const CONFIG_VERSION: number;
  export const MAX_PLANS_PER_PACK: number;
  export const MAX_FAQ: number;
  export const PACK_KEYS: string[];
  export const THEME_IDS: string[];
  export const LIGHT_THEMES: string[];
  export const DARK_THEMES: string[];
  export const FAQ_CATS: string[];
  export const PAY_MODES: string[];
  export function normalizeConfig(raw: any): { config: any; errors: { path: string; message: string }[] };
  export function normalizeAny(raw: any): { config: any; errors: { path: string; message: string }[] };
  export function migrateLegacy(raw: any): any;
  export function summarizeChanges(prev: any, next: any): { sections: string[]; prices: string[] };
  export function cleanText(v: unknown, max: number, fallback?: string): string;
  export function cleanMultiline(v: unknown, max: number, fallback?: string): string;
  export function validUrl(v: unknown, opts?: { relative?: boolean }): boolean;
  export function isTelegramUser(v: unknown): boolean;
  export function isUpiId(v: unknown): boolean;
  export function isEmailAddr(v: unknown): boolean;
  export function isRzpId(v: unknown): boolean;
  export function slug(v: unknown): string;
  export function fingerprint(v: unknown): string;
  export function deepClone<T>(v: T): T;
  export function deepMerge<T>(a: T, b: any): T;
}
