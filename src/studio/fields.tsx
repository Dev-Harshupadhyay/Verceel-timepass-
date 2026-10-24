import type { ReactNode } from "react";
import type { Tri, Lang } from "@/types";

export function Row({
  label,
  hint,
  children,
  stack = false
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  stack?: boolean;
}) {
  return (
    <div className={`studio-row${stack ? " stack" : ""}`}>
      {label ? (
        <div className="sr-label">
          <b>{label}</b>
          {hint ? <small>{hint}</small> : null}
        </div>
      ) : null}
      <div className="sr-body">{children}</div>
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  invalid,
  error,
  note,
  id
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  invalid?: boolean;
  error?: string;
  note?: string;
  id?: string;
}) {
  return (
    <>
      <input
        id={id}
        className={`st-input${invalid ? " invalid" : ""}`}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      {error ? <span className="st-field-error">{error}</span> : null}
      {note ? <span className="st-field-note">{note}</span> : null}
    </>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  invalid,
  error
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  invalid?: boolean;
  error?: string;
}) {
  return (
    <>
      <textarea
        className={`st-textarea${invalid ? " invalid" : ""}`}
        value={value}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      {error ? <span className="st-field-error">{error}</span> : null}
    </>
  );
}

export function SwitchRow({
  label,
  hint,
  checked,
  onChange
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="studio-row">
      <div className="sr-label">
        <b>{label}</b>
        {hint ? <small>{hint}</small> : null}
      </div>
      <div className="sr-body" style={{ alignItems: "flex-end" }}>
        <div className="switch-row">
          <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
          />
        </div>
      </div>
    </div>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  label
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <select className="st-select" value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const LANG_NAMES: Record<Lang, string> = { en: "EN", hinglish: "HING", hi: "हिंदी" };

export function TriField({
  value,
  onChange,
  multiline = false,
  maxLength = 300,
  label,
  hint
}: {
  value: Tri;
  onChange: (v: Tri) => void;
  multiline?: boolean;
  maxLength?: number;
  label?: string;
  hint?: string;
}) {
  const langs: Lang[] = ["en", "hinglish", "hi"];
  return (
    <div className="studio-row stack">
      {label ? (
        <div className="sr-label">
          <b>{label}</b>
          {hint ? <small>{hint}</small> : null}
        </div>
      ) : null}
      <div className="sr-body">
        <div className="tri">
          {langs.map((lang) => (
            <div className="tri-row" key={lang}>
              <span className="tri-tag">{LANG_NAMES[lang]}</span>
              {multiline ? (
                <textarea
                  className="st-textarea"
                  rows={2}
                  value={value?.[lang] || ""}
                  maxLength={maxLength}
                  onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                  spellCheck={false}
                  aria-label={`${label || "text"} ${lang}`}
                />
              ) : (
                <input
                  className="st-input"
                  value={value?.[lang] || ""}
                  maxLength={maxLength}
                  onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                  spellCheck={false}
                  aria-label={`${label || "text"} ${lang}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Chip({ tone, children }: { tone: "live" | "draft" | "off" | "err"; children: ReactNode }) {
  return (
    <span className={`st-chip ${tone}`}>
      <i className="fa-solid fa-circle" aria-hidden="true" /> {children}
    </span>
  );
}
