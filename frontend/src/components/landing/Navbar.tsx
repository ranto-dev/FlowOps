import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { GITHUB_URL, NAV_LINKS } from "./data";
import { Button } from "./ui/button";
import { PreferenceControls } from "../ui/PreferenceControls";
import { usePreferences } from "../../lib/usePreferences";
import Logo from "../../assets/logo-flowOps-transparent.png";

export function Navbar() {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 border-b ${scrolled || open ? "glass-strong animate-navbar-drop" : "border-transparent bg-transparent"}`}>
      <nav
        aria-label={t("Main navigation")}
        className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-6 ${scrolled ? "h-14" : "h-16"}`}
      >
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="FlowOps home"
        >
          <span className="flex size-8 items-center justify-center">
            <img src={Logo} alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-sm font-semibold text-ink">FlowOps</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {link.internal ? (
                <Link
                  to={link.href}
                  className="rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {t(link.label)}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {t(link.label)}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <PreferenceControls compact />
          <Button variant="ghost" size="sm" asChild>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={t("View FlowOps on GitHub")}
            >
              <FaGithub className="size-4" />
              GitHub
            </a>
          </Button>
          <Button size="sm" variant="brand" asChild>
            <Link to="/auth">{t("Get started")}</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-10 items-center justify-center rounded-md border border-line bg-surface text-ink lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
      <div className="absolute right-16 top-3 lg:hidden">
        <PreferenceControls compact />
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label={t("Mobile navigation")}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line lg:hidden"
          >
            <ul className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  {link.internal ? (
                    <Link
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      {t(link.label)}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    >
                      {t(link.label)}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
            <div className="flex gap-2 border-t border-line px-4 py-4">
              <Button
                variant="secondary"
                className="flex-1"
                asChild
                onClick={() => setOpen(false)}
              >
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                  <FaGithub className="size-4" />
                  GitHub
                </a>
              </Button>
              <Button
                variant="brand"
                className="flex-1"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link to="/auth">{t("Get started")}</Link>
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
