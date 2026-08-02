import React from "react";
import { ArrowRight } from "lucide-react";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import LogoImage from "../assets/logo-flowOps-transparent.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800/80 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-purple-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          <div className="lg:col-span-5 space-y-2">
            <a className="flex items-center cursor-pointer group" href="/">
              <img src={LogoImage} className="h-20" />
              <span className="font-extrabold text-lg tracking-tight text-purple-600">
                FlowOps
              </span>
            </a>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              La plateforme CI/CD pensée pour les développeurs. Observez,
              déboguez et optimisez vos workflows GitHub Actions en temps réel.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Abonnez-vous aux mises à jour produit
            </h4>
            <p className="text-slate-400">
              Recevez les dernières fonctionnalités et guides d'optimisation
              CI/CD directement par mail.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-2 max-w-md"
            >
              <input
                type="email"
                placeholder="dev@entreprise.com"
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all flex-1"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 group"
              >
                <span>S'abonner</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Produit
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a
                  href="#features"
                  className="hover:text-purple-400 transition-colors"
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  className="hover:text-purple-400 transition-colors"
                >
                  Moteur Temps Réel
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-purple-400 transition-colors"
                >
                  Tarification
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5"
                >
                  Roadmap{" "}
                  <span className="text-[9px] font-mono bg-purple-950 text-purple-400 border border-purple-800/60 px-1.5 py-0.2 rounded-md">
                    v2.4
                  </span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne Développeurs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Développeurs
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a
                  href="#developer"
                  className="hover:text-purple-400 transition-colors"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Documentation CLI
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  SDK Node.js
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  GitHub Action Integration
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Webhooks API
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne Ressources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Ressources
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Guides & Tutoriels
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Blog Tech
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Exemples GitHub
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Communauté Discord
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="hover:text-purple-400 transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne Entreprise & Légal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Entreprise
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Sécurité & SOC2
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Confidentialité (RGPD)
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BAS DU FOOTER : COPYRIGHT & RESEAUX SOCIAUX                */}
        {/* ========================================================= */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            © {new Date().getFullYear()} FlowOps Inc. Tous droits réservés.
          </div>

          {/* Liens Réseaux Sociaux */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-white transition-all border border-slate-800"
            >
              <FaGithub className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-white transition-all border border-slate-800"
            >
              <FaXTwitter className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-white transition-all border border-slate-800"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
