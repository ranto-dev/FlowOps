import { SectionHeader, Reveal } from "./Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const QA = [
  {
    q: "What is FlowOps?",
    a: "FlowOps is a low-code platform for building, executing and optimizing GitHub Actions CI/CD workflows.",
  },
  {
    q: "Does FlowOps generate GitHub Actions workflows?",
    a: "Yes. You configure jobs and steps visually, and FlowOps generates a valid workflow.yml you can commit to your repository.",
  },
  {
    q: "Can I customize generated workflows?",
    a: "Yes. Every job and step exposes its parameters — runners, Node versions, scripts, Docker images — and the generated YAML stays editable.",
  },
  {
    q: "How does the prediction system work?",
    a: "FlowOps collects execution data, engineers features from it, and trains regression and classification models that estimate duration and failure risk before a run starts.",
  },
  {
    q: "What is MLflow used for?",
    a: "MLflow tracks every experiment, model version and metric, and serves as the model registry behind the prediction API.",
  },
  {
    q: "Can FlowOps monitor workflow executions?",
    a: "Yes. Trigger runs from the interface and follow jobs and per-job logs in real time.",
  },
  {
    q: "Is FlowOps open source?",
    a: "Yes. The source code is publicly available on GitHub under an open-source license.",
  },
];

export function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="FAQ"
          title={<span id="faq-title">Questions, answered.</span>}
        />
        <Reveal className="mt-10">
          <Accordion type="single" collapsible defaultValue="item-0">
            {QA.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
