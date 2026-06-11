export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: "cat-alimentation", name: "Alimentation", icon: "shopping-cart", color: "#22c55e" },
  { id: "cat-restauration", name: "Restauration & Livraison", icon: "utensils", color: "#f97316" },
  { id: "cat-logement", name: "Logement", icon: "home", color: "#3b82f6" },
  { id: "cat-transport", name: "Transport", icon: "bus", color: "#06b6d4" },
  { id: "cat-sante", name: "Santé", icon: "heart-pulse", color: "#ef4444" },
  { id: "cat-beaute", name: "Beauté & Hygiène", icon: "sparkles", color: "#ec4899" },
  { id: "cat-vetements", name: "Vêtements", icon: "shirt", color: "#a855f7" },
  { id: "cat-loisirs", name: "Loisirs & Sorties", icon: "party-popper", color: "#eab308" },
  { id: "cat-abonnements", name: "Abonnements", icon: "repeat", color: "#8b5cf6" },
  { id: "cat-education", name: "Éducation", icon: "graduation-cap", color: "#14b8a6" },
  { id: "cat-divers", name: "Divers", icon: "more-horizontal", color: "#737373" },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { id: "cat-salaire", name: "Salaire", icon: "banknote", color: "#22c55e" },
  { id: "cat-prime", name: "Prime / Bonus", icon: "gift", color: "#eab308" },
  { id: "cat-freelance", name: "Freelance / Mandats", icon: "briefcase", color: "#3b82f6" },
  { id: "cat-remboursements", name: "Remboursements reçus", icon: "rotate-ccw", color: "#06b6d4" },
  { id: "cat-autres-revenus", name: "Autres revenus", icon: "plus-circle", color: "#737373" },
] as const;

export const DEFAULT_INVESTMENT_CATEGORIES = [
  { id: "inv-crypto", name: "Crypto-monnaies", icon: "bitcoin", color: "#f97316" },
  { id: "inv-etf", name: "ETF", icon: "line-chart", color: "#3b82f6" },
  { id: "inv-actions", name: "Actions", icon: "trending-up", color: "#22c55e" },
  { id: "inv-immobilier", name: "Immobilier", icon: "building", color: "#a855f7" },
  { id: "inv-obligations", name: "Obligations", icon: "landmark", color: "#06b6d4" },
  { id: "inv-autre", name: "Autre", icon: "more-horizontal", color: "#737373" },
] as const;

export const PROJECT_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#ec4899",
  "#a855f7",
  "#eab308",
  "#06b6d4",
  "#ef4444",
];
