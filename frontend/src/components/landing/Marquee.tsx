import type { ReactNode } from "react";

interface MarqueeItem {
  label: string;
  icon: ReactNode;
}

/** Bandeau défilant en boucle infinie (liste dupliquée, translation -50 %). */
export function Marquee({ items, label }: { items: MarqueeItem[]; label: string }) {
  const loop = [...items, ...items];
  return (
    <div className="marquee-mask overflow-hidden" aria-label={label}>
      <ul className="animate-marquee flex w-max items-center gap-12 py-1">
        {loop.map((item, i) => (
          <li
            key={`${item.label}-${i}`}
            aria-hidden={i >= items.length}
            className="flex items-center gap-2.5 text-ink-subtle transition-colors hover:text-ink"
          >
            <span className="size-5 [&>svg]:size-5">{item.icon}</span>
            <span className="text-base font-medium tracking-tight">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
