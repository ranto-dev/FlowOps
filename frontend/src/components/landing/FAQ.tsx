import { SectionHeader, Reveal } from "./Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { usePreferences } from "../../lib/usePreferences";

const QA = [
  {
    q: "What is FlowOps?",
    a: "FlowOps is a low-code platform for building, executing and optimizing GitHub Actions CI/CD workflows.",
  },
  {
    q: "Does FlowOps generate GitHub Actions workflows?",
    a: "Yes. Configure jobs and steps visually, then preview valid workflow YAML before saving it to your repository.",
  },
  {
    q: "Can I customize generated workflows?",
    a: "Yes. Configure supported job and step parameters, including runners, Node versions, scripts and Docker images.",
  },
  {
    q: "How does the prediction system work?",
    a: "The local MLOps pipeline trains models on workflow run data to estimate duration and failure risk when compatible models are available.",
  },
  {
    q: "What is MLflow used for?",
    a: "MLflow tracks experiments, metrics and model versions for the local prediction pipeline.",
  },
  {
    q: "Can FlowOps monitor workflow executions?",
    a: "FlowOps triggers GitHub Actions runs and refreshes run status. Job logs can be retrieved from GitHub after they are available; this is not live streaming.",
  },
  {
    q: "Is FlowOps open source?",
    a: "Review the project repository and its license for current source availability and terms.",
  },
];

export function FAQ() {
  const { t } = usePreferences();
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("FAQ")}
          title={<span id="faq-title">{t("Questions, answered.")}</span>}
        />
        <Reveal className="mt-10">
          <Accordion type="single" collapsible defaultValue="item-0">
            {QA.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger>{t(item.q)}</AccordionTrigger>
                <AccordionContent>{t(item.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
