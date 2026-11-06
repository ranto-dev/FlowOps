import React from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { PageHeader } from "../ui/PageHeader";
import { usePreferences } from "../../lib/usePreferences";

/** Onglet « Help » : démarrage rapide, prérequis et lien vers la documentation. */
export const HelpView: React.FC = () => {
  const { t } = usePreferences();
  const steps = [
    t("Create a project from one of your GitHub repositories."),
    t("Build the workflow in the form, then generate the YAML."),
    t("Save it, then press Run and follow the execution in History."),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("Help")} description={t("Documentation and best practices")} />
      <Card as="section" className="space-y-5 p-6">
        <div className="max-w-3xl space-y-4 text-sm text-ink-muted">
          <p>
            {t("FlowOps helps you model CI/CD workflows in low-code, publish them to a GitHub repository, and inspect runner executions.")}
          </p>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">{t("Quick start")}</h2>
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-ink">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-4 text-xs text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">{t("Prerequisite:")}</span>{" "}
              {t("A local or remote MongoDB instance on port")}{" "}
              <code className="rounded-md bg-warning/10 px-1 py-0.5 font-mono font-semibold">
                27017
              </code>{" "}
              {t("and the backend service must be available before triggering runs.")}
            </span>
          </div>

          <Link
            to="/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-accent-ink hover:text-ink"
          >
            {t("View documentation")} <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
      </Card>
    </div>
  );
};
