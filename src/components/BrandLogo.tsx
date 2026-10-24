import { useConfig } from "@/state/ConfigProvider";

export function BrandLogo({
  size = 32,
  className = "",
  alt
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  const { config } = useConfig();
  const src = config.brand.logoUrl || "/logo.svg";
  return (
    <img
      src={src}
      alt={alt || `${config.brand.name} logo`}
      width={size}
      height={size}
      className={`logo-img ${className}`.trim()}
      loading="eager"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = "/logo.svg";
        }
      }}
    />
  );
}
