export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Alimentation", icon: "shopping-cart", color: "#22c55e" },
  { name: "Restauration & Livraison", icon: "utensils", color: "#f97316" },
  { name: "Logement", icon: "home", color: "#3b82f6" },
  { name: "Transport", icon: "car", color: "#eab308" },
  { name: "Santé", icon: "heart-pulse", color: "#ef4444" },
  { name: "Beauté & Hygiène", icon: "sparkles", color: "#ec4899" },
  { name: "Vêtements", icon: "shirt", color: "#8b5cf6" },
  { name: "Loisirs & Sorties", icon: "party-popper", color: "#06b6d4" },
  { name: "Abonnements", icon: "repeat", color: "#6366f1" },
  { name: "Éducation", icon: "graduation-cap", color: "#14b8a6" },
  { name: "Divers", icon: "more-horizontal", color: "#64748b" },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salaire", icon: "briefcase", color: "#22c55e" },
  { name: "Prime / Bonus", icon: "gift", color: "#f59e0b" },
  { name: "Freelance / Mandats", icon: "laptop", color: "#3b82f6" },
  { name: "Remboursements reçus", icon: "undo-2", color: "#8b5cf6" },
  { name: "Autres revenus", icon: "plus-circle", color: "#64748b" },
] as const;

export const DEFAULT_INVESTMENT_CATEGORIES = [
  { name: "Crypto", icon: "bitcoin", color: "#f7931a" },
  { name: "ETF", icon: "line-chart", color: "#3b82f6" },
  { name: "Actions", icon: "trending-up", color: "#22c55e" },
  { name: "Immobilier", icon: "building", color: "#8b5cf6" },
  { name: "Obligations", icon: "landmark", color: "#64748b" },
  { name: "Autre", icon: "circle-dollar-sign", color: "#06b6d4" },
] as const;
