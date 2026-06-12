# BudgetX — Application Web de Gestion Financière Personnelle (PWA)

## Vue d'ensemble

BudgetX est une **Progressive Web App (PWA)** de gestion financière personnelle. Elle est déployée sur Vercel, accessible depuis le navigateur mobile (Safari iOS) avec installation possible sur l'écran d'accueil. Les données sont stockées dans une base **PostgreSQL cloud (Neon)** et protégées par authentification. La devise de référence est le **CHF (Franc suisse)**.

---

## Stack Technique

| Couche | Technologie | Justification |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Web-first, déploiement Vercel natif, file-based routing |
| Langage | **TypeScript** | Typage fort, maintenabilité |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Design système cohérent, mobile-first |
| Base de données | **Neon (PostgreSQL serverless)** | Free tier permanent, 0.5 GB, parfait pour usage perso |
| ORM | **Drizzle ORM** | Requêtes typées, migrations, compatible Neon |
| Authentification | **Auth.js v5 (NextAuth)** | Gratuit, open source, natif Next.js App Router |
| State management | **Zustand** | Léger, simple, performant |
| Graphiques | **Recharts** | Charts React natifs, responsive |
| Icônes | **Lucide React** | Bibliothèque moderne, légère |
| Dates | **date-fns** | Manipulation de dates légère |
| PWA | **next-pwa** | Manifest, service worker, installation écran d'accueil |
| Déploiement | **Vercel** | Gratuit, zero-config avec Next.js |
| Export | **JSON/CSV** via API route | Sauvegarde manuelle des données |

---

## Architecture

```
budgetx/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Redirect → /dashboard (si connecté) ou /login
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── onboarding/page.tsx             # Premier lancement après inscription
│   ├── dashboard/page.tsx
│   ├── transactions/page.tsx
│   ├── debts/page.tsx
│   ├── investments/page.tsx
│   ├── savings/page.tsx
│   └── analytics/page.tsx
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx               # Tab bar mobile
│   │   └── PageHeader.tsx
│   ├── ui/                             # shadcn/ui
│   ├── forms/
│   ├── charts/
│   └── shared/
├── lib/
│   ├── auth.ts                         # Config Auth.js
│   └── db.ts                           # Client Drizzle + Neon
├── db/
│   ├── schema.ts                       # Schéma Drizzle
│   ├── migrations/
│   └── queries/                        # Requêtes par domaine
├── stores/                             # Zustand stores
├── hooks/
├── utils/
│   ├── currency.ts                     # Formatage CHF
│   ├── dates.ts
│   └── export.ts
├── constants/
│   └── categories.ts                   # Catégories par défaut
└── public/
    ├── manifest.json
    └── icons/
```

---

## Authentification

- **Auth.js v5** avec stratégie **Credentials** (email + mot de passe hashé avec bcrypt)
- Sessions gérées via JWT (stateless, compatible Vercel Edge)
- Routes protégées via middleware Next.js : toutes les pages sauf `/login` et `/register` redirigent vers `/login` si non authentifié
- Après inscription → redirect vers `/onboarding` si `profile.onboarding_done = false`
- Après login → redirect vers `/dashboard`

### Flow utilisateur
1. `/register` → création compte (email + password) → onboarding
2. `/login` → connexion → dashboard
3. Toutes les données sont scopées au `user_id` de la session

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
- Catégorie
- Note optionnelle
- Récurrence optionnelle : unique / hebdomadaire / mensuel / annuel

#### Catégories de dépenses (prédéfinies)
- Alimentation, Restauration & Livraison, Logement, Transport, Santé, Beauté & Hygiène, Vêtements, Loisirs & Sorties, Abonnements, Éducation, Divers

#### Catégories de revenus (prédéfinies)
- Salaire, Prime / Bonus, Freelance / Mandats, Remboursements reçus, Autres revenus

> **Catégories personnalisées** : création, renommage, suppression (sauf catégories par défaut).

### 3. Dettes & Arrangements de Paiement

#### Champs par dette
- Nom / Créancier, Montant total dû, Montant déjà remboursé, Mensualité convenue **(optionnelle)**, Nombre de mensualités restantes (calculé si mensualité définie), Date de début, Date de fin estimée (calculée si mensualité définie), Statut (En cours / Soldée / En pause), Notes

#### Poursuites (dette légale)
- Type spécial **"Poursuite"** avec champ numéro de réquisition (optionnel)
- Montant total des poursuites affiché séparément sur le dashboard
- Remboursements comptabilisés dans le bilan mensuel

### 4. Investissements
- Catégories : Crypto, ETF, Actions, Immobilier, Obligations, Autre (+ personnalisables)
- Saisie : actif, montant investi, date, valeur actuelle (manuelle), note
- Pas d'API de prix en temps réel

### 5. Épargne Projets
- Pots virtuels avec objectif CHF, montant épargné, date cible, couleur, progression %

### 6. Analyses & Projections
- Donut répartition dépenses, linéaire solde net 6/12 mois, barres revenus vs dépenses
- Projections : solde dans N mois, date remboursement dettes, atteinte objectifs épargne

---

## Modèles de Données (Schéma Drizzle / PostgreSQL)

> **Important** : toutes les tables métier ont un `user_id` qui référence `users(id)`. Toutes les requêtes doivent filtrer par `user_id` issu de la session Auth.js.

### `users` (géré par Auth.js)
```sql
id             TEXT PRIMARY KEY
email          TEXT NOT NULL UNIQUE
password_hash  TEXT NOT NULL
created_at     TIMESTAMP NOT NULL DEFAULT NOW()
```

### `profiles`
```sql
id               TEXT PRIMARY KEY  -- = user_id
user_id          TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
initial_balance  NUMERIC NOT NULL DEFAULT 0
monthly_salary   NUMERIC NOT NULL DEFAULT 0
onboarding_done  BOOLEAN DEFAULT FALSE
created_at       TIMESTAMP NOT NULL DEFAULT NOW()
```

### `transactions`
```sql
id             TEXT PRIMARY KEY
user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
type           TEXT NOT NULL  -- 'expense' | 'income'
amount         NUMERIC NOT NULL
category_id    TEXT NOT NULL REFERENCES categories(id)
date           DATE NOT NULL
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
user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
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
user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
name             TEXT NOT NULL
creditor         TEXT
type             TEXT NOT NULL  -- 'debt' | 'pursuit'
total_amount     NUMERIC NOT NULL
paid_amount      NUMERIC NOT NULL DEFAULT 0
monthly_payment  NUMERIC        -- NULL si aucune mensualité définie
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
user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
debt_id    TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE
amount     NUMERIC NOT NULL
date       DATE NOT NULL
note       TEXT
created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

### `investments`
```sql
id               TEXT PRIMARY KEY
user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
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
user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
name       TEXT NOT NULL
icon       TEXT
color      TEXT
is_default BOOLEAN DEFAULT FALSE
created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

### `savings_projects`
```sql
id           TEXT PRIMARY KEY
user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
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
user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
project_id     TEXT NOT NULL REFERENCES savings_projects(id) ON DELETE CASCADE
amount         NUMERIC NOT NULL
date           DATE NOT NULL
note           TEXT
transaction_id TEXT
created_at     TIMESTAMP NOT NULL DEFAULT NOW()
```

---

## Règles Métier

1. **Solde réel** = `initial_balance` + Σ revenus − Σ dépenses − Σ remboursements dettes
2. **Solde mensuel** = Σ revenus du mois − Σ dépenses du mois − Σ remboursements du mois
3. **Transactions futures** : exclues du bilan réalisé (`date <= today`), incluses dans les projections
4. **Mensualités restantes** = `CEIL((total_amount - paid_amount) / monthly_payment)` — affiché uniquement si `monthly_payment` est défini
5. **Date de fin estimée** dette = aujourd'hui + mensualités_restantes mois — affichée uniquement si `monthly_payment` est défini
6. **Taux d'épargne** = `(épargne_versée_ce_mois / revenu_ce_mois) * 100`
7. Catégories `is_default = TRUE` : non supprimables, renommables uniquement
8. À la création d'un compte → seed automatique des catégories par défaut pour ce `user_id`

---

## UX & Design

- **Layout mobile-first** : conçu pour iPhone (375–430px), utilisable desktop
- **Navigation** : bottom tab bar fixe (Dashboard, Transactions, Dettes, Investissements, Épargne)
- **Thème** : dark mode par défaut, toggle light/dark
- **Langue** : Français (FR-CH)
- **Montants** : `CHF 1'234.50` (apostrophe comme séparateur de milliers)
- **Dates** : `dd.MM.yyyy`
- **Onboarding** : après inscription, demander solde bancaire courant + salaire mensuel net
- **FAB** : bouton + flottant pour ajouter une transaction depuis n'importe quel écran

---

## Variables d'Environnement

```env
# Neon (PostgreSQL)
DATABASE_URL=postgresql://...

# Auth.js
AUTH_SECRET=...            # généré avec: npx auth secret
AUTH_URL=https://...       # URL de production Vercel
```

---

## PWA

- `public/manifest.json` : `display: "standalone"`, thème sombre, icônes 192x192 et 512x512
- `next-pwa` pour le service worker (cache assets statiques)
- Meta tags iOS dans `<head>` : `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`

---

## Déploiement (Vercel)

1. Connecter le repo GitHub à Vercel
2. Ajouter les variables d'environnement (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`)
3. Push sur `main` → déploiement automatique
4. Après premier déploiement : lancer `npx drizzle-kit push` pour créer les tables

---

## Ce qui N'est PAS dans le scope (v1)

- OAuth social (Google, GitHub) — uniquement email/password
- Connexion aux banques (Open Banking)
- Prix d'actifs en temps réel
- Support multi-devises
- Notifications push
- Version Android native

---

## Statut du Projet

- [ ] Setup Next.js 15 + Tailwind + shadcn/ui + PWA
- [ ] Config Neon + Drizzle schema + migrations
- [ ] Auth.js v5 : register / login / middleware
- [ ] Seed catégories par défaut à l'inscription
- [ ] Onboarding (solde initial + salaire)
- [ ] Layout principal (bottom nav, FAB, dark mode)
- [ ] Module Transactions (CRUD)
- [ ] Module Dettes & Poursuites (CRUD)
- [ ] Module Investissements (CRUD)
- [ ] Module Épargne Projets (CRUD)
- [ ] Dashboard
- [ ] Analyses & Projections
- [ ] Export JSON/CSV
- [ ] Déploiement Vercel

---

*Dernière mise à jour : 2026-06-11*
