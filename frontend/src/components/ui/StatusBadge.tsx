import React from "react";
import { usePreferences } from "../../lib/usePreferences";
import { Badge, type BadgeTone } from "./Badge";

/** Statut / conclusion d'un run GitHub Actions. */
export const StatusBadge: React.FC<{
  status?: string | null;
  conclusion?: string | null;
}> = ({ status, conclusion }) => {
  const { t } = usePreferences();
  let tone: BadgeTone = "neutral";
  let label = status ?? "unknown";

  if (status === "completed") {
    label = conclusion ?? "completed";
    if (conclusion === "success") {
      tone = "green";
      label = t("Succeeded");
    } else if (conclusion === "failure") {
      tone = "red";
      label = t("Failed");
    } else if (conclusion === "cancelled") {
      tone = "amber";
    }
  } else if (status === "in_progress") {
    tone = "sky";
    label = t("Running");
  } else if (status === "queued") {
    tone = "amber";
    label = t("Queued");
  }

  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
};
