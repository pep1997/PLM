# PLM — site vitrine

Site de **PLM, logiciels de gestion** — <https://plmgestion.com>

Cinq logiciels de gestion pour les entreprises ivoiriennes : clinique,
restaurant, maquis, dépôt de boissons, boutique. Installés sur le PC du
client, sans internet, sans abonnement.

---

## Ce dépôt ne contient pas le code source

Il contient **le site construit**, tel qu'il est servi : la page minifiée,
les images optimisées, et rien d'autre. Le dossier de travail — feuilles de
style lisibles, scripts de fabrication, captures d'origine en 4500 px — n'est
pas ici.

Ce n'est pas un oubli. GitHub Pages, sur un compte gratuit, ne publie que
depuis un dépôt public : n'y mettre que ce qui est réellement servi est la
seule façon de ne pas exposer le reste.

## Ne rien modifier ici

Tout ce dossier est **écrit par un script**. Une correction faite directement
dans ces fichiers sera écrasée à la publication suivante, sans avertissement.

Les modifications se font dans le dossier de travail, puis :

```bash
node assets/_publier.js --vers "<chemin vers ce dépôt>"
git add -A && git commit -m "Mise à jour du site" && git push
```

## Le fichier CNAME

Il porte le domaine servi. **Ne pas le supprimer** : GitHub le lit comme la
source de vérité du domaine personnalisé, et un déploiement qui ne le
contient pas désactive le réglage — le site retombe sur l'adresse
`github.io` sans que rien ne le signale.

---

© 2026 M. Pepalla. Tous droits réservés.

Le contenu de ce site — textes, captures d'écran, mise en page — et les
logiciels qu'il présente sont protégés par le droit d'auteur. Les captures
présentent des **données de démonstration entièrement fictives** : aucun
patient, client, employé ni chiffre d'affaires réel n'y figure.
