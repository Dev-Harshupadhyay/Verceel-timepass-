import { useTheme } from "@/state/ThemeProvider";
import { useToast } from "@/state/ToastProvider";
import { themeMeta } from "@/config";

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  const { toast } = useToast();

  const handle = () => {
    const next = toggle();
    toast(`🎨 ${themeMeta(next).name}`, "success");
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handle}
      aria-pressed={isDark}
      aria-label={isDark ? "Gold mode on — switch to Pearl Light" : "Switch to dark mode"}
      title={isDark ? "Switch to Pearl Light" : "Switch to Obsidian Gold"}
      data-testid="theme-toggle"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.7 8.7 0 1 0 11.1 11.1Z" />
        </svg>
      )}
    </button>
  );
}
