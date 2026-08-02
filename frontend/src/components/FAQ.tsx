import { useState } from "react";
import ScrollReveal from "./utils/ScrollReveal";
import { ChevronDown } from "lucide-react";

const FAQ = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  return (
    <>
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center space-y-3 mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Got Questions?
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </ScrollReveal>

          <div className="space-y-3">
            {[
              {
                q: "Do I need to install anything on my GitHub repository?",
                a: "No! FlowOps uses GitHub OAuth and Webhook triggers. You don't need to modify any YAML workflow files.",
              },
              {
                q: "How does GitHub Device Flow work?",
                a: "Device Flow allows you to grant access securely without typing your GitHub password directly in FlowOps. You validate a generated code directly on GitHub's official domain.",
              },
              {
                q: "Is FlowOps free for open-source projects?",
                a: "Yes, 100% free forever for open source repositories and personal hobby projects.",
              },
              {
                q: "Can I connect multiple GitHub accounts?",
                a: "Yes, you can manage multiple repositories and organizations within the workspace dashboard.",
              },
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-purple-200 transition-all">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left text-sm font-bold text-slate-800 flex items-center justify-between gap-4 hover:text-purple-600 transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-purple-600 transition-transform duration-300 ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-300">
                      {item.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
