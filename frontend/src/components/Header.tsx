import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LogoImage from "../assets/logo-flowOps-transparent.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const LINKS = [
    {
      link: "Features",
      to: "features",
    },
    {
      link: "Architecture",
      to: "architecture",
    },
    {
      link: "Developer API",
      to: "developer",
    },
    {
      link: "Pricing",
      to: "pricing",
    },
    {
      link: "FAQ",
      to: "faq",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a className="flex items-center cursor-pointer group" href="/">
            <img src={LogoImage} className="h-20" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors">
              FlowOps
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            {LINKS.map((l) => {
              return (
                <a
                  href={`#${l.to}`}
                  className="hover:text-purple-600 transition-colors duration-200 hover:-translate-y-0.5 inline-block"
                >
                  {l.link}
                </a>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-purple-600 transition-all duration-200 hover:scale-105"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-purple-900 text-white rounded-xl shadow-sm hover:shadow-purple-900/30 transition-all duration-300 flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-lg border-b border-slate-200 px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
              {LINKS.map((l) => {
                return (
                  <a
                    href={`#${l.to}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-purple-600"
                  >
                    {l.link}
                  </a>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => navigate("/auth")}
                className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="w-full py-2.5 text-xs font-bold bg-purple-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>
      ;
    </>
  );
};

export default Header;
