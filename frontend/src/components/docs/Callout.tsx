import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CalloutTone } from "../../docs/types";
import { cn } from "../../lib/utils";
import { InlineText } from "./InlineText";
import { usePreferences } from "../../lib/usePreferences";

const TONES: Record<
  CalloutTone,
  { label: string; icon: LucideIcon; box: string; icon_: string }
> = {
  note: {
    label: "Note",
    icon: Info,
    box: "border-info/30 bg-info/10",
    icon_: "text-info",
  },
  tip: {
    label: "Tip",
    icon: Lightbulb,
    box: "border-success/30 bg-success/10",
    icon_: "text-success",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    box: "border-warning/30 bg-warning/10",
    icon_: "text-warning",
  },
};

export function Callout({
  tone,
  title,
  text,
}: {
  tone: CalloutTone;
  title?: string;
  text: string;
}) {
  const style = TONES[tone];
  const { t } = usePreferences();
  const Icon = style.icon;
  return (
    <aside
      role="note"
      className={cn("my-6 flex gap-3 rounded-lg border p-4", style.box)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.icon_)} aria-hidden />
      <div className="min-w-0 text-sm leading-6 text-ink">
        <p className="font-semibold text-ink">{title ?? t(style.label)}</p>
        <p className="mt-1">
          <InlineText text={text} />
        </p>
      </div>
    </aside>
  );
}
