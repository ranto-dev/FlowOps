import {
  Container,
  Download,
  GitBranch,
  Package,
  Settings2,
  TerminalSquare,
  Upload,
} from "lucide-react";
import { Reveal, SectionHeader } from "./Reveal";
import { usePreferences } from "../../lib/usePreferences";

const NODES = [
  { icon: GitBranch, label: "Trigger" },
  { icon: Download, label: "Checkout repository" },
  { icon: Settings2, label: "Set up Node.js" },
  { icon: Package, label: "Run npm script" },
  { icon: Container, label: "Build Docker image" },
  { icon: Upload, label: "Upload artifact" },
  { icon: TerminalSquare, label: "Custom command" },
];

export function WorkflowBuilder() {
  const { t } = usePreferences();
  return (
    <section
      id="how-it-works"
      aria-labelledby="builder-title"
      className="scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("Low-code builder")}
          title={<span id="builder-title">{t("Build workflows visually.")}</span>}
          description={t("Configure your pipeline without writing YAML from scratch.")}
        />
        <div className="glass-flat mx-auto mt-12 max-w-md overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="ml-2 font-mono text-xs text-ink-subtle">workflow</span>
          </div>
          <div className="p-5" role="list" aria-label={t("Pipeline nodes")}>
          {NODES.map((node, i) => (
            <div key={node.label}>
              <Reveal
                delay={Math.min(i, 3) * 0.05}
                className="flex items-center gap-4 rounded-md border border-line bg-surface-2 px-4 py-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15">
                  <node.icon className="size-4 text-accent-ink" aria-hidden="true" />
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {t(node.label)}
                  </span>
                </div>
              </Reveal>
              {i < NODES.length - 1 && (
                <div
                  className="flex justify-center py-1"
                  aria-hidden="true"
                >
                  <span className="block h-6 w-px bg-line-strong" />
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
