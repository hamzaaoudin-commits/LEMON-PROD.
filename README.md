# 🍋 Lemon Prod — site web

Site vitrine statique pour Lemon Prod (manuels opérationnels IA, 50+ métiers).
Pur HTML / CSS / JS — aucune dépendance, aucun build. Déployable tel quel sur **GitHub Pages** et **Vercel**.

```
lemon-prod/
├── index.html      ← page unique (toutes les sections)
├── styles.css      ← design system (monolithe sombre + zest éditorial)
├── script.js       ← nav mobile, copie protocole, reveal, formulaire
├── favicon.svg     ← marque citron
├── vercel.json     ← config Vercel (clean URLs + headers)
└── README.md
```

---

## Déploiement

### Option A — Vercel (recommandé, le plus rapide)

1. Pousse ce dossier sur un repo GitHub (voir plus bas).
2. Sur [vercel.com](https://vercel.com) → **Add New → Project** → importe le repo.
3. Framework Preset : **Other**. Build command : *(vide)*. Output directory : `.` (racine).
4. **Deploy.** Vercel sert `index.html` directement. Domaine custom : *Settings → Domains*.

> Tu peux aussi simplement faire glisser le dossier sur [vercel.com/new](https://vercel.com/new) sans repo.

### Option B — GitHub Pages

```bash
cd lemon-prod
git init
git add .
git commit -m "Lemon Prod — site v1"
git branch -M main
git remote add origin https://github.com/<ton-user>/lemon-prod.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Source : Deploy from a branch → `main` / `root` → Save.**
Le site sera en ligne sur `https://<ton-user>.github.io/lemon-prod/` en ~1 min.

> `vercel.json` est ignoré par GitHub Pages, aucun souci.

---

## À personnaliser avant de publier

| Quoi | Où |
|------|----|
| **Email de contact** | `index.html` → `mailto:contact@lemonprod.co` (footer) |
| **Liens Instagram / LinkedIn** | `index.html` → footer (`href="#"`) |
| **Boutons "Voir la collection"** | pointe-les vers tes pages produit Lemon Squeezy / Gumroad |
| **Formulaire « 10 protocoles »** | `index.html` → `#leadForm`. Branche-le à ton outil d'emailing (voir ci-dessous) |
| **Politique de remboursement** | FAQ — aligne le texte sur tes vraies CGV |
| **Image OG** | ajoute `og-image.png` (1200×630) et décommente la balise dans `<head>` |
| **Mentions légales / CGV / Confidentialité** | footer (`href="#"`) — crée les pages |

### Brancher le formulaire d'emailing
Le plus simple, sans backend : remplace la balise `<form id="leadForm">` par un embed de ton outil
(Brevo, MailerLite, ConvertKit, Beehiiv…), **ou** change l'`action` du formulaire pour pointer vers
leur endpoint. Le `script.js` ne fait aujourd'hui qu'une validation côté client (démo).

---

## Notes honnêtes (à garder en tête)

- **Aucun faux témoignage / chiffre inventé** n'a été mis sur la page. La preuve produit (« 2 h → 9 min »)
  est un *exemple* — remplace-la par un cas réel quand tu en auras un. Si tu ajoutes des témoignages,
  qu'ils soient réels : c'est ce qui tient face à un acheteur de métier réglementé.
- La promesse est volontairement formulée en **levier** (« on supprime la page blanche »), pas en
  **précision** (« 100 % exact »). C'est plus vrai, plus défendable juridiquement, et plus premium.
- Langue : **FR** (marché francophone, marges Élite). Pour une version EN des métiers universels,
  duplique `index.html` en `/en/` et traduis — la structure est identique.

---

*Design : monolithe sombre cinématographique (#0a0a0a), accent jaune zest employé avec parcimonie
(filets, folios, mot-clé du hero, prix vedette). Typo : Playfair Display (display) · DM Sans (texte) ·
JetBrains Mono (labels) — les fondations du site Strawberry, transposées en territoire citron.
Hero à révélation ligne par ligne, structure éditoriale à filets. Responsive, accessible,
`prefers-reduced-motion` respecté.*
