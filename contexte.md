# Contexte projet — App de suivi musculation (MVP)

## Vue d'ensemble

App mobile PWA de suivi d'entraînement musculaire. L'utilisateur peut logger ses séances, suivre sa progression dans le temps, et gérer ses programmes. Ajoutée à l'écran d'accueil comme une app native.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS |
| Base de données | Neon (PostgreSQL serverless) |
| ORM | Drizzle ORM |
| Auth | NextAuth v5 (Auth.js) |
| Déploiement | Vercel |
| PWA | next-pwa ou manifest natif Next.js 15 |

---

## Features MVP

### 1. Log d'exercices
- Créer une séance avec date, nom, notes globales
- Ajouter des exercices à la séance (nom, groupe musculaire)
- Pour chaque exercice : N séries avec poids (kg) + reps
- Modifier / supprimer une séance ou un exercice

### 2. Timer de repos
- Chrono déclenchable entre chaque série
- Durée configurable par exercice (default : 90s)
- Alerte sonore via Web Audio API à la fin du temps
- 100% client-side, pas de backend

### 3. Templates de séances
- Sauvegarder une séance comme template réutilisable
- Nommer le template (ex: "Push A", "Pull B", "Jambes")
- Charger un template pour pré-remplir une nouvelle séance
- CRUD complet sur les templates

### 4. Notes & RPE
- Champ notes libre par séance (texte)
- RPE (Rate of Perceived Exertion) par séance : échelle 1–10
- RPE optionnel aussi par exercice

### 5. Courbes de progression
- Graphique charge max par exercice dans le temps
- Graphique volume total (séries × reps × poids) par séance
- 1RM estimé (formule Epley : poids × (1 + reps/30))
- Filtrable par exercice, par période (4 sem / 3 mois / 1 an / tout)

### 6. Heatmap & fréquence
- Calendrier heatmap style GitHub des séances (intensité = volume)
- Stats : séances cette semaine / ce mois, streak actuel, streak max
- Visualisation de la régularité d'entraînement

### 7. Groupes musculaires
- Tag obligatoire sur chaque exercice (ex: Pectoraux, Dos, Épaules, Biceps, Triceps, Jambes, Abdos, Fessiers)
- Vue répartition du volume par groupe musculaire (bar chart ou donut)
- Alerte visuelle si déséquilibre flagrant (optionnel, v2)

### 8. PRs (Personal Records)
- Détection automatique à chaque enregistrement de séance
- PR par exercice : charge max, volume max sur une séance, reps max
- Badge/notification in-app à la détection d'un nouveau PR
- Historique des PRs consultable

### 9. Social & partage
- Profil utilisateur public (pseudo, stats globales)
- Partager une séance via lien public (page statique générée)
- Feed d'amis (follow system simple)
- Pas de commentaires ni likes dans le MVP

### 10. Rappels & streaks
- Web Push Notifications (fonctionne si PWA ajoutée à l'écran d'accueil, iOS ≥ 16.4)
- Rappel configurable par jour/heure ("Entraîne-toi !")
- Streak affiché sur le dashboard
- Service Worker requis pour les push notifications

---

## Hors scope MVP

- HealthKit / Apple Watch (FC, calories, import séances Watch) — nécessite app iOS native, exclu volontairement
- App watchOS compagnon
- Comptage automatique de reps via accéléromètre
- Coach IA / suggestions de progression automatiques
- Export CSV / PDF

---

## Modèle de données (Drizzle / PostgreSQL)

```typescript
// users
users {
  id: uuid PK
  email: text UNIQUE
  name: text
  username: text UNIQUE
  avatar_url: text nullable
  created_at: timestamp
}

// exercises_library (bibliothèque globale d'exercices)
exercises_library {
  id: uuid PK
  name: text
  muscle_group: enum('chest','back','shoulders','biceps','triceps','legs','abs','glutes','other')
  is_custom: boolean  // true si créé par un user
  created_by: uuid FK -> users nullable
}

// workout_templates
workout_templates {
  id: uuid PK
  user_id: uuid FK -> users
  name: text
  created_at: timestamp
}

// workout_template_exercises
workout_template_exercises {
  id: uuid PK
  template_id: uuid FK -> workout_templates
  exercise_id: uuid FK -> exercises_library
  order: int
  default_sets: int nullable
  default_reps: int nullable
  default_weight: decimal nullable
  rest_seconds: int default 90
}

// workouts (séances)
workouts {
  id: uuid PK
  user_id: uuid FK -> users
  name: text
  date: date
  notes: text nullable
  rpe: int nullable (1-10)
  duration_minutes: int nullable
  is_public: boolean default false
  created_at: timestamp
}

// workout_exercises
workout_exercises {
  id: uuid PK
  workout_id: uuid FK -> workouts
  exercise_id: uuid FK -> exercises_library
  order: int
  notes: text nullable
  rpe: int nullable
  rest_seconds: int default 90
}

// sets
sets {
  id: uuid PK
  workout_exercise_id: uuid FK -> workout_exercises
  set_number: int
  reps: int
  weight: decimal (kg)
  completed: boolean default true
  created_at: timestamp
}

// personal_records
personal_records {
  id: uuid PK
  user_id: uuid FK -> users
  exercise_id: uuid FK -> exercises_library
  type: enum('max_weight','max_volume','max_reps')
  value: decimal
  achieved_at: date
  workout_id: uuid FK -> workouts
}

// follows (social)
follows {
  follower_id: uuid FK -> users
  following_id: uuid FK -> users
  created_at: timestamp
  PRIMARY KEY (follower_id, following_id)
}

// push_subscriptions
push_subscriptions {
  id: uuid PK
  user_id: uuid FK -> users
  endpoint: text
  p256dh: text
  auth: text
  created_at: timestamp
}
```

---

## Structure de fichiers Next.js (App Router)

```
/app
  /api
    /auth/[...nextauth]/route.ts
    /workouts/route.ts
    /workouts/[id]/route.ts
    /templates/route.ts
    /exercises/route.ts
    /stats/route.ts
    /push/subscribe/route.ts
  /(auth)
    /login/page.tsx
    /register/page.tsx
  /(app)
    /dashboard/page.tsx       ← heatmap, streak, stats rapides
    /workout/new/page.tsx     ← créer une séance
    /workout/[id]/page.tsx    ← détail séance
    /history/page.tsx         ← historique
    /progress/page.tsx        ← courbes de progression
    /templates/page.tsx       ← gérer les templates
    /profile/[username]/page.tsx
    /settings/page.tsx
/components
  /workout/
  /charts/
  /timer/
  /ui/
/lib
  /db/schema.ts               ← Drizzle schema
  /db/index.ts                ← connexion Neon
  /auth.ts                    ← NextAuth config
  /push.ts                    ← web push helpers
/public
  manifest.json               ← PWA manifest
  sw.js                       ← Service Worker
```

---

## Notes techniques importantes

- **Neon** : utiliser `@neondatabase/serverless` avec `drizzle-orm/neon-http` pour les edge functions Vercel
- **PWA** : ajouter `manifest.json` + meta tags + Service Worker. Sur iOS, les Web Push ne fonctionnent que si l'app est ajoutée à l'écran d'accueil (pas depuis Safari directement)
- **Timer** : utiliser `useRef` pour le chrono afin d'éviter les re-renders. Web Audio API pour le son (pas de fichier audio externe requis)
- **PR detection** : à déclencher côté serveur après chaque `POST /api/workouts` pour comparer avec les records existants
- **1RM** : formule Epley = `weight * (1 + reps / 30)`, afficher seulement si reps <= 10 pour la fiabilité
- **Heatmap** : calculer le volume journalier (sum séries × reps × poids) et normaliser pour l'intensité de couleur

---

## Auth

NextAuth v5 avec :
- Provider Email/Password (Credentials)
- Provider Google OAuth (optionnel, recommandé pour UX mobile)
- Sessions JWT (pas de sessions DB pour garder Neon simple)

---

## Déploiement

1. Créer projet sur [neon.tech](https://neon.tech) → récupérer `DATABASE_URL`
2. `npx drizzle-kit push` pour créer les tables
3. Push sur GitHub → Vercel auto-deploy
4. Configurer les variables d'environnement sur Vercel (voir `.env.local`)
