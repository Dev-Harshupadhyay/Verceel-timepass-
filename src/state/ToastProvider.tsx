import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ToastTone = "default" | "success" | "error" | "warn";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let uid = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const timers = useRef<Map<number, number>>(new Map());

  const toast = useCallback((message: string, tone: ToastTone = "default") => {
    const id = uid++;
    setItems((prev) => [...prev.slice(-3), { id, message, tone }]);
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 2600);
    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => window.clearTimeout(t));
      map.clear();
    };
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setDialog({ ...options, resolve });
      }),
    []
  );

  const close = (value: boolean) => {
    if (!dialog) return;
    dialog.resolve(value);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div id="toastHost" aria-live="polite" role="status">
        {items.map((t) => (
          <div key={t.id} className={`toast tone-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
      {dialog ? (
        <div className="dialog-overlay" role="presentation" onClick={() => close(false)}>
          <div
            className="dialog-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tp-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tp-dialog-title">{dialog.title}</h2>
            {dialog.message ? <p>{dialog.message}</p> : null}
            <div className="dialog-actions">
              <button type="button" className="st-btn" onClick={() => close(false)}>
                {dialog.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                className={`st-btn ${dialog.danger ? "danger" : "primary"}`}
                onClick={() => close(true)}
                autoFocus
              >
                {dialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
