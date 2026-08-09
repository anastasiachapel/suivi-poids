# Suivi Poids

Appli perso de suivi de perte de graisse : poids, calories, recettes, plan de repas de la semaine,
plan sport, étirements, liste de courses, reconnaissance de plats en photo (optionnel).

Cette version est autonome : elle tourne dans ton navigateur et stocke tes données **en local**
(`localStorage`), sans backend. Tes données restent sur ton appareil, dans ce navigateur précis.

## 1. Tester en local

Il faut [Node.js](https://nodejs.org) installé (version 18 ou plus).

```bash
npm install
npm run dev
```

Ouvre le lien affiché (en général `http://localhost:5173`).

## 2. Publier le code sur GitHub

```bash
git init
git add .
git commit -m "Premier commit"
git branch -M main
git remote add origin https://github.com/<ton-pseudo>/suivi-poids.git
git push -u origin main
```

(Crée d'abord un dépôt vide sur GitHub avec exactement ce nom, sans README/licence pour éviter les conflits.)

## 3. Publier l'appli en ligne (GitHub Pages)

Un workflow est déjà inclus (`.github/workflows/deploy.yml`) : à chaque `push` sur `main`,
GitHub construit et publie automatiquement l'appli.

Il faut juste l'activer une fois :

1. Sur GitHub, va dans **Settings → Pages**
2. Sous "Build and deployment", choisis **Source : GitHub Actions**
3. Repousse un commit (ou relance le workflow depuis l'onglet **Actions**)
4. Ton appli sera disponible à `https://<ton-pseudo>.github.io/suivi-poids/`

⚠️ Si tu nommes ton dépôt autrement que `suivi-poids`, mets à jour `base` dans `vite.config.js`
pour que ça corresponde exactement au nom du dépôt (sinon les fichiers CSS/JS ne se chargeront pas).

## 4. Reconnaissance photo (optionnel)

Les boutons "Depuis une photo" (Journal et Recettes) utilisent l'API Claude. Comme il n'y a pas
de serveur ici, ils ont besoin de **ta propre clé API Anthropic**, à ajouter dans
**Réglages → Reconnaissance photo** dans l'appli.

- Crée une clé sur [console.anthropic.com](https://console.anthropic.com/settings/keys)
- L'appli fait l'appel directement depuis ton navigateur (l'API Anthropic autorise ça via un
  header spécial). Ta clé est stockée uniquement sur ton appareil (`localStorage`), jamais envoyée
  ailleurs — **mais** elle est visible dans les requêtes réseau de ton navigateur. Utilise cette
  appli en usage personnel, pas déployée publiquement avec ta clé partagée, et mets une limite de
  budget sur ta clé côté Anthropic par précaution.
- Sans clé, tout le reste de l'appli fonctionne normalement — seuls ces deux boutons sont désactivés.

## 5. Duo entre deux téléphones (optionnel)

L'onglet "Duo" partage un résumé du jour (poids, calories, activité) entre toi et ta copine.
Sans configuration, ça ne marche que si vous êtes sur le même appareil/navigateur. Pour un vrai
partage entre deux téléphones, connecte un projet **Supabase** gratuit (base de données en ligne) :

1. Crée un compte sur [supabase.com](https://supabase.com) et un nouveau projet (gratuit).
2. Dans l'onglet **SQL Editor** du projet, exécute ce code pour créer la table nécessaire :

   ```sql
   create table shared_kv (
     key text primary key,
     value jsonb,
     updated_at timestamptz default now()
   );
   alter table shared_kv enable row level security;
   create policy "public read" on shared_kv for select using (true);
   create policy "public write" on shared_kv for insert with check (true);
   create policy "public update" on shared_kv for update using (true);
   ```

   ⚠️ Ces règles rendent la table lisible/modifiable par quiconque a l'URL et la clé (comme un
   Google Doc "toute personne avec le lien"). Suffisant pour un usage à deux, mais pas pour des
   données sensibles.
3. Dans **Settings → API** du projet Supabase, récupère l'**URL du projet** et la clé **anon public**.
4. Dans l'appli, **Réglages → Duo**, colle ces deux valeurs. Fais pareil sur le téléphone de ta
   copine, avec exactement les mêmes valeurs.
5. Chacun renseigne son prénom dans Réglages — l'onglet Duo affiche alors les deux profils,
   synchronisés en quasi temps réel (bouton actualiser si besoin).

Le reste de l'appli (journal, recettes, poids...) continue de fonctionner uniquement en local,
que Supabase soit configuré ou non — seul l'onglet Duo passe par le serveur partagé.

## 6. Limites à connaître

- **Un appareil = une base de données**, sauf pour l'onglet Duo si Supabase est configuré
  (voir ci-dessus). Le reste (poids, journal, recettes) ne synchronise pas entre appareils.
- Pense à ne pas vider les données de site de ton navigateur, tu perdrais ton historique
  (pas d'export/import intégré pour l'instant — dis-le-moi si tu veux que je l'ajoute).
- En cas de données incohérentes (ex. "Recette introuvable"), un bouton **Réglages → Réinitialiser
  les données** efface tout proprement sur cet appareil pour repartir à zéro.

## Structure du projet

```
src/
  App.jsx      → toute l'application (composants, logique, données)
  main.jsx     → point d'entrée React
index.html
vite.config.js
```
