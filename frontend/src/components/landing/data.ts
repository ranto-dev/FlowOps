export const GITHUB_URL = "https://github.com/ranto-dev/FlowOps";

export interface NavLink {
  label: string;
  href: string;
  internal?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Predictions", href: "#mlops" },
  { label: "Documentation", href: "/docs", internal: true },
];
