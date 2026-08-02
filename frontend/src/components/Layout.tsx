import type { PropsWithChildren } from "react";

const Layout = (props: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900 scroll-smooth">
      {props.children}
    </div>
  );
};

export default Layout;
