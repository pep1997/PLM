# PLM — site vitrine

Site de **PLM, logiciels de gestion** — <https://plmgestion.com>

Neuf logiciels de gestion pour les entreprises et institutions
ivoiriennes : clinique, hôtel, restaurant, maquis, dépôt de boissons,
boutique, magasin, école, comptabilité. Installés sur les postes du
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

Les prix, les numéros de téléphone et les textes se modifient dans
`Site PLM2\contenu.js` — et nulle part ailleurs. Puis :

```bash
# depuis « Desktop\Site PLM » :
node v2/_construire.js --publier     # refabrique les pages
node v2/_deployer.js                 # copie ici pages + images citées
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
