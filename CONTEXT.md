# BudgetX — Application Web de Gestion Financière Personnelle (PWA)

## Vue d'ensemble

BudgetX est une **Progressive Web App (PWA)** de gestion financière personnelle développée pour un usage privé. Elle est déployée sur Vercel et accessible depuis le navigateur mobile (Safari iOS), avec possibilité d'installation sur l'écran d'accueil. Toutes les données sont stockées **localement dans le navigateur** (IndexedDB via PGlite). La devise de référence est le **CHF (Franc suisse)**.

---

## Stack Technique

| Couche | Technologie | Justification |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Web-first, déploiement Vercel natif, file-based routing |
| Langage | **TypeScript** | Typage fort, maintenabilité |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Design système cohérent, mobile-first |
| Base de données | **Drizzle ORM + PGlite (WASM)** | PostgreSQL dans le navigateur, persistance IndexedDB, offline complet |
| State management | **Zustand** | Léger, simple, performant |
| Graphiques | **Recharts** | Charts React natifs, responsive |
| Icônes | **Lucide React** | Bibliothèque moderne, légère |
| Dates | **date-fns** | Manipulation de dates légère |
| PWA | **next-pwa** | Manifest, service worker, installation écran d'accueil |
| Déploiement | **Vercel** | Gratuit, zero-config avec Next.js |
| Export | **JSON/CSV** via API route ou client-side | Sauvegarde manuelle |

**Aucun backend requis.** Toutes les données sont stockées dans IndexedDB via PGlite (PostgreSQL WASM). Zéro serveur, zéro coût, 100% privé.

---

## Architecture

```
budgetx/
├── app/
│   ├── layout.tsx                  # Root layout (PWA meta, thème)
│   ├── page.tsx                    # Redirect → /dashboard
│   ├── onboarding/
│   │   └── page.tsx                # Écran d'onboarding (premier lancement)
│   ├── dashboard/
│   │   └── page.tsx                # Vue d'ensemble
│   ├── transactions/
│   │   └── page.tsx                # Dépenses & Revenus
│   ├── debts/
│   │   └── page.tsx                # Dettes & Poursuites
│   ├── investments/
│   │   └── page.tsx                # Investissements
│   ├── savings/
│   │   └── page.tsx                # Épargne projets
│   └── analytics/
│       └── page.tsx                # Analyses & Projections
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx           # Navigation tab bar (mobile)
│   │   └── PageHeader.tsx
│   ├── ui/                         # shadcn/ui components
│   ├── forms/                      # Formulaires ajout/édition
│   ├── charts/                     # Wrappers Recharts
│   └── shared/                     # Cards, badges, etc.
├── db/
│   ├── client.ts                   # Initialisation PGlite
│   ├── schema.ts                   # Schéma Drizzle
│   ├── migrations/
│   └── queries/                    # Requêtes par domaine
├── stores/                         # Stores Zustand
├── hooks/                          # Custom hooks (useTransactions, useDebts, etc.)
├── utils/
│   ├── currency.ts                 # Formatage CHF
│   ├── dates.ts                    # Helpers dates
│   └── export.ts                   # Export JSON/CSV
├── constants/
│   └── categories.ts               # Catégories par défaut
└── public/
    ├── manifest.json               # PWA manifest
    └── icons/                      # Icônes app (192x192, 512x512)
```

---

## Fonctionnalités

### 1. Dashboard (Vue d'ensemble)
- Solde net du mois en cours (revenus − dépenses − remboursements)
- Résumé rapide : total dépenses, total revenus, total dettes actives
- Barre de progression du budget mensuel
- Prochains paiements/mensualités à venir (7 prochains jours)
- Indicateur d'épargne mensuelle réalisée

### 2. Transactions — Dépenses & Revenus

#### Saisie de transactions
- Montant en CHF
- Type : **Dépense** ou **Revenu**
- Date : passée, présente ou **future** (planifiée)
- Catégorie (voir liste ci-dessous)
- Note optionnelle
- Récurrence optionnelle : unique / hebdomadaire / mensuel / annuel

#### Catégories de dépenses (prédéfinies)
- Alimentation (courses, supermarché)
- Restauration & Livraison (Uber Eats, Just Eat, etc.)
- Logement (loyer, charges)
- Transport (bus, train, voiture, essence)
- Santé (médecin, pharmacie)
- Beauté & Hygiène (coiffeur, cosmétiques)
- Vêtements
- Loisirs & Sorties
- Abonnements (Netflix, téléphone, etc.)
- Éducation
- Divers

#### Catégories de revenus (prédéfinies)
- Salaire
- Prime / Bonus
- Freelance / Mandats
- Remboursements reçus
- Autres revenus

> **Catégories personnalisées** : l'utilisateur peut créer, renommer et supprimer des catégories dans les deux types (sauf catégories par défaut).

### 3. Dettes & Arrangements de Paiement

#### Champs par dette
- Nom / Créancier
- Montant total dû (CHF)
- Montant déjà remboursé
- Mensualité convenue (CHF/mois)
- Nombre de mensualités restantes (calculé automatiquement)
- Date de début du plan
- Date de fin estimée (calculée)
- Statut : En cours / Soldée / En pause
- Notes

#### Poursuites (dette légale)
- Même structure que les dettes, avec un type spécial **"Poursuite"**
- Champ supplémentaire : numéro de réquisition (optionnel)
- Montant total des poursuites affiché séparément sur le dashboard
- Les remboursements mensuels des poursuites sont comptabilisés dans le bilan mensuel

### 4. Investissements

#### Catégories d'investissement (prédéfinies + personnalisables)
- Crypto-monnaies
- ETF
- Actions
- Immobilier
- Obligations
- Autre

#### Saisie par entrée d'investissement
- Catégorie
- Actif/Nom (ex : Bitcoin, S&P 500 ETF)
- Montant investi (CHF)
- Date d'investissement
- Note optionnelle
- (optionnel) Valeur actuelle estimée — saisie manuelle

**Pas d'API de prix en temps réel.** L'utilisateur met à jour la valeur manuellement.

### 5. Épargne Projets

#### Champs par projet
- Nom du projet (ex : Vacances Grèce, Nouveau téléphone)
- Objectif en CHF
- Montant épargné à ce jour
- Date cible (optionnelle)
- Couleur du projet
- Progression % affichée

### 6. Analyses & Projections

#### Analyses
- Graphique donut : répartition des dépenses par catégorie
- Graphique linéaire : évolution du solde net sur 6/12 mois
- Graphique barres : revenus vs dépenses par mois
- Top 5 catégories de dépenses
- Taux d'épargne mensuel

#### Projections
- Projection du solde net dans N mois
- Date estimée de remboursement total des dettes
- Projection d'atteinte des objectifs d'épargne
- Alerte si dépenses projetées > revenus projetés

---

## Modèles de Données (Schéma Drizzle / PostgreSQL)

### `transactions`
```sql
id             TEXT PRIMARY KEY
type           TEXT NOT NULL  -- 'expense' | 'income'
amount         NUMERIC NOT NULL  -- en CHF, toujours positif
category_id    TEXT NOT NULL REFERENCES categories(id)
date           DATE NOT NULL  -- peut être dans le futur
note           TEXT
is_recurring   BOOLEAN DEFAULT FALSE
recurrence     TEXT  -- 'weekly' | 'monthly' | 'yearly' | NULL
recurrence_end DATE
created_at     TIMESTAMP NOT NULL DEFAULT NOW()
updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
```

### `categories`
```sql
id         TEXT PRIMARY KEY
name       TEXT NOT NULL
type       TEXT NOT NULL  -- 'expense' | 'income'
icon       TEXT
color      TEXT
is_default BOOLEAN DEFAULT FALSE
created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

### `debts`
```sql
id               TEXT PRIMARY KEY
name             TEXT NOT NULL
creditor         TEXT
type             TEXT NOT NULL  -- 'debt' | 'pursuit'
total_amount     NUMERIC NOT NULL
paid_amount      NUMERIC NOT NULL DEFAULT 0
monthly_payment  NUMERIC NOT NULL
start_date       DATE NOT NULL
status           TEXT NOT NULL  -- 'active' | 'paid' | 'paused'
pursuit_number   TEXT
note             TEXT
created_at       TIMESTAMP NOT NULL DEFAULT NOW()
updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
```

### `debt_payments`
```sql
id         TEXT PRIMARY KEY
debt_id    TEXT NOT NULL REFERENCES debts(id)
amount     NUMERIC NOT NULL
date       DATE NOT NULL
note       TEXT
created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

### `investments`
```sql
id               TEXT PRIMARY KEY
category_id      TEXT NOT NULL REFERENCES investment_categories(id)
asset_name       TEXT NOT NULL
amount_invested  NUMERIC NOT NULL
current_value    NUMERIC
investment_date  DATE NOT NULL
note             TEXT
created_at       TIMESTAMP NOT NULL DEFAULT NOW()
updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
```

### `investment_categories`
```sql
id         TEXT PRIMARY KEY
name       TEXT NOT NULL
icon       TEXT
color      TEXT
is_default BOOLEAN DEFAULT FALSE
created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

### `savings_projects`
```sql
id           TEXT PRIMARY KEY
name         TEXT NOT NULL
goal_amount  NUMERIC NOT NULL
saved_amount NUMERIC NOT NULL DEFAULT 0
target_date  DATE
color        TEXT
created_at   TIMESTAMP NOT NULL DEFAULT NOW()
updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
```

### `savings_contributions`
```sql
id             TEXT PRIMARY KEY
project_id     TEXT NOT NULL REFERENCES savings_projects(id)
amount         NUMERIC NOT NULL
date           DATE NOT NULL
note           TEXT
transaction_id TEXT
created_at     TIMESTAMP NOT NULL DEFAULT NOW()
```

### `profile`
```sql
id               TEXT PRIMARY KEY DEFAULT 'default'
initial_balance  NUMERIC NOT NULL DEFAULT 0  -- solde bancaire au moment de l'onboarding
monthly_salary   NUMERIC NOT NULL DEFAULT 0
onboarding_done  BOOLEAN DEFAULT FALSE
created_at       TIMESTAMP NOT NULL DEFAULT NOW()
```

---

## Règles Métier Importantes

1. **Solde réel** = `initial_balance` + Σ revenus enregistrés − Σ dépenses enregistrées − Σ remboursements dettes
2. **Solde mensuel** = Σ revenus du mois − Σ dépenses du mois − Σ remboursements dettes du mois
3. **Transactions futures** : incluses dans les projections, exclues du bilan "réalisé" (`date <= today`)
4. **Mensualités restantes** = `CEIL((total_amount - paid_amount) / monthly_payment)`
5. **Date de fin estimée** d'une dette = aujourd'hui + mensualités_restantes mois
6. **Taux d'épargne** = `(épargne_versée_ce_mois / revenu_ce_mois) * 100`
7. Les catégories `is_default = TRUE` ne peuvent pas être supprimées, seulement renommées

---

## UX & Design

- **Layout mobile-first** : conçu pour iPhone (375–430px), utilisable sur desktop
- **Navigation** : bottom tab bar fixe avec 5 onglets (Dashboard, Transactions, Dettes, Investissements, Épargne) + bouton Analyses sur le Dashboard
- **Thème** : sombre (dark mode) par défaut, toggle light/dark
- **Langue** : Français uniquement (FR-CH)
- **Formatage des montants** : `CHF 1'234.50` (apostrophe comme séparateur de milliers)
- **Formatage des dates** : `dd.MM.yyyy`
- **Onboarding** : à la première ouverture (`profile.onboarding_done = false`), afficher un écran qui demande (1) le solde bancaire courant et (2) le salaire mensuel net, puis rediriger vers le dashboard
- **FAB** : bouton flottant "+" pour ajouter rapidement une transaction depuis n'importe quel écran

---

## PWA

- `public/manifest.json` avec `display: "standalone"`, couleur de thème sombre, icônes
- `next-pwa` configuré pour cacher les assets statiques (offline support)
- Meta tags iOS dans `<head>` : `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`

---

## Déploiement

- **Vercel** : push sur `main` → déploiement automatique
- Variables d'environnement : aucune requise (tout est client-side)
- PGlite tourne entièrement côté client → pas de serverless functions nécessaires

---

## Ce qui N'est PAS dans le scope (v1)

- Authentification / comptes utilisateurs
- Synchronisation cloud
- Connexion aux banques (Open Banking)
- Prix d'actifs en temps réel
- Support multi-devises
- Notifications push
- Version Android native

---

## Statut du Projet

- [x] Setup Next.js 15 + Tailwind + shadcn/ui + PWA
- [x] Initialisation PGlite + Drizzle schema + seed catégories
- [x] Onboarding (solde initial + salaire)
- [x] Layout principal (bottom nav, FAB)
- [x] Module Transactions (CRUD)
- [x] Module Dettes & Poursuites (CRUD)
- [x] Module Investissements (CRUD)
- [x] Module Épargne Projets (CRUD)
- [x] Dashboard
- [x] Analyses & Projections
- [x] Export JSON/CSV
- [x] Polish UI / Dark mode
- [ ] Config Vercel + déploiement

---

*Dernière mise à jour : 2026-06-11*
