import { Link } from "react-router-dom";
import { TerminalSquare } from "lucide-react";
import { GITHUB_URL } from "./data";
import { Separator } from "./ui/separator";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "MLOps", href: "#mlops" },
      { label: "FAQ", href: "#faq" },
      { label: "Get Started", href: "/auth" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: GITHUB_URL, external: true },
      { label: "Setup guide", href: "/setup" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: GITHUB_URL, external: true },
      { label: "Issues", href: `${GITHUB_URL}/issues`, external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#27272A]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="FlowOps home">
              <span className="flex size-8 items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B]">
                <TerminalSquare className="size-4 text-violet-400" />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-[#FAFAFA]">
                FlowOps
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#A1A1AA]">
              Low-code CI/CD workflow platform.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#71717A]">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
                        >
                          {link.label}
                        </a>
                      ) : link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="text-sm text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <Separator className="my-8" />
        <p className="font-mono text-xs text-[#71717A]">© 2026 FlowOps</p>
      </div>
    </footer>
  );
}
