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

## 5. Limites à connaître

- **Un appareil = une base de données.** Si tu ouvres l'appli sur ton téléphone et sur ton
  ordinateur, ce sont deux jeux de données séparés (pas de synchronisation automatique).
- **L'onglet "Duo"** (progrès partagés) ne fonctionne que si deux personnes utilisent le même
  navigateur/appareil, faute de serveur partagé. Pour un vrai partage entre deux téléphones,
  il faudrait ajouter un petit backend (par ex. Supabase ou Firebase) — possible plus tard si
  tu veux, dis-le-moi.
- Pense à exporter/sauvegarder tes données de temps en temps si tu vides le cache de ton
  navigateur, tu perdrais l'historique (pas d'export intégré pour l'instant).

## Structure du projet

```
src/
  App.jsx      → toute l'application (composants, logique, données)
  main.jsx     → point d'entrée React
index.html
vite.config.js
```
