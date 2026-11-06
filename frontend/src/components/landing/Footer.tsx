import { Link } from "react-router-dom";
import { GITHUB_URL } from "./data";
import { Separator } from "./ui/separator";
import { usePreferences } from "../../lib/usePreferences";
import Logo from "../../assets/logo-flowOps-transparent.png";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Predictions", href: "#mlops" },
      { label: "FAQ", href: "#faq" },
      { label: "Get Started", href: "/auth" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
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
  const { t } = usePreferences();
  return (
    <footer className="border-t border-line text-ink-muted">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="FlowOps home">
              <span className="flex size-8 items-center justify-center">
                <img src={Logo} alt="" className="size-full object-contain" />
              </span>
              <span className="text-sm font-semibold text-ink">
                FlowOps
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              {t("Low-code CI/CD workflow platform.")}
            </p>
          </div>
          <nav
            aria-label={t("Footer navigation")}
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-xs text-ink-subtle">
                  {t(col.title)}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-ink-muted transition-colors hover:text-ink"
                        >
                          {t(link.label)}
                        </a>
                      ) : link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="text-sm text-ink-muted transition-colors hover:text-ink"
                        >
                          {t(link.label)}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm text-ink-muted transition-colors hover:text-ink"
                        >
                          {t(link.label)}
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
        <p className="font-mono text-xs text-ink-subtle">© 2026 FlowOps</p>
      </div>
    </footer>
  );
}
