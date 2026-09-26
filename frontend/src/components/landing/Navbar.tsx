import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, TerminalSquare, X } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { GITHUB_URL, NAV_LINKS } from "./data";
import { Button } from "./ui/button";
import { cn } from "../../lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open
          ? "border-b border-[#27272A] bg-[#09090B]/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="FlowOps home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B]">
            <TerminalSquare className="size-4 text-violet-400" />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-[#FAFAFA]">
            FlowOps
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {link.internal ? (
                <Link
                  to={link.href}
                  className="rounded-md px-3 py-2 text-sm text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA]"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA]"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View FlowOps on GitHub"
            >
              <FaGithub className="size-4" />
              GitHub
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-10 items-center justify-center rounded-lg border border-[#27272A] bg-[#111113] text-[#FAFAFA] lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#27272A] bg-[#09090B]/95 backdrop-blur-md lg:hidden"
          >
            <ul className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  {link.internal ? (
                    <Link
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-[15px] text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA]"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-[15px] text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA]"
                    >
                      {link.label}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
            <div className="flex gap-2 border-t border-[#27272A] px-4 py-4">
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
              <Button className="flex-1" asChild onClick={() => setOpen(false)}>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
