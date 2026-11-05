import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { CodeSurface } from "../components/ui/CodeSurface";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { PreferenceControls } from "../components/ui/PreferenceControls";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/useToast";

/** Page vivante du design system — disponible uniquement en mode dev (`/styleguide`). */

const SWATCHES: { token: string; cls: string }[] = [
  { token: "canvas", cls: "bg-canvas" },
  { token: "surface", cls: "bg-surface" },
  { token: "surface-2", cls: "bg-surface-2" },
  { token: "code", cls: "bg-code" },
  { token: "line-strong", cls: "bg-line-strong" },
  { token: "accent", cls: "bg-accent" },
  { token: "accent-hover", cls: "bg-accent-hover" },
  { token: "success", cls: "bg-success" },
  { token: "warning", cls: "bg-warning" },
  { token: "danger", cls: "bg-danger" },
  { token: "info", cls: "bg-info" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  const [modal, setModal] = useState(false);
  const toast = useToast();

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Design system</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Référence vivante — voir <code className="font-mono">docs/DESIGN-GUIDE.md</code>.
          </p>
        </div>
        <PreferenceControls />
      </header>

      <Section title="Couleurs">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.token} className="space-y-1.5">
              <div className={`h-12 rounded-md border border-line-strong ${s.cls}`} />
              <p className="font-mono text-xs text-ink-muted">{s.token}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-ink">ink</span>
          <span className="text-ink-muted">ink-muted</span>
          <span className="text-ink-subtle">ink-subtle</span>
          <span className="text-accent-ink">accent-ink</span>
        </div>
      </Section>

      <Section title="Verre et élévation">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="font-semibold text-ink">Niveau 0 — plat</p>
            <p className="mt-1 text-sm text-ink-muted">Zones denses, champs.</p>
          </div>
          <div className="glass rounded-lg border p-5">
            <p className="font-semibold text-ink">Niveau 1 — glass</p>
            <p className="mt-1 text-sm text-ink-muted">Headers, cartes, panneaux.</p>
          </div>
          <div className="glass-strong rounded-lg border p-5">
            <p className="font-semibold text-ink">Niveau 2 — glass-strong</p>
            <p className="mt-1 text-sm text-ink-muted">Modales, menus, toasts.</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-line p-8">
          <div className="halo-vivid" />
          <h3 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Des pipelines <span className="text-brand">sans YAML</span>
          </h3>
          <div className="mt-5 flex gap-3">
            <Button variant="brand" size="lg">Commencer</Button>
            <Button variant="secondary" size="lg">Documentation</Button>
          </div>
        </div>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges et statuts">
        <div className="flex flex-wrap gap-2">
          <Badge>neutral</Badge>
          <Badge tone="purple" dot>purple</Badge>
          <Badge tone="green" dot>green</Badge>
          <Badge tone="red" dot>red</Badge>
          <Badge tone="amber" dot>amber</Badge>
          <Badge tone="sky" dot>sky</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="completed" conclusion="success" />
          <StatusBadge status="completed" conclusion="failure" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="queued" />
        </div>
      </Section>

      <Section title="Champs (toujours opaques)">
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nom du projet" hint="Visible uniquement par vous.">
            {(id) => <Input id={id} placeholder="Production API" />}
          </Field>
          <Field label="Runner">
            {(id) => (
              <Select id={id} defaultValue="ubuntu-latest">
                <option>ubuntu-latest</option>
                <option>windows-latest</option>
              </Select>
            )}
          </Field>
          <Field label="Erreur" error="Ce champ est obligatoire.">
            {(id) => <Input id={id} aria-invalid="true" />}
          </Field>
          <Field label="Description">
            {(id) => <Textarea id={id} placeholder="Optionnel…" />}
          </Field>
        </Card>
      </Section>

      <Section title="Cartes">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">glass (défaut)</Card>
          <Card variant="solid" className="p-5">solid</Card>
          <Card interactive className="p-5">interactive</Card>
        </div>
      </Section>

      <Section title="Code, états, fenêtres flottantes">
        <CodeSurface>{`name: CI\non:\n  push:\n    branches:\n      - main`}</CodeSurface>
        <div className="grid gap-4 sm:grid-cols-3">
          <LoadingState label="Loading..." />
          <EmptyState title="Aucun projet" description="Créez votre premier projet." />
          <ErrorState message="Impossible de charger les données." />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>Ouvrir une modale</Button>
          <Button variant="secondary" onClick={() => toast.success("Workflow enregistré", "Exemple de toast.")}>
            Afficher un toast
          </Button>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Modale en verre renforcé" description="glass-strong">
          <p className="text-sm text-ink-muted">Le voile ne floute pas ; le flou est dans la fenêtre.</p>
        </Modal>
      </Section>
    </div>
  );
}
