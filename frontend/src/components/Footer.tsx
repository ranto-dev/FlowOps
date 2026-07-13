import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full max-w-7xl mx-auto px-6 py-4 mt-auto border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium">
      <div>
        &copy; {new Date().getFullYear()}{" "}
        <span className="text-slate-700 font-bold">FlowOps</span>. Conçu pour
        les soutenances d'ingénierie.
      </div>
      <div className="flex gap-4 mt-2 sm:mt-0 font-mono">
        <span className="hover:text-purple-600 cursor-pointer">
          No-Code Framework
        </span>
        <span>&bull;</span>
        <span className="hover:text-blue-500 cursor-pointer">
          GitHub Actions Compliant
        </span>
      </div>
    </footer>
  );
};

export default Footer;
