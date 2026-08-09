import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Home, Scale, Flame, Dumbbell, Wind, Settings as SettingsIcon,
  Plus, X, Trash2, TrendingDown, ChevronLeft, ChevronRight, Check, Loader2,
  Sunrise, UtensilsCrossed, Moon, Apple, Lock, Unlock, Shuffle, Pencil, ChevronDown, ChevronUp, BookOpen, CalendarDays,
  Users, RefreshCw, Info, Zap, Camera
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip
} from "recharts";

// ---------- Design tokens ----------
const C = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F2F3F8",
  border: "#E8E9F0",
  gold: "#FF7A1A",
  sage: "#00C48C",
  rust: "#FF3D81",
  ivory: "#15171C",
  muted: "#6B7280",
  danger: "#FF3B30",
};
const FONT_DISPLAY = "'Fredoka', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

// ---------- Date helpers ----------
const todayStr = () => new Date().toLocaleDateString("sv-SE");
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
};
const fmtDateShort = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
const fmtDateHeader = (dateStr) => {
  if (dateStr === todayStr()) return "Aujourd'hui";
  if (dateStr === addDays(todayStr(), -1)) return "Hier";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
const fmtDayShort = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }).replace(".", "");
};
const mondayOf = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString("sv-SE");
};
const uid = () => Math.random().toString(36).slice(2, 10);
const slugify = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");

const DEFAULT_SETTINGS = { name: "", weightGoal: null, calorieGoal: 2000, autoCalorie: false, sex: "", age: null, height: null, activityLevel: "legere", deficitLevel: "moderee", anthropicApiKey: "" };
const ACTIVITY_PRESETS = ["Marche", "Course", "Vélo", "Musculation", "Natation", "Autre"];
const STRETCH_PRESETS = [
  { label: "Dos" }, { label: "Ischio-jambiers" }, { label: "Hanches" },
  { label: "Épaules & cou" }, { label: "Routine complète" },
];

const MEAL_TYPES = [
  { id: "petit-dej", label: "Petit-déj", Icon: Sunrise, share: 0.25 },
  { id: "dejeuner", label: "Déjeuner", Icon: UtensilsCrossed, share: 0.35 },
  { id: "diner", label: "Dîner", Icon: Moon, share: 0.30 },
  { id: "collation", label: "Collation", Icon: Apple, share: 0.10 },
];
const mealMeta = (id) => MEAL_TYPES.find((m) => m.id === id) || MEAL_TYPES[0];

const SPORT_OPTIONS = [
  { id: "muscu", label: "Musculation", category: "muscu", duration: 45, kcalPerMin: 5.5 },
  { id: "course", label: "Course à pied", category: "cardio", duration: 30, kcalPerMin: 10 },
  { id: "velo", label: "Vélo", category: "cardio", duration: 40, kcalPerMin: 7 },
  { id: "natation", label: "Natation", category: "cardio", duration: 30, kcalPerMin: 9 },
  { id: "marche", label: "Marche rapide", category: "cardio", duration: 40, kcalPerMin: 5 },
  { id: "hiit", label: "HIIT", category: "cardio", duration: 20, kcalPerMin: 11 },
  { id: "tennis", label: "Tennis", category: "cardio", duration: 45, kcalPerMin: 8 },
  { id: "boxe", label: "Boxe", category: "cardio", duration: 30, kcalPerMin: 10 },
  { id: "danse", label: "Danse", category: "cardio", duration: 40, kcalPerMin: 7 },
  { id: "football", label: "Football", category: "cardio", duration: 45, kcalPerMin: 9 },
  { id: "basket", label: "Basket", category: "cardio", duration: 40, kcalPerMin: 8 },
  { id: "escalade", label: "Escalade", category: "cardio", duration: 45, kcalPerMin: 8 },
  { id: "randonnee", label: "Randonnée", category: "cardio", duration: 60, kcalPerMin: 6 },
  { id: "corde", label: "Corde à sauter", category: "cardio", duration: 15, kcalPerMin: 12 },
  { id: "mobilite", label: "Yoga / Mobilité", category: "mobilite", duration: 30, kcalPerMin: 3 },
];
const CATEGORY_COLOR = { muscu: C.rust, cardio: C.gold, mobilite: C.sage, repos: C.sage };
const CATEGORY_ICON = { muscu: Dumbbell, cardio: Zap, mobilite: Wind, repos: Wind };
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const SPORT_CATEGORY_META = {
  muscu: { label: "Renforcement musculaire", recommended: 3, hint: "Préserve ta masse musculaire pendant le déficit calorique." },
  cardio: { label: "Cardio", recommended: 2, hint: "Augmente ta dépense calorique pour soutenir le déficit." },
  mobilite: { label: "Étirement / mobilité", recommended: 2, hint: "Améliore récupération et souplesse, en complément." },
};
function sportsByCategory(cat) { return SPORT_OPTIONS.filter((s) => s.category === cat).map((s) => s.id); }
function selectedSportIds(preferences) {
  const ids = [];
  if (preferences.counts.muscu > 0) ids.push("muscu");
  if (preferences.counts.cardio > 0) ids.push(...preferences.cardioTypes);
  if (preferences.counts.mobilite > 0) ids.push("mobilite");
  return ids;
}
// Répartit les catégories le plus régulièrement possible sur la semaine (celle la plus "en retard" sur son quota passe en premier).
function buildSessionSequence(counts) {
  const cats = Object.keys(counts).filter((c) => counts[c] > 0);
  const used = {}; cats.forEach((c) => { used[c] = 0; });
  const total = cats.reduce((s, c) => s + counts[c], 0);
  const seq = [];
  for (let i = 0; i < total; i++) {
    let best = null, bestScore = Infinity;
    for (const c of cats) {
      if (used[c] >= counts[c]) continue;
      const score = used[c] / counts[c];
      if (score < bestScore) { bestScore = score; best = c; }
    }
    seq.push(best); used[best]++;
  }
  return seq;
}
function sportById(id) {
  if (!id || id === "repos") return { id: "repos", label: "Repos", category: "repos", duration: 0, kcalPerMin: 0 };
  return SPORT_OPTIONS.find((s) => s.id === id) || { id, label: id, category: "cardio", duration: 30, kcalPerMin: 7 };
}

// ---------- Seed workout session bank (concrete exercises/intervals, editable/deletable by the user) ----------
const SEED_WORKOUT_SESSIONS = [
  { name: "Full body force", sportId: "muscu", duration: 50, level: "intermédiaire", exercises: ["Squat 4x8", "Développé couché 4x8", "Rowing barre 4x10", "Développé militaire 3x10", "Gainage planche 3x40s"], notes: "Échauffement 8-10min (mobilité + séries légères). Repos 90s entre séries lourdes." },
  { name: "Full body hypertrophie", sportId: "muscu", duration: 50, level: "intermédiaire", exercises: ["Squat 4x10", "Développé couché 4x10", "Rowing haltère 4x10", "Presse à cuisses 3x12", "Superset curl biceps + extension triceps 3x12"], notes: "Repos 60-75s entre séries, viser la sensation musculaire plutôt que la charge max." },
  { name: "Haut du corps - Push", sportId: "muscu", duration: 45, level: "intermédiaire", exercises: ["Développé couché 4x8", "Développé militaire 3x10", "Dips ou pompes lestées 3x12", "Élévations latérales 3x15", "Extension triceps à la poulie 3x12"], notes: "Cible pectoraux, épaules et triceps. Échauffe bien les épaules avant de charger." },
  { name: "Haut du corps - Pull", sportId: "muscu", duration: 45, level: "intermédiaire", exercises: ["Tractions ou tirage vertical 4x8", "Rowing barre 4x10", "Rowing unilatéral haltère 3x12", "Curl biceps 3x12", "Face pull 3x15"], notes: "Cible dos et biceps, insiste sur la contraction du dos plutôt que les bras." },
  { name: "Bas du corps & fessiers", sportId: "muscu", duration: 50, level: "intermédiaire", exercises: ["Squat 4x8", "Soulevé de terre roumain 4x8", "Fentes marchées 3x12/jambe", "Hip thrust 3x12", "Mollets debout 3x15"], notes: "Charge progressive, garde le dos neutre sur le soulevé de terre roumain." },
  { name: "Full body débutant (poids du corps)", sportId: "muscu", duration: 35, level: "débutant", exercises: ["Squat au poids du corps 3x15", "Pompes (genoux si besoin) 3x10", "Rowing élastique ou serviette 3x12", "Fentes 3x10/jambe", "Gainage 3x30s"], notes: "Idéal pour débuter ou reprendre en douceur, sans matériel." },
  { name: "Fractionné 30/30", sportId: "course", duration: 30, level: "intermédiaire", exercises: ["Échauffement 10min footing léger", "10x (30s rapide / 30s récupération)", "Retour au calme 5min marche"], notes: "Le fractionné court est efficace pour la dépense calorique en peu de temps." },
  { name: "Endurance fondamentale", sportId: "course", duration: 40, level: "débutant", exercises: ["40min à allure conversationnelle (tu peux parler en courant)"], notes: "Développe l'endurance de base sans s'épuiser, idéal en récupération active." },
  { name: "Fractionné pyramidal", sportId: "course", duration: 35, level: "avancé", exercises: ["Échauffement 10min", "1-2-3-2-1min rapide, récupération égale au temps d'effort", "Retour au calme 5min"], notes: "Séance plus exigeante, à réserver si tu cours déjà régulièrement." },
  { name: "Sortie vélo endurance", sportId: "velo", duration: 50, level: "débutant", exercises: ["50min à intensité modérée, cadence 80-90rpm"], notes: "Bon rythme de croisière, discussion possible pendant l'effort." },
  { name: "Fractionné vélo", sportId: "velo", duration: 35, level: "intermédiaire", exercises: ["Échauffement 10min souple", "6x (2min effort soutenu / 2min récupération)", "Retour au calme 8min"], notes: "Augmente la dépense calorique sans y passer des heures." },
  { name: "Natation endurance", sportId: "natation", duration: 35, level: "intermédiaire", exercises: ["Échauffement 200m souple", "800m crawl à allure régulière", "Retour au calme 100m"], notes: "Adapte les distances à ton niveau, priorité à une technique propre." },
  { name: "Natation technique & fractionné", sportId: "natation", duration: 30, level: "intermédiaire", exercises: ["Échauffement 200m", "10x50m avec 20s de récupération", "Retour au calme 200m"], notes: "Travaille la régularité de tes temps sur chaque 50m." },
  { name: "Marche rapide continue", sportId: "marche", duration: 45, level: "débutant", exercises: ["45min marche rapide, bras engagés, allure soutenue"], notes: "Accessible à tous, excellent pour un déficit calorique doux et régulier." },
  { name: "Marche fractionnée / dénivelé", sportId: "marche", duration: 40, level: "intermédiaire", exercises: ["Alterne 5min allure rapide / 2min allure modérée pendant 40min"], notes: "Sur terrain vallonné si possible pour augmenter la dépense énergétique." },
  { name: "Tabata full body", sportId: "hiit", duration: 20, level: "avancé", exercises: ["Échauffement 5min", "8x (20s effort maximal / 10s récupération) - alterne burpees et mountain climbers", "Retour au calme 5min"], notes: "Très intense sur peu de temps, hydrate-toi bien avant et après." },
  { name: "Circuit HIIT accessible", sportId: "hiit", duration: 20, level: "intermédiaire", exercises: ["Échauffement 5min", "4 tours de : squat jump 40s, pompes 40s, fentes sautées 40s, gainage dynamique 40s (20s récup entre chaque)", "Retour au calme 5min"], notes: "Adapte l'intensité (par ex. squat sans saut) selon ton niveau." },
  { name: "Yoga doux / récupération", sportId: "mobilite", duration: 30, level: "débutant", exercises: ["Salutations au soleil x3", "Postures d'ouverture de hanches", "Étirements profonds tenus 45-60s", "Respiration guidée 5min"], notes: "Parfait un jour post-muscu ou en récupération active." },
  { name: "Mobilité articulaire complète", sportId: "mobilite", duration: 25, level: "débutant", exercises: ["Mobilité chevilles 3min", "Mobilité hanches 8min", "Mobilité épaules 8min", "Étirements dynamiques 6min"], notes: "Utile avant une séance de muscu ou en jour de repos actif." },
  { name: "Tennis - matchs / échanges", sportId: "tennis", duration: 60, level: "intermédiaire", exercises: ["Échauffement 10min (jeu de jambes + échanges faciles)", "45min de matchs ou échanges intensifs", "Retour au calme 5min étirements"], notes: "Bon mix cardio et coordination, adapte l'intensité au niveau de ton partenaire." },
  { name: "Boxe cardio", sportId: "boxe", duration: 30, level: "intermédiaire", exercises: ["Échauffement 5min (corde à sauter ou jumping jacks)", "8x3min rounds de shadow boxing ou sac de frappe, 1min récup entre chaque", "Retour au calme 5min étirements épaules"], notes: "Très intense pour le cardio et le haut du corps." },
  { name: "Danse cardio", sportId: "danse", duration: 40, level: "débutant", exercises: ["Échauffement 5min", "30min de chorégraphies cardio enchaînées", "Retour au calme 5min étirements"], notes: "Accessible et ludique, suis des vidéos en ligne si besoin d'inspiration." },
  { name: "Football / futsal", sportId: "football", duration: 60, level: "intermédiaire", exercises: ["Échauffement 10min", "40min de match ou possession", "Retour au calme 10min étirements jambes"], notes: "Excellent travail cardio et changements de direction." },
  { name: "Basket - matchs / shoot", sportId: "basket", duration: 45, level: "intermédiaire", exercises: ["Échauffement 10min (dribbles + tirs)", "30min de match ou 3x3", "Retour au calme 5min étirements"], notes: "Bon mix cardio, explosivité et coordination." },
  { name: "Escalade en salle", sportId: "escalade", duration: 60, level: "intermédiaire", exercises: ["Échauffement 10min (voies faciles)", "40min de voies ou blocs progressifs", "Retour au calme 10min étirements avant-bras et épaules"], notes: "Travaille le haut du corps et le gainage autant que le cardio." },
  { name: "Randonnée", sportId: "randonnee", duration: 90, level: "débutant", exercises: ["90min de marche en terrain naturel, avec dénivelé si possible"], notes: "Parfaite en récupération active ou le week-end, adapte la distance à ton niveau." },
  { name: "Corde à sauter HIIT", sportId: "corde", duration: 15, level: "avancé", exercises: ["Échauffement 3min", "10x (1min de saut / 30s récupération)", "Retour au calme 2min"], notes: "Très efficace en peu de temps, prévois de bonnes chaussures pour les chevilles." },
].map((s) => ({ ...s, id: uid(), custom: false }));
function pickSessionForSport(sessions, sportId, excludeId) {
  const candidates = sessions.filter((s) => s.sportId === sportId);
  if (candidates.length === 0) return null;
  const pool = candidates.filter((s) => s.id !== excludeId);
  const from = pool.length > 0 ? pool : candidates;
  return from[Math.floor(Math.random() * from.length)];
}

const GROCERY_CATEGORIES = [
  { id: "proteines", label: "Protéines", keywords: ["poulet", "dinde", "bœuf", "boeuf", "saumon", "cabillaud", "thon", "œuf", "oeuf", "skyr", "fromage blanc", "feta", "tofu"] },
  { id: "laitiers", label: "Produits laitiers", keywords: ["lait", "yaourt", "fromage", "beurre"] },
  { id: "fruits-legumes", label: "Fruits & légumes", keywords: ["épinard", "epinard", "brocoli", "courgette", "poivron", "tomate", "avocat", "citron", "banane", "pomme", "oignon", "carotte", "chou", "patate douce", "persil", "salade", "gingembre"] },
  { id: "feculents", label: "Féculents & légumineuses", keywords: ["riz", "quinoa", "pain", "tortilla", "flocons d'avoine", "avoine", "lentilles", "pois chiches", "haricots"] },
  { id: "epicerie", label: "Épicerie", keywords: ["huile", "sauce soja", "curry", "cannelle", "miel", "tahini", "granola", "beurre de cacahuète", "amandes", "piment"] },
];
function categorize(ingredient) {
  const low = ingredient.toLowerCase();
  const cat = GROCERY_CATEGORIES.find((c) => c.keywords.some((k) => low.includes(k)));
  return cat ? cat.id : "autre";
}

const ACTIVITY_LEVELS = [
  { id: "sedentaire", label: "Sédentaire", mult: 1.2, hint: "peu ou pas de sport" },
  { id: "legere", label: "Légère", mult: 1.375, hint: "sport 1-3x/semaine" },
  { id: "moderee", label: "Modérée", mult: 1.55, hint: "sport 3-5x/semaine" },
  { id: "active", label: "Active", mult: 1.725, hint: "sport 6-7x/semaine" },
  { id: "tresActive", label: "Très active", mult: 1.9, hint: "sport intense quotidien" },
];
const DEFICIT_LEVELS = [
  { id: "douce", label: "Douce", kcal: 300 },
  { id: "moderee", label: "Modérée", kcal: 500 },
  { id: "soutenue", label: "Soutenue", kcal: 750 },
];

// Estimation Mifflin-St Jeor + niveau d'activité - approximation standard, pas un avis médical.
function calcCalorieGoal(settings, currentWeight) {
  if (!settings.autoCalorie) return settings.calorieGoal;
  const { sex, age, height, activityLevel, deficitLevel } = settings;
  if (!currentWeight || !age || !height || !sex) return settings.calorieGoal;
  const bmr = sex === "homme"
    ? 10 * currentWeight + 6.25 * height - 5 * age + 5
    : 10 * currentWeight + 6.25 * height - 5 * age - 161;
  const mult = ACTIVITY_LEVELS.find((a) => a.id === activityLevel)?.mult || 1.375;
  const tdee = bmr * mult;
  const deficit = DEFICIT_LEVELS.find((d) => d.id === deficitLevel)?.kcal ?? 500;
  const floor = sex === "homme" ? 1500 : 1200;
  return Math.max(floor, Math.round(tdee - deficit));
}
// Objectif protéines : préserver la masse musculaire pendant le déficit, ce qui distingue la perte de graisse de la simple perte de poids.
function calcProteinGoal(settings, currentWeight) {
  if (!settings.autoCalorie || !currentWeight) return null;
  return Math.round(currentWeight * 1.8);
}

// ---------- Seed recipe bank (protein-forward, editable/deletable by the user) ----------
const SEED_RECIPES = [
  { name: "Skyr, fruits rouges et granola", mealType: "petit-dej", calories: 380, protein: 30, carbs: 42, fat: 10, prepTime: 5, highProtein: true, ingredients: ["Skyr nature", "Fruits rouges surgelés", "Granola sans sucre ajouté", "Miel (filet)"], instructions: "Verse le skyr dans un bol, ajoute les fruits rouges décongelés, termine avec le granola et un filet de miel." },
  { name: "Omelette épinards, feta et toast", mealType: "petit-dej", calories: 430, protein: 27, carbs: 24, fat: 26, prepTime: 10, highProtein: true, ingredients: ["3 œufs", "Poignée d'épinards", "Feta émiettée", "Pain complet", "Huile d'olive"], instructions: "Fais tomber les épinards dans une poêle, verse les œufs battus, ajoute la feta et cuis à feu doux jusqu'à prise. Sers avec une tranche de pain complet." },
  { name: "Porridge protéiné banane-cannelle", mealType: "petit-dej", calories: 460, protein: 28, carbs: 58, fat: 12, prepTime: 8, highProtein: true, ingredients: ["Flocons d'avoine", "Lait ou boisson végétale", "Whey ou protéine en poudre", "Banane", "Beurre de cacahuète", "Cannelle"], instructions: "Fais chauffer les flocons dans le lait, incorpore la protéine en poudre hors du feu, ajoute la banane en rondelles, une cuillère de beurre de cacahuète et la cannelle." },
  { name: "Toast avocat, œuf poché et saumon fumé", mealType: "petit-dej", calories: 470, protein: 26, carbs: 32, fat: 26, prepTime: 10, highProtein: true, ingredients: ["Pain complet", "Avocat", "Œuf", "Saumon fumé", "Citron"], instructions: "Écrase l'avocat sur le pain grillé avec un filet de citron, ajoute le saumon fumé et dépose l'œuf poché par-dessus." },
  { name: "Pancakes protéinés flocons d'avoine", mealType: "petit-dej", calories: 500, protein: 32, carbs: 55, fat: 14, prepTime: 15, highProtein: true, ingredients: ["Flocons d'avoine mixés", "Œufs", "Whey vanille", "Banane", "Yaourt grec"], instructions: "Mixe flocons, œufs, whey et banane, cuis en petites crêpes à la poêle, sers avec le yaourt grec." },
  { name: "Bowl poulet, quinoa et légumes rôtis", mealType: "dejeuner", calories: 650, protein: 48, carbs: 58, fat: 20, prepTime: 25, highProtein: true, ingredients: ["Blanc de poulet", "Quinoa", "Courgette", "Poivron", "Avocat", "Huile d'olive"], instructions: "Fais rôtir les légumes au four, cuis le poulet à la poêle, sers sur un lit de quinoa cuit avec l'avocat en tranches." },
  { name: "Salade thon, haricots blancs et pain complet", mealType: "dejeuner", calories: 560, protein: 40, carbs: 50, fat: 18, prepTime: 12, highProtein: true, ingredients: ["Thon au naturel", "Haricots blancs", "Tomates cerises", "Pain complet", "Citron", "Huile d'olive"], instructions: "Mélange tous les ingrédients dans un saladier, assaisonne avec citron, huile d'olive, sel et poivre, sers avec le pain." },
  { name: "Wrap dinde, houmous, riz et crudités", mealType: "dejeuner", calories: 600, protein: 36, carbs: 62, fat: 18, prepTime: 12, highProtein: true, ingredients: ["Tortilla complète", "Blanc de dinde", "Houmous", "Riz complet", "Carotte râpée", "Salade"], instructions: "Tartine la tortilla d'houmous, garnis de dinde, riz et crudités, roule serré." },
  { name: "Buddha bowl végétarien, pois chiches rôtis", mealType: "dejeuner", calories: 620, protein: 24, carbs: 78, fat: 20, prepTime: 20, highProtein: false, ingredients: ["Pois chiches", "Riz complet", "Chou rouge", "Avocat", "Tahini"], instructions: "Rôtis les pois chiches épicés au four, dresse avec le riz, le chou émincé et l'avocat, nappe de sauce tahini." },
  { name: "Pâtes complètes, poulet et brocolis", mealType: "dejeuner", calories: 700, protein: 46, carbs: 80, fat: 18, prepTime: 20, highProtein: true, ingredients: ["Pâtes complètes", "Blanc de poulet", "Brocolis", "Parmesan", "Huile d'olive"], instructions: "Cuis les pâtes et les brocolis, poêle le poulet en dés, mélange le tout avec un filet d'huile d'olive et du parmesan râpé." },
  { name: "Saumon grillé, brocolis, riz complet", mealType: "diner", calories: 630, protein: 42, carbs: 52, fat: 24, prepTime: 20, highProtein: true, ingredients: ["Pavé de saumon", "Brocolis", "Riz complet", "Sauce soja", "Gingembre"], instructions: "Cuis le saumon à la poêle, fais cuire les brocolis vapeur, sers avec le riz et un filet de sauce soja-gingembre." },
  { name: "Sauté de bœuf maigre, riz et légumes", mealType: "diner", calories: 600, protein: 44, carbs: 48, fat: 20, prepTime: 20, highProtein: true, ingredients: ["Bœuf maigre en lamelles", "Riz complet", "Poivrons", "Oignon", "Brocoli", "Sauce soja"], instructions: "Fais revenir le bœuf à feu vif, ajoute les légumes émincés, sauce soja en fin de cuisson, sers avec le riz." },
  { name: "Curry de lentilles corail, riz et épinards", mealType: "diner", calories: 560, protein: 24, carbs: 78, fat: 15, prepTime: 25, highProtein: false, ingredients: ["Lentilles corail", "Riz basmati", "Lait de coco léger", "Épinards", "Curry", "Oignon"], instructions: "Fais revenir l'oignon, ajoute les lentilles, le lait de coco et le curry, laisse mijoter, incorpore les épinards, sers avec le riz." },
  { name: "Cabillaud, purée de patate douce et haricots verts", mealType: "diner", calories: 540, protein: 38, carbs: 48, fat: 16, prepTime: 25, highProtein: true, ingredients: ["Filet de cabillaud", "Patate douce", "Haricots verts", "Citron", "Persil", "Huile d'olive"], instructions: "Fais cuire le cabillaud au four, écrase la patate douce cuite en purée, sers avec les haricots verts et un filet de citron." },
  { name: "Chili con carne maison, riz complet", mealType: "diner", calories: 680, protein: 45, carbs: 62, fat: 22, prepTime: 30, highProtein: true, ingredients: ["Bœuf haché 5%", "Haricots rouges", "Tomates concassées", "Riz complet", "Oignon", "Épices"], instructions: "Fais revenir le bœuf et l'oignon, ajoute tomates, haricots rouges et épices, laisse mijoter 20 min, sers avec le riz." },
  { name: "Fromage blanc 0%, amandes et fruits", mealType: "collation", calories: 220, protein: 18, carbs: 16, fat: 9, prepTime: 2, highProtein: true, ingredients: ["Fromage blanc 0%", "Amandes", "Fruits rouges", "Cannelle"], instructions: "Mélange le fromage blanc avec une poignée d'amandes, des fruits rouges et une pincée de cannelle." },
  { name: "Pomme et beurre de cacahuète", mealType: "collation", calories: 240, protein: 7, carbs: 26, fat: 13, prepTime: 2, highProtein: false, ingredients: ["Pomme", "Beurre de cacahuète"], instructions: "Coupe la pomme en tranches et sers avec une cuillère de beurre de cacahuète." },
  { name: "Shaker whey et banane", mealType: "collation", calories: 260, protein: 30, carbs: 28, fat: 3, prepTime: 3, highProtein: true, ingredients: ["Whey protéine", "Lait ou eau", "Banane"], instructions: "Mixe la whey avec le lait et la banane, sers frais." },
  { name: "Houmous, bâtonnets de légumes et pain pita", mealType: "collation", calories: 280, protein: 10, carbs: 34, fat: 12, prepTime: 5, highProtein: false, ingredients: ["Houmous", "Carotte", "Concombre", "Pain pita complet"], instructions: "Coupe les légumes en bâtonnets, sers avec le houmous et le pain pita." },
].map((r) => ({ ...r, id: uid(), custom: false }));

// ---------- Storage helpers ----------
// Version standalone : remplace l'API window.storage de Claude par localStorage.
// Mêmes signatures que l'original, donc aucun appelant n'a besoin de changer.
const LS_PREFIX = "poids-app:";
const LS_SHARED_PREFIX = "poids-app:shared:";

async function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Erreur de sauvegarde", key, e);
  }
}
// "Partagé" ici reste stocké localement sur cet appareil (pas de serveur).
// Utile seulement si plusieurs personnes utilisent le même navigateur/appareil.
async function saveShared(key, value) {
  try {
    localStorage.setItem(LS_SHARED_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Erreur de sauvegarde partagée", key, e);
  }
}
async function listShared(prefix) {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_SHARED_PREFIX + prefix)) keys.push(k.slice(LS_SHARED_PREFIX.length));
    }
    return keys;
  } catch (e) {
    return [];
  }
}
async function getShared(key) {
  try {
    const raw = localStorage.getItem(LS_SHARED_PREFIX + key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// ---------- Import a recipe from a photo (uses Claude to read the image) ----------
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));
    reader.readAsDataURL(file);
  });
}

async function extractRecipeFromImage(base64, mediaType, apiKey) {
  if (!apiKey) throw new Error("Ajoute ta clé API Anthropic dans les réglages pour utiliser la reconnaissance photo.");
  const prompt = `Regarde cette photo (recette, plat cuisiné, ou capture d'écran de recette) et extrais les informations sous forme d'un objet JSON STRICT uniquement, sans texte avant ni après, sans balises markdown. Utilise exactement ces clés :
{"name": string (nom du plat en français), "mealType": une valeur parmi "petit-dej","dejeuner","diner","collation" selon le repas le plus probable, "calories": nombre entier (estimation par portion individuelle), "protein": nombre entier en grammes, "carbs": nombre entier en grammes, "fat": nombre entier en grammes, "prepTime": nombre entier en minutes (estimation), "highProtein": booléen (true si environ 25g de protéines ou plus par portion), "ingredients": tableau de strings (ingrédients visibles ou mentionnés, avec quantités si connues), "instructions": string (préparation résumée en 2-3 phrases maximum, dans tes propres mots)}
Si l'image ne montre pas clairement un plat ou une recette identifiable, réponds uniquement avec {"error":"non_identifiable"}. Base les valeurs nutritionnelles sur une portion individuelle standard, ce sont des estimations.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Clé API invalide. Vérifie-la dans les réglages.");
    throw new Error("L'analyse de la photo a échoué. Réessaie.");
  }
  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("Réponse inattendue, réessaie.");
  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); } catch (e) { throw new Error("Impossible d'analyser cette photo, réessaie avec une image plus nette."); }
  if (parsed.error) throw new Error("Impossible d'identifier un plat sur cette photo. Réessaie avec une photo plus nette ou remplis le formulaire à la main.");

  return {
    name: parsed.name || "",
    mealType: MEAL_TYPES.some((m) => m.id === parsed.mealType) ? parsed.mealType : "dejeuner",
    calories: parsed.calories ? String(Math.round(parsed.calories)) : "",
    protein: parsed.protein ? String(Math.round(parsed.protein)) : "",
    carbs: parsed.carbs ? String(Math.round(parsed.carbs)) : "",
    fat: parsed.fat ? String(Math.round(parsed.fat)) : "",
    prepTime: parsed.prepTime ? String(Math.round(parsed.prepTime)) : "",
    highProtein: !!parsed.highProtein,
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.join("\n") : "",
    instructions: parsed.instructions || "",
  };
}

async function extractFoodFromImage(base64, mediaType, apiKey) {
  if (!apiKey) throw new Error("Ajoute ta clé API Anthropic dans les réglages pour utiliser la reconnaissance photo.");
  const prompt = `Regarde cette photo d'un plat ou d'un aliment et estime ses valeurs nutritionnelles pour la portion visible. Réponds uniquement avec un objet JSON STRICT, sans texte avant ni après, sans balises markdown, avec exactement ces clés :
{"name": string (nom court du plat en français), "calories": nombre entier (estimation kcal pour la portion visible sur la photo), "protein": nombre entier en grammes, "carbs": nombre entier en grammes, "fat": nombre entier en grammes}
Si l'image ne montre pas clairement un plat ou aliment identifiable, réponds uniquement avec {"error":"non_identifiable"}. Ce sont des estimations visuelles approximatives basées sur la taille apparente de la portion.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Clé API invalide. Vérifie-la dans les réglages.");
    throw new Error("L'analyse de la photo a échoué. Réessaie.");
  }
  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("Réponse inattendue, réessaie.");
  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); } catch (e) { throw new Error("Impossible d'analyser cette photo, réessaie avec une image plus nette."); }
  if (parsed.error) throw new Error("Impossible d'identifier un plat sur cette photo. Réessaie avec une photo plus nette, plus proche, ou remplis les champs à la main.");

  return {
    name: parsed.name || "",
    calories: parsed.calories ? String(Math.round(parsed.calories)) : "",
    protein: parsed.protein ? String(Math.round(parsed.protein)) : "",
    carbs: parsed.carbs ? String(Math.round(parsed.carbs)) : "",
    fat: parsed.fat ? String(Math.round(parsed.fat)) : "",
  };
}

// ---------- Small UI atoms ----------
function Card({ children, style, ...props }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, boxShadow: "0 1px 2px rgba(20,20,30,0.04), 0 6px 16px rgba(20,20,30,0.05)", ...style }} {...props}>
      {children}
    </div>
  );
}
function IconPill({ Icon, color }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: color + "22" }}>
      <Icon size={17} color={color} strokeWidth={2.2} />
    </div>
  );
}
function PrimaryButton({ children, onClick, color = C.gold, style, disabled }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        background: disabled ? C.surfaceAlt : color, color: disabled ? C.muted : "#14161A",
        fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, border: "none", borderRadius: 12,
        padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        cursor: disabled ? "default" : "pointer", width: "100%", ...style,
      }}
    >
      {children}
    </button>
  );
}
function TextField({ label, textarea, ...props }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <label style={{ display: "block" }}>
      {label && <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT_BODY, display: "block", marginBottom: 5 }}>{label}</span>}
      <Tag
        {...props}
        style={{
          width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 12px", color: C.ivory, fontFamily: FONT_BODY, fontSize: 14, outline: "none",
          boxSizing: "border-box", resize: textarea ? "vertical" : undefined, minHeight: textarea ? 70 : undefined,
        }}
      />
    </label>
  );
}
function DateNav({ date, onChange }) {
  const isToday = date === todayStr();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <button onClick={() => onChange(addDays(date, -1))} aria-label="Jour précédent" style={{ background: "none", border: "none", color: C.muted, padding: 6, cursor: "pointer" }}>
        <ChevronLeft size={20} />
      </button>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ivory, textTransform: "capitalize" }}>{fmtDateHeader(date)}</span>
      <button onClick={() => !isToday && onChange(addDays(date, 1))} aria-label="Jour suivant" disabled={isToday} style={{ background: "none", border: "none", color: isToday ? "transparent" : C.muted, padding: 6, cursor: isToday ? "default" : "pointer" }}>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "22px 10px", color: C.muted, fontSize: 13, fontFamily: FONT_BODY }}>{text}</div>;
}
function ListRow({ title, subtitle, right, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 2px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: C.ivory, fontSize: 14, fontFamily: FONT_BODY, fontWeight: 500 }}>{title}</div>
        {subtitle && <div style={{ color: C.muted, fontSize: 12, fontFamily: FONT_BODY, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ color: C.ivory, fontFamily: FONT_MONO, fontSize: 13 }}>{right}</span>
        {onDelete && (
          <button onClick={onDelete} aria-label="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Trash2 size={14} color={C.muted} />
          </button>
        )}
      </div>
    </div>
  );
}
function SegControl({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 3, gap: 3, marginBottom: 14 }}>
      {options.map((o) => (
        <button
          key={o.id} onClick={() => onChange(o.id)}
          style={{
            flex: 1, border: "none", borderRadius: 9, padding: "8px 6px", fontSize: 12.5, fontFamily: FONT_BODY, cursor: "pointer",
            background: value === o.id ? C.gold : "transparent", color: value === o.id ? "#14161A" : C.muted, fontWeight: value === o.id ? 600 : 500,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Chip({ active, onClick, children, color = C.gold }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 12px", borderRadius: 999, fontSize: 12.5, cursor: "pointer",
        border: `1px solid ${active ? color : C.border}`, background: active ? color + "22" : "transparent",
        color: active ? color : C.muted, whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ================= Main App =================
export default function App() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [weightEntries, setWeightEntries] = useState([]);
  const [foodLog, setFoodLog] = useState({});
  const [quickFoods, setQuickFoods] = useState([]);
  const [activityLog, setActivityLog] = useState({});
  const [stretchLog, setStretchLog] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [mealPlans, setMealPlans] = useState({});
  const [workoutPlans, setWorkoutPlans] = useState({});
  const [workoutSessions, setWorkoutSessions] = useState([]);

  const [calDate, setCalDate] = useState(todayStr());
  const [actDate, setActDate] = useState(todayStr());
  const [strDate, setStrDate] = useState(todayStr());

  useEffect(() => {
    (async () => {
      const [s, w, f, qf, a, st, r, mp, wp, ws] = await Promise.all([
        loadKey("settings", DEFAULT_SETTINGS),
        loadKey("weight-entries", []),
        loadKey("food-log", {}),
        loadKey("quick-foods", []),
        loadKey("activity-log", {}),
        loadKey("stretch-log", {}),
        loadKey("recipes", null),
        loadKey("meal-plans", {}),
        loadKey("workout-plans", {}),
        loadKey("workout-sessions", null),
      ]);
      setSettings(s); setWeightEntries(w); setFoodLog(f); setQuickFoods(qf);
      setActivityLog(a); setStretchLog(st);
      if (r === null) { setRecipes(SEED_RECIPES); saveKey("recipes", SEED_RECIPES); } else { setRecipes(r); }
      setMealPlans(mp);
      setWorkoutPlans(wp);
      if (ws === null) { setWorkoutSessions(SEED_WORKOUT_SESSIONS); saveKey("workout-sessions", SEED_WORKOUT_SESSIONS); } else { setWorkoutSessions(ws); }
      setLoading(false);
    })();
  }, []);

  const updateSettings = useCallback((next) => { setSettings(next); saveKey("settings", next); }, []);
  const updateWeightEntries = useCallback((next) => { setWeightEntries(next); saveKey("weight-entries", next); }, []);
  const updateFoodLog = useCallback((next) => { setFoodLog(next); saveKey("food-log", next); }, []);
  const updateQuickFoods = useCallback((next) => { setQuickFoods(next); saveKey("quick-foods", next); }, []);
  const updateActivityLog = useCallback((next) => { setActivityLog(next); saveKey("activity-log", next); }, []);
  const updateStretchLog = useCallback((next) => { setStretchLog(next); saveKey("stretch-log", next); }, []);
  const updateRecipes = useCallback((next) => { setRecipes(next); saveKey("recipes", next); }, []);
  const updateMealPlans = useCallback((next) => { setMealPlans(next); saveKey("meal-plans", next); }, []);
  const updateWorkoutPlans = useCallback((next) => { setWorkoutPlans(next); saveKey("workout-plans", next); }, []);
  const updateWorkoutSessions = useCallback((next) => { setWorkoutSessions(next); saveKey("workout-sessions", next); }, []);

  const logRecipeToDay = useCallback((date, recipe) => {
    const day = foodLog[date] || [];
    const entry = { id: uid(), name: recipe.name, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat, fromRecipe: true };
    updateFoodLog({ ...foodLog, [date]: [...day, entry] });
  }, [foodLog, updateFoodLog]);

  const logWorkoutToDay = useCallback((date, day) => {
    const activityDay = activityLog[date] || [];
    const def = sportById(day.sportId);
    const session = workoutSessions.find((s) => s.id === day.sessionId);
    const duration = session?.duration ?? def.duration;
    const label = session ? `${def.label} · ${session.name}` : def.label;
    const entries = [{ id: uid(), type: label, duration, calories: Math.round(duration * def.kcalPerMin) }];
    if (day.comboSessionId) {
      const comboDef = sportById("mobilite");
      const comboSession = workoutSessions.find((s) => s.id === day.comboSessionId);
      const comboDuration = comboSession?.duration ?? comboDef.duration;
      const comboLabel = comboSession ? `${comboDef.label} · ${comboSession.name}` : comboDef.label;
      entries.push({ id: uid(), type: comboLabel, duration: comboDuration, calories: Math.round(comboDuration * comboDef.kcalPerMin) });
    }
    updateActivityLog({ ...activityLog, [date]: [...activityDay, ...entries] });
  }, [activityLog, updateActivityLog, workoutSessions]);

  const sortedWeights = useMemo(() => [...weightEntries].sort((a, b) => a.date.localeCompare(b.date)), [weightEntries]);
  const currentWeight = sortedWeights.length ? sortedWeights[sortedWeights.length - 1].weight : null;
  const startWeight = sortedWeights.length ? sortedWeights[0].weight : null;
  const effectiveCalorieGoal = calcCalorieGoal(settings, currentWeight);
  const effectiveProteinGoal = calcProteinGoal(settings, currentWeight);

  const todaysFood = foodLog[todayStr()] || [];
  const caloriesToday = todaysFood.reduce((sum, f) => sum + Number(f.calories || 0), 0);
  const todaysActivity = activityLog[todayStr()] || [];
  const caloriesBurnedToday = todaysActivity.reduce((sum, a) => sum + Number(a.calories || 0), 0);
  const todaysStretch = stretchLog[todayStr()] || [];
  const stretchMinutesToday = todaysStretch.reduce((sum, s) => sum + Number(s.duration || 0), 0);

  const mySlug = slugify(settings.name);
  useEffect(() => {
    if (loading || !mySlug) return;
    const summary = {
      name: settings.name,
      currentWeight, weightGoal: settings.weightGoal,
      weightTrend: sortedWeights.slice(-7).map((w) => ({ date: w.date, weight: w.weight })),
      caloriesToday, calorieGoal: effectiveCalorieGoal,
      caloriesBurnedToday, stretchMinutesToday,
      updatedAt: new Date().toISOString(),
    };
    saveShared(`partner-summary:${mySlug}`, summary);
  }, [loading, mySlug, settings.name, settings.weightGoal, effectiveCalorieGoal, currentWeight, caloriesToday, caloriesBurnedToday, stretchMinutesToday, sortedWeights]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={26} color={C.gold} className="spin" />
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const TABS = [
    { id: "home", label: "Accueil", Icon: Home },
    { id: "weight", label: "Poids", Icon: Scale },
    { id: "calories", label: "Calories", Icon: Flame },
    { id: "activity", label: "Activité", Icon: Dumbbell },
    { id: "stretch", label: "Étirements", Icon: Wind },
    { id: "duo", label: "Duo", Icon: Users },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus { border-color: ${C.gold} !important; }
        ::-webkit-scrollbar { display: none; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", position: "relative", paddingBottom: 92 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 18px 6px" }}>
          <div>
            <div style={{ color: C.muted, fontSize: 12, letterSpacing: 0.5 }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.ivory, fontWeight: 600 }}>
              {settings.name ? `Bonjour, ${settings.name}` : "Bonjour"}
            </div>
          </div>
          <button onClick={() => setSettingsOpen(true)} aria-label="Réglages"
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 2px rgba(20,20,30,0.04), 0 4px 10px rgba(20,20,30,0.05)" }}>
            <SettingsIcon size={17} color={C.muted} />
          </button>
        </div>

        <div style={{ padding: "10px 18px 0" }}>
          {tab === "home" && (
            <HomeScreen settings={{ ...settings, calorieGoal: effectiveCalorieGoal }} currentWeight={currentWeight} startWeight={startWeight} sortedWeights={sortedWeights}
              caloriesToday={caloriesToday} caloriesBurnedToday={caloriesBurnedToday} stretchMinutesToday={stretchMinutesToday}
              todaysActivityCount={todaysActivity.length} goTo={setTab} />
          )}
          {tab === "weight" && (
            <WeightScreen settings={settings} sortedWeights={sortedWeights}
              onAdd={(entry) => { const others = weightEntries.filter((w) => w.date !== entry.date); updateWeightEntries([...others, entry]); }}
              onDelete={(id) => updateWeightEntries(weightEntries.filter((w) => w.id !== id))} />
          )}
          {tab === "calories" && (
            <CaloriesScreen
              date={calDate} setDate={setCalDate} foods={foodLog[calDate] || []} calorieGoal={effectiveCalorieGoal} proteinGoal={effectiveProteinGoal}
              quickFoods={quickFoods} recipes={recipes} mealPlans={mealPlans}
              onAdd={(food, saveAsQuick) => {
                const day = foodLog[calDate] || [];
                updateFoodLog({ ...foodLog, [calDate]: [...day, food] });
                if (saveAsQuick) updateQuickFoods([...quickFoods, { ...food, id: uid() }]);
              }}
              onDelete={(id) => { const day = (foodLog[calDate] || []).filter((f) => f.id !== id); updateFoodLog({ ...foodLog, [calDate]: day }); }}
              onDeleteQuick={(id) => updateQuickFoods(quickFoods.filter((q) => q.id !== id))}
              onAddRecipe={(recipe) => updateRecipes([...recipes, { ...recipe, id: uid(), custom: true }])}
              onUpdateRecipe={(id, patch) => updateRecipes(recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
              onDeleteRecipe={(id) => updateRecipes(recipes.filter((r) => r.id !== id))}
              updateMealPlans={updateMealPlans}
              logRecipeToDay={logRecipeToDay}
              apiKey={settings.anthropicApiKey}
            />
          )}
          {tab === "activity" && (
            <ActivityScreen date={actDate} setDate={setActDate} items={activityLog[actDate] || []}
              onAdd={(item) => { const day = activityLog[actDate] || []; updateActivityLog({ ...activityLog, [actDate]: [...day, item] }); }}
              onDelete={(id) => { const day = (activityLog[actDate] || []).filter((a) => a.id !== id); updateActivityLog({ ...activityLog, [actDate]: day }); }}
              workoutPlans={workoutPlans} updateWorkoutPlans={updateWorkoutPlans} logWorkoutToDay={logWorkoutToDay}
              workoutSessions={workoutSessions} updateWorkoutSessions={updateWorkoutSessions} />
          )}
          {tab === "stretch" && (
            <StretchScreen date={strDate} setDate={setStrDate} items={stretchLog[strDate] || []}
              onAdd={(item) => { const day = stretchLog[strDate] || []; updateStretchLog({ ...stretchLog, [strDate]: [...day, item] }); }}
              onDelete={(id) => { const day = (stretchLog[strDate] || []).filter((s) => s.id !== id); updateStretchLog({ ...stretchLog, [strDate]: day }); }} />
          )}
          {tab === "duo" && <DuoScreen mySlug={mySlug} myName={settings.name} onOpenSettings={() => setSettingsOpen(true)} />}
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 430, width: "100%", margin: "0 auto", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "9px 6px 14px" }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0" }}>
                  <Icon size={19} color={active ? C.gold : C.muted} strokeWidth={active ? 2.4 : 2} />
                  <span style={{ fontSize: 10.5, color: active ? C.gold : C.muted, fontFamily: FONT_BODY, fontWeight: active ? 600 : 400 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {settingsOpen && (
        <SettingsModal settings={settings} currentWeight={currentWeight} onClose={() => setSettingsOpen(false)} onSave={(s) => { updateSettings(s); setSettingsOpen(false); }} />
      )}
    </div>
  );
}

// ---------- Home ----------
function HomeScreen({ settings, currentWeight, startWeight, sortedWeights, caloriesToday, caloriesBurnedToday, stretchMinutesToday, todaysActivityCount, goTo }) {
  const chartData = sortedWeights.slice(-7).map((w) => ({ date: w.date, weight: w.weight }));
  const remaining = settings.calorieGoal ? settings.calorieGoal - caloriesToday : null;
  const progressPct = settings.weightGoal && startWeight && currentWeight
    ? Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - settings.weightGoal)) * 100)) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card onClick={() => goTo("weight")} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: C.muted, fontSize: 12 }}>Poids actuel</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: C.ivory, lineHeight: 1.1 }}>
              {currentWeight != null ? `${currentWeight}` : "—"}<span style={{ fontSize: 15, color: C.muted, marginLeft: 4 }}>kg</span>
            </div>
          </div>
          {settings.weightGoal && (
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.muted, fontSize: 12 }}>Objectif</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.sage }}>{settings.weightGoal} kg</div>
            </div>
          )}
        </div>
        {chartData.length >= 2 ? (
          <div style={{ height: 90, marginTop: 6, marginLeft: -8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
                <Tooltip contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtDateShort} formatter={(v) => [`${v} kg`, "Poids"]} />
                <Area type="monotone" dataKey="weight" stroke={C.gold} strokeWidth={2.5} fill="url(#homeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState text="Ajoute ta première pesée pour démarrer ta courbe." />}
        {progressPct != null && (
          <div style={{ marginTop: 4 }}>
            <div style={{ height: 5, background: C.surfaceAlt, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: C.sage, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{Math.round(progressPct)}% du chemin vers ton objectif</div>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card onClick={() => goTo("calories")} style={{ cursor: "pointer" }}>
          <IconPill Icon={Flame} color={C.gold} />
          <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 20, color: C.ivory }}>{caloriesToday}</div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>kcal {remaining != null ? `· ${remaining >= 0 ? `${remaining} restantes` : `${-remaining} de plus`}` : "aujourd'hui"}</div>
        </Card>
        <Card onClick={() => goTo("activity")} style={{ cursor: "pointer" }}>
          <IconPill Icon={Dumbbell} color={C.rust} />
          <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 20, color: C.ivory }}>{todaysActivityCount}</div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>séance{todaysActivityCount !== 1 ? "s" : ""} · {caloriesBurnedToday} kcal</div>
        </Card>
        <Card onClick={() => goTo("stretch")} style={{ cursor: "pointer", gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IconPill Icon={Wind} color={C.sage} />
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.ivory }}>{stretchMinutesToday} min</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>d'étirements aujourd'hui</div>
              </div>
            </div>
            <TrendingDown size={16} color={C.sage} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Weight ----------
function WeightScreen({ settings, sortedWeights, onAdd, onDelete }) {
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const chartData = sortedWeights.map((w) => ({ date: w.date, weight: w.weight }));
  const submit = () => { const val = parseFloat(weight); if (!val || val <= 0) return; onAdd({ id: uid(), date, weight: val }); setWeight(""); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Évolution</div>
        {chartData.length >= 2 ? (
          <div style={{ height: 150, marginLeft: -10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="fullGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
                <Tooltip contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelFormatter={fmtDateShort} formatter={(v) => [`${v} kg`, "Poids"]} />
                <Area type="monotone" dataKey="weight" stroke={C.gold} strokeWidth={2.5} fill="url(#fullGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState text="Deux pesées ou plus feront apparaître ta courbe." />}
      </Card>
      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Nouvelle pesée</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><TextField type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} /></div>
          <div style={{ flex: 1 }}><TextField type="number" inputMode="decimal" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 10 }}><PrimaryButton onClick={submit} disabled={!weight}><Plus size={15} /> Ajouter</PrimaryButton></div>
      </Card>
      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Historique</div>
        {[...sortedWeights].reverse().length === 0 && <EmptyState text="Aucune pesée enregistrée." />}
        {[...sortedWeights].reverse().map((w, i, arr) => {
          const prev = arr[i + 1];
          const delta = prev ? +(w.weight - prev.weight).toFixed(1) : null;
          return <ListRow key={w.id} title={fmtDateShort(w.date)} subtitle={delta != null ? `${delta > 0 ? "+" : ""}${delta} kg vs précédente` : null} right={`${w.weight} kg`} onDelete={() => onDelete(w.id)} />;
        })}
      </Card>
    </div>
  );
}

// ================= Calories hub (Journal / Recettes / Plan / Courses) =================
function CaloriesScreen(props) {
  const { date, setDate, foods, calorieGoal, proteinGoal, quickFoods, recipes, mealPlans,
    onAdd, onDelete, onDeleteQuick, onAddRecipe, onUpdateRecipe, onDeleteRecipe, updateMealPlans, logRecipeToDay, apiKey } = props;
  const [sub, setSub] = useState("journal");

  return (
    <div>
      <SegControl
        value={sub} onChange={setSub}
        options={[{ id: "journal", label: "Journal" }, { id: "recettes", label: "Recettes" }, { id: "plan", label: "Plan semaine" }, { id: "courses", label: "Courses" }]}
      />
      {sub === "journal" && (
        <JournalScreen date={date} setDate={setDate} foods={foods} calorieGoal={calorieGoal} proteinGoal={proteinGoal} quickFoods={quickFoods} onAdd={onAdd} onDelete={onDelete} onDeleteQuick={onDeleteQuick} apiKey={apiKey} />
      )}
      {sub === "recettes" && (
        <RecipeBankScreen recipes={recipes} onAdd={onAddRecipe} onUpdate={onUpdateRecipe} onDelete={onDeleteRecipe} apiKey={apiKey} />
      )}
      {sub === "plan" && (
        <PlanScreen recipes={recipes} calorieGoal={calorieGoal} proteinGoal={proteinGoal} mealPlans={mealPlans} updateMealPlans={updateMealPlans} logRecipeToDay={logRecipeToDay} onGoToGroceries={() => setSub("courses")} />
      )}
      {sub === "courses" && <GroceryListScreen mealPlans={mealPlans} recipes={recipes} />}
    </div>
  );
}

function JournalScreen({ date, setDate, foods, calorieGoal, proteinGoal, quickFoods, onAdd, onDelete, onDeleteQuick, apiKey }) {
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [showMacros, setShowMacros] = useState(false);
  const [saveQuick, setSaveQuick] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const total = foods.reduce((s, f) => s + Number(f.calories || 0), 0);
  const totalProtein = foods.reduce((s, f) => s + Number(f.protein || 0), 0);
  const remaining = calorieGoal ? calorieGoal - total : null;
  const pct = calorieGoal ? Math.min(100, (total / calorieGoal) * 100) : 0;
  const proteinPct = proteinGoal ? Math.min(100, (totalProtein / proteinGoal) * 100) : 0;

  const submit = () => {
    if (!form.name.trim() || !form.calories) return;
    onAdd({ id: uid(), name: form.name.trim(), calories: Number(form.calories), protein: form.protein ? Number(form.protein) : undefined, carbs: form.carbs ? Number(form.carbs) : undefined, fat: form.fat ? Number(form.fat) : undefined }, saveQuick);
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setSaveQuick(false);
  };
  const addQuick = (q) => onAdd({ id: uid(), name: q.name, calories: q.calories, protein: q.protein, carbs: q.carbs, fat: q.fat }, false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null); setImporting(true);
    try {
      const base64 = await fileToBase64(file);
      const data = await extractFoodFromImage(base64, file.type || "image/jpeg", apiKey);
      setForm(data);
      setShowMacros(true);
    } catch (err) {
      setImportError(err.message || "Une erreur est survenue.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <DateNav date={date} onChange={setDate} />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: C.ivory }}>{total}</div>
            <div style={{ fontSize: 12, color: C.muted }}>kcal consommées</div>
          </div>
          {calorieGoal ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, color: remaining < 0 ? C.danger : C.sage }}>{remaining >= 0 ? `${remaining} restantes` : `${-remaining} de plus`}</div>
              <div style={{ fontSize: 11, color: C.muted }}>objectif {calorieGoal} kcal</div>
            </div>
          ) : <div style={{ fontSize: 11, color: C.muted }}>règle un objectif dans les réglages</div>}
        </div>
        {calorieGoal && <div style={{ height: 5, background: C.surfaceAlt, borderRadius: 99, overflow: "hidden", marginTop: 10 }}><div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? C.danger : C.gold, borderRadius: 99 }} /></div>}
      </Card>

      {proteinGoal && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 12, color: C.muted }}>Protéines</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.sage }}>{totalProtein}g / {proteinGoal}g</div>
          </div>
          <div style={{ height: 5, background: C.surfaceAlt, borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", width: `${proteinPct}%`, background: C.sage, borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 6 }}>Prioriser les protéines aide à préserver le muscle pendant la perte de graisse.</div>
        </Card>
      )}

      {quickFoods.length > 0 && (
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Ajout rapide</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {quickFoods.map((q) => (
              <button key={q.id} onClick={() => addQuick(q)} style={{ flexShrink: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", cursor: "pointer", textAlign: "left", boxShadow: "0 1px 2px rgba(20,20,30,0.04), 0 4px 10px rgba(20,20,30,0.05)" }}>
                <div style={{ color: C.ivory, fontSize: 12.5, fontWeight: 500 }}>{q.name}</div>
                <div style={{ color: C.muted, fontSize: 11, fontFamily: FONT_MONO }}>{q.calories} kcal</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Ajouter un aliment</div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
        <div style={{ marginBottom: 10 }}>
          <PrimaryButton color={C.sage} onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 size={15} className="spin" /> : <Camera size={15} />} {importing ? "Analyse de la photo..." : "Reconnaître depuis une photo"}
          </PrimaryButton>
        </div>
        {importError && (
          <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ color: C.danger, fontSize: 12, lineHeight: 1.5 }}>{importError}</div>
            <button onClick={() => setImportError(null)} style={{ marginTop: 6, background: "none", border: "none", color: C.sage, fontSize: 11.5, cursor: "pointer" }}>OK</button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <TextField placeholder="Nom (ex. Poulet grillé)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField type="number" inputMode="numeric" placeholder="Calories (kcal)" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          {!showMacros ? (
            <button onClick={() => setShowMacros(true)} style={{ background: "none", border: "none", color: C.sage, fontSize: 12, textAlign: "left", cursor: "pointer", padding: "2px 0" }}>+ ajouter les macros (optionnel)</button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <TextField type="number" placeholder="Prot. g" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
              <TextField type="number" placeholder="Gluc. g" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
              <TextField type="number" placeholder="Lip. g" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.muted, cursor: "pointer" }}>
            <input type="checkbox" checked={saveQuick} onChange={(e) => setSaveQuick(e.target.checked)} /> Enregistrer en ajout rapide
          </label>
          <PrimaryButton onClick={submit} disabled={!form.name.trim() || !form.calories}><Plus size={15} /> Ajouter</PrimaryButton>
        </div>
      </Card>

      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Journal du jour</div>
        {foods.length === 0 && <EmptyState text="Rien d'ajouté pour ce jour." />}
        {foods.map((f) => (
          <ListRow key={f.id} title={f.name} subtitle={f.protein || f.carbs || f.fat ? `P ${f.protein || 0}g · G ${f.carbs || 0}g · L ${f.fat || 0}g` : null} right={`${f.calories} kcal`} onDelete={() => onDelete(f.id)} />
        ))}
      </Card>

      {quickFoods.length > 0 && (
        <Card>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Gérer les ajouts rapides</div>
          {quickFoods.map((q) => <ListRow key={q.id} title={q.name} right={`${q.calories} kcal`} onDelete={() => onDeleteQuick(q.id)} />)}
        </Card>
      )}
    </div>
  );
}

// ---------- Recipe bank ----------
const emptyRecipeForm = { name: "", mealType: "dejeuner", calories: "", protein: "", carbs: "", fat: "", prepTime: "", highProtein: false, ingredients: "", instructions: "" };

function RecipeForm({ initial, heading, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || emptyRecipeForm);
  const submit = () => {
    if (!form.name.trim() || !form.calories) return;
    onSubmit({
      name: form.name.trim(), mealType: form.mealType, calories: Number(form.calories),
      protein: form.protein ? Number(form.protein) : 0, carbs: form.carbs ? Number(form.carbs) : 0, fat: form.fat ? Number(form.fat) : 0,
      prepTime: form.prepTime ? Number(form.prepTime) : null, highProtein: !!form.highProtein,
      ingredients: (form.ingredients || "").split("\n").map((s) => s.trim()).filter(Boolean),
      instructions: (form.instructions || "").trim(),
    });
  };
  return (
    <Card>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>{heading || (initial ? "Modifier la recette" : "Nouvelle recette")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <TextField placeholder="Nom de la recette" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MEAL_TYPES.map((m) => (
            <Chip key={m.id} active={form.mealType === m.id} color={C.sage} onClick={() => setForm({ ...form, mealType: m.id })}>{m.label}</Chip>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TextField type="number" placeholder="Calories" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          <TextField type="number" placeholder="Prép. (min)" value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: e.target.value })} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TextField type="number" placeholder="Prot. g" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
          <TextField type="number" placeholder="Gluc. g" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
          <TextField type="number" placeholder="Lip. g" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.muted, cursor: "pointer" }}>
          <input type="checkbox" checked={form.highProtein} onChange={(e) => setForm({ ...form, highProtein: e.target.checked })} /> Riche en protéines
        </label>
        <TextField textarea placeholder="Ingrédients (un par ligne)" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
        <TextField textarea placeholder="Préparation" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        <div style={{ display: "flex", gap: 8 }}>
          <PrimaryButton color={C.surfaceAlt} style={{ color: C.ivory }} onClick={onCancel}>Annuler</PrimaryButton>
          <PrimaryButton color={C.sage} onClick={submit} disabled={!form.name.trim() || !form.calories}><Check size={15} /> Enregistrer</PrimaryButton>
        </div>
      </div>
    </Card>
  );
}

function RecipeCard({ recipe, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const meta = mealMeta(recipe.mealType);
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
          <IconPill Icon={meta.Icon} color={recipe.highProtein ? C.sage : C.muted} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: C.ivory, fontSize: 14, fontWeight: 500 }}>{recipe.name}</div>
            <div style={{ color: C.muted, fontSize: 11.5, marginTop: 2 }}>
              {meta.label} · {recipe.calories} kcal{recipe.prepTime ? ` · ${recipe.prepTime} min` : ""}{recipe.highProtein ? " · protéiné" : ""}
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.muted, marginBottom: 8 }}>
            P {recipe.protein || 0}g · G {recipe.carbs || 0}g · L {recipe.fat || 0}g
          </div>
          {recipe.ingredients?.length > 0 && (
            <ul style={{ margin: "0 0 8px", paddingLeft: 18, color: C.ivory, fontSize: 12.5 }}>
              {recipe.ingredients.map((ing, i) => <li key={i} style={{ marginBottom: 2 }}>{ing}</li>)}
            </ul>
          )}
          {recipe.instructions && <p style={{ color: C.ivory, fontSize: 12.5, lineHeight: 1.5, margin: "0 0 10px" }}>{recipe.instructions}</p>}
          <div style={{ display: "flex", gap: 14 }}>
            <button onClick={onEdit} style={{ background: "none", border: "none", color: C.sage, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Pencil size={13} /> Modifier</button>
            <button onClick={onDelete} style={{ background: "none", border: "none", color: C.danger, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Trash2 size={13} /> Supprimer</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function RecipeBankScreen({ recipes, onAdd, onUpdate, onDelete, apiKey }) {
  const [filter, setFilter] = useState("tous");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importedData, setImportedData] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = filter === "tous" ? recipes : recipes.filter((r) => r.mealType === filter);
  const editingRecipe = recipes.find((r) => r.id === editingId);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAdding(false); setEditingId(null); setImportedData(null); setImportError(null); setImporting(true);
    try {
      const base64 = await fileToBase64(file);
      const data = await extractRecipeFromImage(base64, file.type || "image/jpeg", apiKey);
      setImportedData(data);
    } catch (err) {
      setImportError(err.message || "Une erreur est survenue.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }}>
        <Chip active={filter === "tous"} onClick={() => setFilter("tous")} color={C.gold}>Tous</Chip>
        {MEAL_TYPES.map((m) => <Chip key={m.id} active={filter === m.id} onClick={() => setFilter(m.id)} color={C.gold}>{m.label}</Chip>)}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

      {!adding && !editingId && !importedData && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}><PrimaryButton onClick={() => setAdding(true)}><Plus size={15} /> Ajouter</PrimaryButton></div>
          <div style={{ flex: 1 }}>
            <PrimaryButton color={C.sage} onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 size={15} className="spin" /> : <Camera size={15} />} {importing ? "Analyse..." : "Depuis une photo"}
            </PrimaryButton>
          </div>
        </div>
      )}

      {importError && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ color: C.danger, fontSize: 12.5, lineHeight: 1.5 }}>{importError}</div>
          <button onClick={() => setImportError(null)} style={{ marginTop: 8, background: "none", border: "none", color: C.sage, fontSize: 12, cursor: "pointer" }}>OK</button>
        </Card>
      )}

      {importedData && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>
            Vérifie les informations extraites de la photo avant d'enregistrer — les valeurs nutritionnelles sont des estimations.
          </div>
          <RecipeForm
            initial={importedData} heading="Recette importée · vérifie avant d'enregistrer"
            onCancel={() => setImportedData(null)}
            onSubmit={(r) => { onAdd(r); setImportedData(null); }}
          />
        </div>
      )}

      {adding && (
        <div style={{ marginBottom: 12 }}>
          <RecipeForm onCancel={() => setAdding(false)} onSubmit={(r) => { onAdd(r); setAdding(false); }} />
        </div>
      )}
      {editingRecipe && (
        <div style={{ marginBottom: 12 }}>
          <RecipeForm initial={{ ...editingRecipe, ingredients: (editingRecipe.ingredients || []).join("\n") }} onCancel={() => setEditingId(null)} onSubmit={(patch) => { onUpdate(editingId, patch); setEditingId(null); }} />
        </div>
      )}

      {filtered.length === 0 && <EmptyState text="Aucune recette dans cette catégorie." />}
      {filtered.map((r) => (
        <RecipeCard key={r.id} recipe={r} onEdit={() => { setEditingId(r.id); setAdding(false); }} onDelete={() => onDelete(r.id)} />
      ))}
    </div>
  );
}

// ---------- Plan generation ----------
function pickForSlot(recipes, mealTypeId, targetCal, excludeId) {
  let candidates = recipes.filter((r) => r.mealType === mealTypeId && r.id !== excludeId);
  if (candidates.length === 0) candidates = recipes.filter((r) => r.mealType === mealTypeId);
  if (candidates.length === 0) return null;
  const scored = candidates.map((r) => ({ r, score: (r.highProtein ? 20 : 0) - Math.abs(r.calories - targetCal) / 3 }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.max(2, Math.ceil(scored.length * 0.4)));
  return top[Math.floor(Math.random() * top.length)].r;
}

function includedMealTypes(includeMeals) {
  return MEAL_TYPES.filter((m) => includeMeals[m.id]);
}

function generateDay(recipes, calorieGoal, includeMeals, prevDay) {
  const goal = calorieGoal || 2000;
  const day = {};
  const included = includedMealTypes(includeMeals);
  const totalShare = included.reduce((s, m) => s + m.share, 0) || 1;
  included.forEach((meta) => {
    const mid = meta.id;
    const exclude = prevDay?.[mid]?.recipeId;
    const target = goal * (meta.share / totalShare);
    const picked = pickForSlot(recipes, mid, target, exclude);
    day[mid] = { recipeId: picked ? picked.id : null, locked: false };
  });
  return day;
}

function generateWeek(recipes, calorieGoal, includeMeals) {
  const days = {};
  let prev = null;
  return { includeMeals, days: (function build() {
    const start = mondayOf(todayStr());
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      const day = generateDay(recipes, calorieGoal, includeMeals, prev);
      days[date] = day;
      prev = day;
    }
    return days;
  })() };
}

function regenerateDay(existingPlan, date, recipes, calorieGoal) {
  const oldDay = existingPlan.days[date] || {};
  const goal = calorieGoal || 2000;
  const newDay = {};
  const included = includedMealTypes(existingPlan.includeMeals);
  const totalShare = included.reduce((s, m) => s + m.share, 0) || 1;
  included.forEach((m) => {
    const slot = oldDay[m.id];
    if (slot?.locked) { newDay[m.id] = slot; return; }
    const target = goal * (m.share / totalShare);
    const picked = pickForSlot(recipes, m.id, target, slot?.recipeId);
    newDay[m.id] = { recipeId: picked ? picked.id : null, locked: false };
  });
  return { ...existingPlan, days: { ...existingPlan.days, [date]: newDay } };
}

function RecipePickerModal({ mealTypeId, recipes, onSelect, onClose }) {
  const list = recipes.filter((r) => r.mealType === mealTypeId);
  const meta = mealMeta(mealTypeId);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,16,15,0.6)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ivory }}>Choisir · {meta.label}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={C.muted} /></button>
        </div>
        {list.length === 0 && <EmptyState text="Aucune recette dans cette catégorie. Ajoutes-en dans l'onglet Recettes." />}
        {list.map((r) => (
          <button key={r.id} onClick={() => onSelect(r.id)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, padding: "10px 2px", cursor: "pointer" }}>
            <div style={{ color: C.ivory, fontSize: 14 }}>{r.name}</div>
            <div style={{ color: C.muted, fontSize: 11.5, fontFamily: FONT_MONO }}>{r.calories} kcal · P{r.protein || 0}g{r.highProtein ? " · protéiné" : ""}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DayPlanCard({ date, day, recipes, includeMeals, onToggleLock, onSwap, onRegenerate, onLog }) {
  const isFuture = date > todayStr();
  const slots = includedMealTypes(includeMeals);
  const dayTotal = slots.reduce((sum, m) => {
    const r = recipes.find((rec) => rec.id === day?.[m.id]?.recipeId);
    return sum + (r ? r.calories : 0);
  }, 0);

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.ivory, textTransform: "capitalize" }}>{fmtDayShort(date)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.muted }}>{dayTotal} kcal</span>
          <button onClick={onRegenerate} aria-label="Régénérer ce jour" style={{ background: "none", border: "none", cursor: "pointer" }}><Shuffle size={14} color={C.muted} /></button>
        </div>
      </div>
      {slots.map((m) => {
        const slot = day?.[m.id];
        const recipe = recipes.find((r) => r.id === slot?.recipeId);
        return (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
            <m.Icon size={15} color={C.muted} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: recipe ? C.ivory : C.muted, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {recipe ? recipe.name : "Recette introuvable"}
              </div>
              {recipe && <div style={{ color: C.muted, fontSize: 11, fontFamily: FONT_MONO }}>{recipe.calories} kcal · P{recipe.protein || 0}g</div>}
            </div>
            <button onClick={() => onToggleLock(m.id)} aria-label="Verrouiller" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {slot?.locked ? <Lock size={13} color={C.gold} /> : <Unlock size={13} color={C.muted} />}
            </button>
            <button onClick={() => onSwap(m.id)} aria-label="Changer" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Shuffle size={13} color={C.muted} />
            </button>
            {recipe && !isFuture && (
              <button onClick={() => onLog(recipe)} style={{ background: C.sage + "22", border: "none", borderRadius: 8, padding: "5px 8px", cursor: "pointer" }}>
                <Check size={13} color={C.sage} />
              </button>
            )}
          </div>
        );
      })}
    </Card>
  );
}

const DEFAULT_INCLUDE_MEALS = { "petit-dej": true, "dejeuner": true, "diner": true, "collation": false };

function PlanScreen({ recipes, calorieGoal, proteinGoal, mealPlans, updateMealPlans, logRecipeToDay, onGoToGroceries }) {
  const [weekStart, setWeekStart] = useState(mondayOf(todayStr()));
  const [pickerFor, setPickerFor] = useState(null); // {date, mealTypeId}
  const plan = mealPlans[weekStart];

  const setPlan = (next) => updateMealPlans({ ...mealPlans, [weekStart]: next });
  // Toute modification du contenu invalide le menu ; seule l'action "Valider" le confirme.
  const mutatePlan = (next) => setPlan({ ...next, validated: false });

  const includeMeals = plan?.includeMeals || DEFAULT_INCLUDE_MEALS;

  const generate = () => {
    if (recipes.length === 0) return;
    const fresh = generateWeek(recipes, calorieGoal, includeMeals);
    mutatePlan(fresh);
  };

  const toggleMeal = (mid) => {
    const activeCount = Object.values(includeMeals).filter(Boolean).length;
    if (includeMeals[mid] && activeCount <= 1) return; // garde au moins un repas actif
    const nextIncludeMeals = { ...includeMeals, [mid]: !includeMeals[mid] };
    if (!plan) { mutatePlan(generateWeek(recipes, calorieGoal, nextIncludeMeals)); return; }
    mutatePlan({ ...plan, includeMeals: nextIncludeMeals });
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><ChevronLeft size={18} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.ivory }}>Semaine du {fmtDateShort(weekStart)}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><ChevronRight size={18} /></button>
      </div>

      {recipes.length === 0 ? (
        <EmptyState text="Ajoute d'abord quelques recettes dans l'onglet Recettes pour générer un plan." />
      ) : (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Quels repas inclure dans le plan ?</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {MEAL_TYPES.map((m) => <Chip key={m.id} active={includeMeals[m.id]} color={C.gold} onClick={() => toggleMeal(m.id)}>{m.label}</Chip>)}
            </div>
            <PrimaryButton onClick={generate}><Shuffle size={15} /> {plan ? "Régénérer la semaine" : "Générer mon plan"}</PrimaryButton>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
              Priorité aux recettes riches en protéines{proteinGoal ? ` (objectif ${proteinGoal}g/j)` : ""} pour préserver ta masse musculaire pendant la perte de graisse — pas juste faire baisser le chiffre sur la balance. Les calories se répartissent uniquement entre les repas cochés. Verrouille un repas 🔒 pour le garder lors d'une régénération.
            </div>
          </Card>

          {plan && (
            <Card style={{ marginBottom: 12, background: plan.validated ? C.sage + "18" : C.surfaceAlt }}>
              {plan.validated ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.sage, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    <Check size={15} /> Menu validé pour la semaine
                  </div>
                  <PrimaryButton color={C.sage} onClick={onGoToGroceries}>Voir ma liste de courses</PrimaryButton>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Une fois ton menu figé pour la semaine, valide-le pour générer la liste de courses correspondante.</div>
                  <PrimaryButton color={C.sage} onClick={() => setPlan({ ...plan, validated: true })}><Check size={15} /> Valider le menu de la semaine</PrimaryButton>
                </div>
              )}
            </Card>
          )}

          {!plan && <EmptyState text="Aucun plan pour cette semaine pour l'instant." />}
          {plan && days.map((date) => (
            <DayPlanCard
              key={date} date={date} day={plan.days[date]} recipes={recipes} includeMeals={plan.includeMeals || DEFAULT_INCLUDE_MEALS}
              onToggleLock={(mid) => {
                const day = plan.days[date] || {};
                const slot = day[mid] || { recipeId: null, locked: false };
                mutatePlan({ ...plan, days: { ...plan.days, [date]: { ...day, [mid]: { ...slot, locked: !slot.locked } } } });
              }}
              onSwap={(mid) => setPickerFor({ date, mid })}
              onRegenerate={() => mutatePlan(regenerateDay(plan, date, recipes, calorieGoal))}
              onLog={(recipe) => logRecipeToDay(date, recipe)}
            />
          ))}
        </>
      )}

      {pickerFor && (
        <RecipePickerModal
          mealTypeId={pickerFor.mid} recipes={recipes} onClose={() => setPickerFor(null)}
          onSelect={(recipeId) => {
            const day = plan.days[pickerFor.date] || {};
            mutatePlan({ ...plan, days: { ...plan.days, [pickerFor.date]: { ...day, [pickerFor.mid]: { recipeId, locked: false } } } });
            setPickerFor(null);
          }}
        />
      )}
    </div>
  );
}

// ---------- Grocery list ----------
function GroceryListScreen({ mealPlans, recipes }) {
  const [weekStart, setWeekStart] = useState(mondayOf(todayStr()));
  const [checked, setChecked] = useState({});
  const plan = mealPlans[weekStart];

  useEffect(() => {
    (async () => { const c = await loadKey(`grocery-checked:${weekStart}`, {}); setChecked(c); })();
  }, [weekStart]);

  const toggle = (key) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    saveKey(`grocery-checked:${weekStart}`, next);
  };
  const resetChecks = () => { setChecked({}); saveKey(`grocery-checked:${weekStart}`, {}); };

  const items = useMemo(() => {
    if (!plan?.validated) return [];
    const tally = {};
    Object.values(plan.days || {}).forEach((day) => {
      Object.values(day || {}).forEach((slot) => {
        const recipe = recipes.find((r) => r.id === slot?.recipeId);
        if (!recipe) return;
        (recipe.ingredients || []).forEach((ing) => { tally[ing] = (tally[ing] || 0) + 1; });
      });
    });
    return Object.entries(tally).map(([text, count]) => ({ text, count, category: categorize(text) }));
  }, [plan, recipes]);

  const grouped = GROCERY_CATEGORIES.concat([{ id: "autre", label: "Autre" }])
    .map((cat) => ({ ...cat, items: items.filter((i) => i.category === cat.id).sort((a, b) => a.text.localeCompare(b.text)) }))
    .filter((g) => g.items.length > 0);

  const totalCount = items.length;
  const checkedCount = items.filter((i) => checked[i.text]).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><ChevronLeft size={18} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.ivory }}>Semaine du {fmtDateShort(weekStart)}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><ChevronRight size={18} /></button>
      </div>

      {!plan && <EmptyState text="Aucun menu généré pour cette semaine. Va dans Plan semaine pour en créer un." />}
      {plan && !plan.validated && <EmptyState text="Valide ton menu dans l'onglet Plan semaine pour générer la liste de courses correspondante." />}

      {plan?.validated && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.muted }}>{checkedCount} / {totalCount} récupérés</span>
              <button onClick={resetChecks} style={{ background: "none", border: "none", color: C.sage, fontSize: 12, cursor: "pointer" }}>Tout décocher</button>
            </div>
          </Card>
          {grouped.map((g) => (
            <Card key={g.id} style={{ marginBottom: 10 }}>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{g.label}</div>
              {g.items.map((it) => {
                const isChecked = !!checked[it.text];
                return (
                  <label key={it.text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${C.border}`, cursor: "pointer" }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggle(it.text)} />
                    <span style={{ flex: 1, fontSize: 13.5, color: isChecked ? C.muted : C.ivory, textDecoration: isChecked ? "line-through" : "none" }}>{it.text}</span>
                    {it.count > 1 && <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.muted }}>×{it.count}</span>}
                  </label>
                );
              })}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ================= Activity hub (Journal / Séances / Plan sport) =================
function ActivityScreen({ date, setDate, items, onAdd, onDelete, workoutPlans, updateWorkoutPlans, logWorkoutToDay, workoutSessions, updateWorkoutSessions }) {
  const [sub, setSub] = useState("journal");
  return (
    <div>
      <SegControl value={sub} onChange={setSub} options={[{ id: "journal", label: "Journal" }, { id: "seances", label: "Séances" }, { id: "plan", label: "Plan sport" }]} />
      {sub === "journal" && <ActivityJournalScreen date={date} setDate={setDate} items={items} onAdd={onAdd} onDelete={onDelete} />}
      {sub === "seances" && (
        <SessionBankScreen
          sessions={workoutSessions}
          onAdd={(s) => updateWorkoutSessions([...workoutSessions, { ...s, id: uid(), custom: true }])}
          onUpdate={(id, patch) => updateWorkoutSessions(workoutSessions.map((s) => (s.id === id ? { ...s, ...patch } : s)))}
          onDelete={(id) => updateWorkoutSessions(workoutSessions.filter((s) => s.id !== id))}
        />
      )}
      {sub === "plan" && <WorkoutPlanScreen workoutPlans={workoutPlans} updateWorkoutPlans={updateWorkoutPlans} logWorkoutToDay={logWorkoutToDay} sessions={workoutSessions} />}
    </div>
  );
}

function ActivityJournalScreen({ date, setDate, items, onAdd, onDelete }) {
  const [type, setType] = useState(ACTIVITY_PRESETS[0]);
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const total = items.reduce((s, a) => s + Number(a.calories || 0), 0);
  const submit = () => { if (!duration) return; onAdd({ id: uid(), type, duration: Number(duration), calories: calories ? Number(calories) : 0 }); setDuration(""); setCalories(""); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <DateNav date={date} onChange={setDate} />
      <Card>
        <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.ivory }}>{total} kcal</div>
        <div style={{ fontSize: 12, color: C.muted }}>brûlées · {items.length} séance{items.length !== 1 ? "s" : ""}</div>
      </Card>
      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Nouvelle séance</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {ACTIVITY_PRESETS.map((p) => <Chip key={p} active={type === p} color={C.rust} onClick={() => setType(p)}>{p}</Chip>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TextField type="number" inputMode="numeric" placeholder="Durée (min)" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <TextField type="number" inputMode="numeric" placeholder="Kcal brûlées (optionnel)" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}><PrimaryButton color={C.rust} onClick={submit} disabled={!duration}><Plus size={15} /> Ajouter</PrimaryButton></div>
      </Card>
      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Séances du jour</div>
        {items.length === 0 && <EmptyState text="Aucune activité enregistrée." />}
        {items.map((a) => <ListRow key={a.id} title={a.type} subtitle={`${a.duration} min`} right={a.calories ? `${a.calories} kcal` : "—"} onDelete={() => onDelete(a.id)} />)}
      </Card>
    </div>
  );
}

// ---------- Workout plan generation ----------
const MAX_TRAINING_DAYS = 6; // garde au moins un vrai jour de repos dans la semaine

function pickEvenIndices(total, count) {
  if (count <= 0 || total <= 0) return [];
  const step = total / count;
  const idxs = new Set();
  for (let i = 0; i < count; i++) idxs.add(Math.min(total - 1, Math.floor(i * step)));
  return [...idxs];
}

function generateWorkoutWeek(preferences, weekStart, existingDays, sessions) {
  const { cardioTypes, availableDays } = preferences;
  const muscuCount = preferences.counts.muscu;
  const cardioCount = preferences.counts.cardio;
  const trainingTotal = Math.min(MAX_TRAINING_DAYS, muscuCount + cardioCount);
  // Si le total dépasse le plafond, on réduit proportionnellement muscu et cardio.
  const scale = (muscuCount + cardioCount) > 0 ? trainingTotal / (muscuCount + cardioCount) : 1;
  const trainingCounts = { muscu: Math.round(muscuCount * scale), cardio: Math.round(cardioCount * scale) };
  while (trainingCounts.muscu + trainingCounts.cardio > trainingTotal) {
    if (trainingCounts.cardio > 0) trainingCounts.cardio--; else trainingCounts.muscu--;
  }
  const sequence = buildSessionSequence(trainingCounts);
  const sortedAvail = [...availableDays].sort((a, b) => a - b);

  const days = {};
  const lockedIdx = new Set();
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const existing = existingDays?.[date];
    if (existing?.locked) { days[date] = existing; lockedIdx.add(i); }
  }
  const freeAvail = sortedAvail.filter((i) => !lockedIdx.has(i));

  const trainingAssign = [];
  let seqIdx = 0;
  for (const i of freeAvail) {
    if (seqIdx >= sequence.length) break;
    trainingAssign.push({ i, category: sequence[seqIdx] });
    seqIdx++;
  }
  const usedIdx = new Set(trainingAssign.map((t) => t.i));
  const remainingFree = freeAvail.filter((i) => !usedIdx.has(i));

  const comboCount = Math.min(preferences.counts.mobilite, trainingAssign.length);
  const comboPositions = new Set(pickEvenIndices(trainingAssign.length, comboCount));
  const standaloneCount = Math.max(0, preferences.counts.mobilite - comboCount);
  const standaloneDays = remainingFree.slice(0, standaloneCount);

  const lastSessionBySport = {};
  Object.values(days).forEach((d) => {
    if (d?.sportId && d.sportId !== "repos") lastSessionBySport[d.sportId] = d.sessionId;
    if (d?.comboSessionId) lastSessionBySport.mobilite = d.comboSessionId;
  });

  let cardioCycle = 0;
  trainingAssign.forEach((t, pos) => {
    const date = addDays(weekStart, t.i);
    let sportId;
    if (t.category === "cardio" && cardioTypes.length > 0) { sportId = cardioTypes[cardioCycle % cardioTypes.length]; cardioCycle++; }
    else sportId = "muscu";
    const session = pickSessionForSport(sessions, sportId, lastSessionBySport[sportId]);
    lastSessionBySport[sportId] = session ? session.id : null;
    let comboSessionId = null;
    if (comboPositions.has(pos)) {
      const comboSession = pickSessionForSport(sessions, "mobilite", lastSessionBySport.mobilite);
      comboSessionId = comboSession ? comboSession.id : null;
      lastSessionBySport.mobilite = comboSessionId;
    }
    days[date] = { sportId, sessionId: session ? session.id : null, comboSessionId, locked: false };
  });

  standaloneDays.forEach((i) => {
    const date = addDays(weekStart, i);
    const session = pickSessionForSport(sessions, "mobilite", lastSessionBySport.mobilite);
    lastSessionBySport.mobilite = session ? session.id : null;
    days[date] = { sportId: "mobilite", sessionId: session ? session.id : null, comboSessionId: null, locked: false };
  });

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    if (!days[date]) days[date] = { sportId: "repos", sessionId: null, comboSessionId: null, locked: false };
  }
  return days;
}

const stepBtnStyle = { width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ivory, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 };

function SportQuestionnaire({ initial, onSubmit, onCancel }) {
  const [stage, setStage] = useState("counts");
  const [counts, setCounts] = useState(initial?.counts || { muscu: SPORT_CATEGORY_META.muscu.recommended, cardio: SPORT_CATEGORY_META.cardio.recommended, mobilite: SPORT_CATEGORY_META.mobilite.recommended });
  const [cardioTypes, setCardioTypes] = useState(initial?.cardioTypes || []);
  const [availableDays, setAvailableDays] = useState(initial?.availableDays || []);

  const setCount = (cat, delta) => setCounts((c) => {
    const next = { ...c, [cat]: Math.max(0, c[cat] + delta) };
    if (cat === "mobilite") { next.mobilite = Math.min(7, next.mobilite); return next; }
    if (next.muscu + next.cardio > MAX_TRAINING_DAYS) return c; // plafond, on ignore l'incrément
    return next;
  });
  const toggleCardioType = (id) => setCardioTypes((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const toggleDay = (i) => setAvailableDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort((a, b) => a - b)));

  const trainingTotal = counts.muscu + counts.cardio;
  const total = trainingTotal + counts.mobilite;
  const cardioNeedsTypes = counts.cardio > 0;
  const canSubmit = availableDays.length > 0 && (!cardioNeedsTypes || cardioTypes.length > 0);

  if (stage === "counts") {
    return (
      <Card style={{ marginBottom: 12 }}>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Combien de séances par catégorie cette semaine ?</div>
        <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 4, lineHeight: 1.5 }}>Répartition suggérée pour la perte de graisse — ajuste comme tu veux. L'étirement peut se greffer à une séance de muscu/cardio ou être posé seul, il ne compte pas dans le plafond ci-dessous.</div>
        {Object.entries(SPORT_CATEGORY_META).map(([catId, meta]) => {
          const atCap = catId !== "mobilite" && trainingTotal >= MAX_TRAINING_DAYS;
          return (
            <div key={catId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
              <div style={{ paddingRight: 10 }}>
                <div style={{ color: C.ivory, fontSize: 13, fontWeight: 500 }}>{meta.label}</div>
                <div style={{ color: C.muted, fontSize: 10.5, marginTop: 1 }}>{meta.hint}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={() => setCount(catId, -1)} style={stepBtnStyle}>−</button>
                <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.ivory, minWidth: 14, textAlign: "center" }}>{counts[catId]}</span>
                <button onClick={() => setCount(catId, 1)} disabled={atCap} style={{ ...stepBtnStyle, opacity: atCap ? 0.4 : 1, cursor: atCap ? "default" : "pointer" }}>+</button>
              </div>
            </div>
          );
        })}
        {trainingTotal >= MAX_TRAINING_DAYS && (
          <div style={{ fontSize: 10.5, color: C.gold, marginTop: 8, lineHeight: 1.5 }}>Renforcement + cardio plafonné à {MAX_TRAINING_DAYS}x/semaine pour garder au moins un vrai jour de repos.</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {initial && <PrimaryButton color={C.surfaceAlt} style={{ color: C.ivory }} onClick={onCancel}>Annuler</PrimaryButton>}
          <PrimaryButton color={C.rust} disabled={total === 0} onClick={() => setStage("details")}>Continuer</PrimaryButton>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      {counts.cardio > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Quel(s) cardio veux-tu faire ? ({counts.cardio}x cette semaine)</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sportsByCategory("cardio").map((id) => <Chip key={id} active={cardioTypes.includes(id)} color={C.gold} onClick={() => toggleCardioType(id)}>{sportById(id).label}</Chip>)}
          </div>
        </div>
      )}
      {counts.muscu > 0 && <div style={{ fontSize: 11.5, color: C.ivory, marginBottom: 8 }}>Renforcement : Musculation ({counts.muscu}x)</div>}
      {counts.mobilite > 0 && <div style={{ fontSize: 11.5, color: C.ivory, marginBottom: 8 }}>Étirement / mobilité : Yoga / Mobilité ({counts.mobilite}x)</div>}

      <div style={{ color: C.muted, fontSize: 12, margin: "10px 0 8px" }}>Quels jours es-tu disponible ?</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {WEEKDAYS.map((d, i) => <Chip key={i} active={availableDays.includes(i)} color={C.rust} onClick={() => toggleDay(i)}>{d}</Chip>)}
      </div>
      {availableDays.length > 0 && availableDays.length < trainingTotal && (
        <div style={{ fontSize: 10.5, color: C.gold, marginBottom: 8, lineHeight: 1.5 }}>Tu as {trainingTotal} séances de renforcement/cardio souhaitées mais {availableDays.length} jour{availableDays.length > 1 ? "s" : ""} dispo — certaines ne seront pas placées.</div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <PrimaryButton color={C.surfaceAlt} style={{ color: C.ivory }} onClick={() => setStage("counts")}>Retour</PrimaryButton>
        <PrimaryButton color={C.rust} disabled={!canSubmit} onClick={() => onSubmit({ counts, cardioTypes, availableDays })}>
          <Check size={15} /> {initial ? "Mettre à jour" : "Générer mon plan"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

function SessionPickerModal({ sportId, sessions, onSelect, onClose }) {
  const list = sessions.filter((s) => s.sportId === sportId);
  const def = sportById(sportId);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,16,15,0.6)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ivory }}>Choisir · {def.label}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={C.muted} /></button>
        </div>
        {list.length === 0 && <EmptyState text="Aucune séance dans cette catégorie. Ajoutes-en dans l'onglet Séances." />}
        {list.map((s) => (
          <button key={s.id} onClick={() => onSelect(s.id)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, padding: "10px 2px", cursor: "pointer" }}>
            <div style={{ color: C.ivory, fontSize: 14 }}>{s.name}</div>
            <div style={{ color: C.muted, fontSize: 11.5, fontFamily: FONT_MONO }}>{s.duration} min · {s.level}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DayWorkoutRow({ date, day, availableSports, session, comboSession, onSetSport, onSwapSession, onToggleCombo, onSwapCombo, onToggleLock, onLog }) {
  const [open, setOpen] = useState(false);
  const def = sportById(day.sportId);
  const duration = session?.duration ?? def.duration;
  const kcal = Math.round(duration * def.kcalPerMin);
  const isFuture = date > todayStr();
  const options = [...availableSports.map((id) => sportById(id)), sportById("repos")];
  const canCombo = def.category === "muscu" || def.category === "cardio";

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.ivory, textTransform: "capitalize" }}>{fmtDayShort(date)}</span>
        <button onClick={onToggleLock} aria-label="Verrouiller" style={{ background: "none", border: "none", cursor: "pointer" }}>
          {day.locked ? <Lock size={14} color={C.gold} /> : <Unlock size={14} color={C.muted} />}
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: def.category !== "repos" ? 10 : 0 }}>
        {options.map((o) => {
          const active = day.sportId === o.id || (day.sportId === undefined && o.id === "repos");
          const color = CATEGORY_COLOR[o.category];
          const Icon = CATEGORY_ICON[o.category];
          return (
            <button key={o.id} onClick={() => onSetSport(o.id)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "7px 10px",
              borderRadius: 999, cursor: "pointer", border: `1px solid ${active ? color : C.border}`,
              background: active ? color + "22" : "transparent",
            }}>
              <Icon size={13} color={active ? color : C.muted} />
              <span style={{ fontSize: 11.5, color: active ? C.ivory : C.muted }}>{o.label}</span>
            </button>
          );
        })}
      </div>

      {def.category !== "repos" && (
        session ? (
          <div>
            <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: C.surfaceAlt, borderRadius: 10, padding: "9px 10px" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: C.ivory, fontSize: 13, fontWeight: 500 }}>{session.name}</div>
                <div style={{ color: C.muted, fontSize: 11, fontFamily: FONT_MONO }}>{duration} min · {session.level} · ~{kcal} kcal</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={(e) => { e.stopPropagation(); onSwapSession(); }} aria-label="Changer la séance" style={{ background: "none", border: "none", cursor: "pointer" }}><Shuffle size={14} color={C.muted} /></button>
                {open ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
              </div>
            </div>
            {open && (
              <div style={{ padding: "10px 2px 0" }}>
                <ul style={{ margin: "0 0 8px", paddingLeft: 18, color: C.ivory, fontSize: 12.5 }}>
                  {session.exercises.map((ex, i) => <li key={i} style={{ marginBottom: 3 }}>{ex}</li>)}
                </ul>
                {session.notes && <p style={{ color: C.muted, fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>{session.notes}</p>}
              </div>
            )}

            {canCombo && (
              <div style={{ marginTop: 8 }}>
                {comboSession ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.sage + "14", borderRadius: 8, padding: "7px 10px" }}>
                    <div style={{ fontSize: 11.5, color: C.ivory }}>+ {comboSession.name} <span style={{ color: C.muted, fontFamily: FONT_MONO }}>· {comboSession.duration} min</span></div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={onSwapCombo} aria-label="Changer l'étirement" style={{ background: "none", border: "none", cursor: "pointer" }}><Shuffle size={12} color={C.muted} /></button>
                      <button onClick={onToggleCombo} aria-label="Retirer l'étirement" style={{ background: "none", border: "none", cursor: "pointer" }}><X size={13} color={C.muted} /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={onToggleCombo} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: C.sage, fontSize: 11.5, display: "flex", alignItems: "center", gap: 5 }}>
                    <Plus size={12} /> Ajouter un étirement
                  </button>
                )}
              </div>
            )}

            {!isFuture && (
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={onLog} style={{ background: C.sage + "22", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={12} color={C.sage} /><span style={{ fontSize: 11, color: C.sage }}>Journaliser</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState text="Aucune séance disponible pour ce sport, ajoutes-en dans l'onglet Séances." />
        )
      )}
    </Card>
  );
}

function WorkoutPlanScreen({ workoutPlans, updateWorkoutPlans, logWorkoutToDay, sessions }) {
  const [weekStart, setWeekStart] = useState(mondayOf(todayStr()));
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState(null); // { date, field: 'session' | 'combo' }
  const plan = workoutPlans[weekStart];
  const setPlan = (next) => updateWorkoutPlans({ ...workoutPlans, [weekStart]: next });

  const days = plan ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : [];
  const showQuestionnaire = !plan?.preferences || editing;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><ChevronLeft size={18} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.ivory }}>Semaine du {fmtDateShort(weekStart)}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}><ChevronRight size={18} /></button>
      </div>

      {showQuestionnaire ? (
        <SportQuestionnaire
          initial={plan?.preferences}
          onCancel={() => setEditing(false)}
          onSubmit={(preferences) => {
            setPlan({ preferences, days: generateWorkoutWeek(preferences, weekStart, plan?.days, sessions) });
            setEditing(false);
          }}
        />
      ) : (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Cette semaine</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {plan.preferences.counts.muscu > 0 && <span style={{ fontSize: 11, color: C.ivory, background: C.surfaceAlt, borderRadius: 999, padding: "3px 8px" }}>Renforcement {plan.preferences.counts.muscu}x</span>}
                {plan.preferences.counts.cardio > 0 && <span style={{ fontSize: 11, color: C.ivory, background: C.surfaceAlt, borderRadius: 999, padding: "3px 8px" }}>Cardio {plan.preferences.counts.cardio}x ({plan.preferences.cardioTypes.map((id) => sportById(id).label).join(", ")})</span>}
                {plan.preferences.counts.mobilite > 0 && <span style={{ fontSize: 11, color: C.ivory, background: C.surfaceAlt, borderRadius: 999, padding: "3px 8px" }}>Étirement {plan.preferences.counts.mobilite}x</span>}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Dispo : {plan.preferences.availableDays.map((i) => WEEKDAYS[i]).join(", ")}</div>
            </div>
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: C.sage, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <Pencil size={12} /> Modifier
            </button>
          </div>
          <PrimaryButton color={C.rust} onClick={() => setPlan({ ...plan, days: generateWorkoutWeek(plan.preferences, weekStart, plan.days, sessions) })}>
            <Shuffle size={15} /> Régénérer la semaine
          </PrimaryButton>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
            Renforcement + cardio plafonnés à {MAX_TRAINING_DAYS}x/semaine pour garder un vrai jour de repos. L'étirement se greffe à une séance existante (bouton "+ Ajouter un étirement") ou se pose seul un jour libre. Déplie une séance pour voir les exercices, tape 🔀 pour en changer, ou verrouille 🔒 avant de régénérer.
          </div>
        </Card>
      )}

      {plan && !showQuestionnaire && days.map((date) => {
        const day = plan.days[date] || { sportId: "repos", sessionId: null, comboSessionId: null, locked: false };
        const session = sessions.find((s) => s.id === day.sessionId);
        const comboSession = day.comboSessionId ? sessions.find((s) => s.id === day.comboSessionId) : null;
        return (
          <DayWorkoutRow
            key={date} date={date} day={day} availableSports={selectedSportIds(plan.preferences)} session={session} comboSession={comboSession}
            onSetSport={(sportId) => {
              const newSession = sportId === "repos" ? null : pickSessionForSport(sessions, sportId, null);
              setPlan({ ...plan, days: { ...plan.days, [date]: { sportId, sessionId: newSession ? newSession.id : null, comboSessionId: null, locked: day.locked } } });
            }}
            onSwapSession={() => setPicker({ date, field: "session" })}
            onToggleCombo={() => {
              if (day.comboSessionId) {
                setPlan({ ...plan, days: { ...plan.days, [date]: { ...day, comboSessionId: null } } });
              } else {
                const combo = pickSessionForSport(sessions, "mobilite", null);
                setPlan({ ...plan, days: { ...plan.days, [date]: { ...day, comboSessionId: combo ? combo.id : null } } });
              }
            }}
            onSwapCombo={() => setPicker({ date, field: "combo" })}
            onToggleLock={() => setPlan({ ...plan, days: { ...plan.days, [date]: { ...day, locked: !day.locked } } })}
            onLog={() => logWorkoutToDay(date, day)}
          />
        );
      })}

      {picker && (
        <SessionPickerModal
          sportId={picker.field === "combo" ? "mobilite" : plan.days[picker.date]?.sportId} sessions={sessions} onClose={() => setPicker(null)}
          onSelect={(sessionId) => {
            const day = plan.days[picker.date];
            const key = picker.field === "combo" ? "comboSessionId" : "sessionId";
            setPlan({ ...plan, days: { ...plan.days, [picker.date]: { ...day, [key]: sessionId } } });
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

// ---------- Session bank (Séances) ----------
const emptySessionForm = { name: "", sportId: "muscu", duration: "", level: "intermédiaire", exercises: "", notes: "" };

function SessionForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || emptySessionForm);
  const submit = () => {
    if (!form.name.trim() || !form.duration) return;
    onSubmit({
      name: form.name.trim(), sportId: form.sportId, duration: Number(form.duration), level: form.level,
      exercises: (form.exercises || "").split("\n").map((s) => s.trim()).filter(Boolean),
      notes: (form.notes || "").trim(),
    });
  };
  return (
    <Card>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>{initial ? "Modifier la séance" : "Nouvelle séance"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <TextField placeholder="Nom de la séance" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SPORT_OPTIONS.map((s) => <Chip key={s.id} active={form.sportId === s.id} color={CATEGORY_COLOR[s.category]} onClick={() => setForm({ ...form, sportId: s.id })}>{s.label}</Chip>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TextField type="number" placeholder="Durée (min)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["débutant", "intermédiaire", "avancé"].map((l) => <Chip key={l} active={form.level === l} color={C.sage} onClick={() => setForm({ ...form, level: l })}>{l}</Chip>)}
        </div>
        <TextField textarea placeholder="Exercices (un par ligne, ex. Squat 4x8)" value={form.exercises} onChange={(e) => setForm({ ...form, exercises: e.target.value })} />
        <TextField textarea placeholder="Notes / conseils" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div style={{ display: "flex", gap: 8 }}>
          <PrimaryButton color={C.surfaceAlt} style={{ color: C.ivory }} onClick={onCancel}>Annuler</PrimaryButton>
          <PrimaryButton color={C.sage} onClick={submit} disabled={!form.name.trim() || !form.duration}><Check size={15} /> Enregistrer</PrimaryButton>
        </div>
      </div>
    </Card>
  );
}

function SessionCard({ session, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const def = sportById(session.sportId);
  const Icon = CATEGORY_ICON[def.category];
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
          <IconPill Icon={Icon} color={CATEGORY_COLOR[def.category]} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: C.ivory, fontSize: 14, fontWeight: 500 }}>{session.name}</div>
            <div style={{ color: C.muted, fontSize: 11.5, marginTop: 2 }}>{def.label} · {session.duration} min · {session.level}</div>
          </div>
        </div>
        {open ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <ul style={{ margin: "0 0 8px", paddingLeft: 18, color: C.ivory, fontSize: 12.5 }}>
            {session.exercises.map((ex, i) => <li key={i} style={{ marginBottom: 2 }}>{ex}</li>)}
          </ul>
          {session.notes && <p style={{ color: C.ivory, fontSize: 12.5, lineHeight: 1.5, margin: "0 0 10px" }}>{session.notes}</p>}
          <div style={{ display: "flex", gap: 14 }}>
            <button onClick={onEdit} style={{ background: "none", border: "none", color: C.sage, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Pencil size={13} /> Modifier</button>
            <button onClick={onDelete} style={{ background: "none", border: "none", color: C.danger, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Trash2 size={13} /> Supprimer</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SessionBankScreen({ sessions, onAdd, onUpdate, onDelete }) {
  const [filter, setFilter] = useState("tous");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const filtered = filter === "tous" ? sessions : sessions.filter((s) => s.sportId === filter);
  const editingSession = sessions.find((s) => s.id === editingId);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }}>
        <Chip active={filter === "tous"} onClick={() => setFilter("tous")} color={C.rust}>Tous</Chip>
        {SPORT_OPTIONS.map((s) => <Chip key={s.id} active={filter === s.id} onClick={() => setFilter(s.id)} color={CATEGORY_COLOR[s.category]}>{s.label}</Chip>)}
      </div>

      {!adding && !editingId && (
        <div style={{ marginBottom: 12 }}>
          <PrimaryButton color={C.rust} onClick={() => setAdding(true)}><Plus size={15} /> Ajouter une séance</PrimaryButton>
        </div>
      )}
      {adding && (
        <div style={{ marginBottom: 12 }}>
          <SessionForm onCancel={() => setAdding(false)} onSubmit={(s) => { onAdd(s); setAdding(false); }} />
        </div>
      )}
      {editingSession && (
        <div style={{ marginBottom: 12 }}>
          <SessionForm initial={{ ...editingSession, exercises: (editingSession.exercises || []).join("\n") }} onCancel={() => setEditingId(null)} onSubmit={(patch) => { onUpdate(editingId, patch); setEditingId(null); }} />
        </div>
      )}

      {filtered.length === 0 && <EmptyState text="Aucune séance dans cette catégorie." />}
      {filtered.map((s) => (
        <SessionCard key={s.id} session={s} onEdit={() => { setEditingId(s.id); setAdding(false); }} onDelete={() => onDelete(s.id)} />
      ))}
    </div>
  );
}

// ---------- Stretch ----------
function StretchScreen({ date, setDate, items, onAdd, onDelete }) {
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const totalMin = items.reduce((s, a) => s + Number(a.duration || 0), 0);
  const submit = () => { if (!type.trim() || !duration) return; onAdd({ id: uid(), type: type.trim(), duration: Number(duration), notes: notes.trim() }); setType(""); setDuration(""); setNotes(""); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <DateNav date={date} onChange={setDate} />
      <Card>
        <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.ivory }}>{totalMin} min</div>
        <div style={{ fontSize: 12, color: C.muted }}>d'étirements · {items.length} séance{items.length !== 1 ? "s" : ""}</div>
      </Card>
      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Nouvelle séance</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {STRETCH_PRESETS.map((p) => <Chip key={p.label} active={type === p.label} color={C.sage} onClick={() => setType(p.label)}>{p.label}</Chip>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <TextField placeholder="Type d'étirement" value={type} onChange={(e) => setType(e.target.value)} />
          <TextField type="number" inputMode="numeric" placeholder="Durée (min)" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <TextField placeholder="Notes (optionnel)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}><PrimaryButton color={C.sage} onClick={submit} disabled={!type.trim() || !duration}><Plus size={15} /> Ajouter</PrimaryButton></div>
      </Card>
      <Card>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>Séances du jour</div>
        {items.length === 0 && <EmptyState text="Aucun étirement enregistré." />}
        {items.map((s) => <ListRow key={s.id} title={s.type} subtitle={s.notes || null} right={`${s.duration} min`} onDelete={() => onDelete(s.id)} />)}
      </Card>
    </div>
  );
}

// ---------- Duo (shared progress) ----------
function MiniTrend({ data }) {
  if (data.length < 2) return null;
  return (
    <div style={{ height: 56, marginLeft: -8, marginTop: 6 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`duoGrad-${data[0]?.date}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.sage} stopOpacity={0.4} />
              <stop offset="100%" stopColor={C.sage} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
          <Area type="monotone" dataKey="weight" stroke={C.sage} strokeWidth={2} fill={`url(#duoGrad-${data[0]?.date})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PersonCard({ summary, isMe }) {
  const remaining = summary.calorieGoal ? summary.calorieGoal - summary.caloriesToday : null;
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{isMe ? "Toi" : summary.name}</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: C.ivory }}>
            {summary.currentWeight != null ? summary.currentWeight : "—"}<span style={{ fontSize: 13, color: C.muted, marginLeft: 3 }}>kg</span>
          </div>
        </div>
        {summary.weightGoal && <div style={{ fontSize: 11, color: C.sage, fontFamily: FONT_MONO }}>objectif {summary.weightGoal} kg</div>}
      </div>
      <MiniTrend data={summary.weightTrend || []} />
      <div style={{ display: "flex", gap: 14, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.ivory }}>{summary.caloriesToday ?? 0}</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>{remaining != null ? `kcal · ${remaining >= 0 ? `${remaining} restantes` : `+${-remaining}`}` : "kcal aujourd'hui"}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.ivory }}>{summary.caloriesBurnedToday ?? 0}</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>kcal brûlées</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.ivory }}>{summary.stretchMinutesToday ?? 0} min</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>étirements</div>
        </div>
      </div>
    </Card>
  );
}

function DuoScreen({ mySlug, myName, onOpenSettings }) {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState([]); // [{slug, summary}]

  const load = useCallback(async () => {
    setLoading(true);
    const keys = await listShared("partner-summary:");
    const items = await Promise.all(keys.map(async (k) => ({ slug: k.replace("partner-summary:", ""), summary: await getShared(k) })));
    setPeople(items.filter((p) => p.summary));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!myName) {
    return (
      <Card>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <IconPill Icon={Info} color={C.gold} />
          <div>
            <div style={{ color: C.ivory, fontSize: 14, marginBottom: 4 }}>Ajoute ton prénom pour activer le partage</div>
            <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.5 }}>Va dans les réglages (icône en haut à droite) et renseigne ton prénom. Il sert à identifier tes données partagées.</div>
            <button onClick={onOpenSettings} style={{ marginTop: 10, background: "none", border: "none", color: C.sage, fontSize: 12.5, cursor: "pointer" }}>Ouvrir les réglages →</button>
          </div>
        </div>
      </Card>
    );
  }

  const me = people.find((p) => p.slug === mySlug);
  const others = people.filter((p) => p.slug !== mySlug);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: C.muted, fontSize: 12 }}>Poids, calories et activité du jour, partagés</span>
        <button onClick={load} aria-label="Actualiser" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <RefreshCw size={15} color={C.muted} />
        </button>
      </div>

      <Card style={{ marginBottom: 12, background: C.surfaceAlt }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Info size={14} color={C.muted} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>
            Dans cette version, ces chiffres sont stockés uniquement dans ce navigateur (pas de serveur partagé) — ça ne fonctionne donc que si vous utilisez le même appareil/navigateur. Pour un vrai partage entre deux téléphones, il faudrait ajouter un backend. Ton journal détaillé (aliments, recettes, notes) reste toujours privé.
          </div>
        </div>
      </Card>

      {loading && <EmptyState text="Chargement…" />}
      {!loading && me && <PersonCard summary={me.summary} isMe />}
      {!loading && others.length === 0 && (
        <EmptyState text="Personne d'autre pour l'instant sur cet appareil." />
      )}
      {!loading && others.map((p) => <PersonCard key={p.slug} summary={p.summary} isMe={false} />)}
    </div>
  );
}

// ---------- Settings modal ----------
function SettingsModal({ settings, currentWeight, onClose, onSave }) {
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS, ...settings });
  const set = (patch) => setForm({ ...form, ...patch });

  const previewGoal = calcCalorieGoal({ ...form, autoCalorie: true }, currentWeight);
  const previewProtein = calcProteinGoal({ ...form, autoCalorie: true }, currentWeight);
  const canAutoCalc = currentWeight && form.age && form.height && form.sex;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,16,15,0.6)", display: "flex", alignItems: "flex-end", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ivory }}>Réglages</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={C.muted} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TextField label="Prénom (sert à identifier tes progrès partagés dans l'onglet Duo)" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <TextField label="Objectif de poids (kg)" type="number" value={form.weightGoal || ""} onChange={(e) => set({ weightGoal: e.target.value ? Number(e.target.value) : null })} />

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: form.autoCalorie ? 10 : 0 }}>
              <span style={{ fontSize: 13, color: C.ivory, fontWeight: 500 }}>Calcul automatique des calories</span>
              <input type="checkbox" checked={form.autoCalorie} onChange={(e) => set({ autoCalorie: e.target.checked })} />
            </label>

            {form.autoCalorie ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Chip active={form.sex === "femme"} color={C.sage} onClick={() => set({ sex: "femme" })}>Femme</Chip>
                  <Chip active={form.sex === "homme"} color={C.sage} onClick={() => set({ sex: "homme" })}>Homme</Chip>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <TextField type="number" placeholder="Âge" value={form.age || ""} onChange={(e) => set({ age: e.target.value ? Number(e.target.value) : null })} />
                  <TextField type="number" placeholder="Taille (cm)" value={form.height || ""} onChange={(e) => set({ height: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Niveau d'activité</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ACTIVITY_LEVELS.map((a) => <Chip key={a.id} active={form.activityLevel === a.id} color={C.sage} onClick={() => set({ activityLevel: a.id })}>{a.label}</Chip>)}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Rythme de perte</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {DEFICIT_LEVELS.map((d) => <Chip key={d.id} active={form.deficitLevel === d.id} color={C.sage} onClick={() => set({ deficitLevel: d.id })}>{d.label}</Chip>)}
                </div>

                {canAutoCalc ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: C.surfaceAlt, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, color: C.muted }}>Calories</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.gold }}>{previewGoal}</div>
                    </div>
                    <div style={{ flex: 1, background: C.surfaceAlt, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, color: C.muted }}>Protéines</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.sage }}>{previewProtein}g</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}>Renseigne ton sexe, âge, taille, et ajoute une pesée pour calculer ton objectif.</div>
                )}
                <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.5 }}>
                  Calories estimées via Mifflin-St Jeor, protéines via 1,8g/kg pour préserver le muscle — l'idée est de viser la perte de graisse, pas juste la perte de poids sur la balance. Valeurs indicatives, pas un avis médical.
                </div>
              </div>
            ) : (
              <TextField label="Objectif de calories quotidien (kcal)" type="number" value={form.calorieGoal || ""} onChange={(e) => set({ calorieGoal: e.target.value ? Number(e.target.value) : null })} />
            )}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 13, color: C.ivory, fontWeight: 500, marginBottom: 6 }}>Reconnaissance photo (optionnel)</div>
            <TextField label="Clé API Anthropic" type="password" placeholder="sk-ant-..." value={form.anthropicApiKey || ""} onChange={(e) => set({ anthropicApiKey: e.target.value })} />
            <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.5, marginTop: 6 }}>
              Nécessaire uniquement pour les boutons "Depuis une photo". Ta clé reste stockée sur cet appareil (jamais envoyée à un serveur tiers), mais elle est visible dans le trafic réseau du navigateur — n'utilise cette appli qu'en local, pas sur un site public partagé, et surveille l'usage de ta clé sur console.anthropic.com.
            </div>
          </div>

          <div style={{ marginTop: 6 }}>
            <PrimaryButton onClick={() => onSave(form)}><Check size={15} /> Enregistrer</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
