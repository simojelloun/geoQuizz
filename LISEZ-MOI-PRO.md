# Geo Quizz Pro : mise en service

Le jeu est prêt. Pro reste invisible à l'achat tant que les clés RevenueCat de `config.js` sont vides : rien ne change pour les joueurs avant la fin de ces étapes.

## Ce que fait Pro

- Parties illimitées : plus de jetons pour lancer une partie.
- Niveaux Très difficile et Expert : réservés à Pro, et toujours débloqués par l'XP.
- 30 gemmes offertes chaque mois, et trois articles Pro dans la boutique : la couleur Royal, l'emblème Couronne et le cadre Pro.
- Outils enseignant : donner des devoirs à ses groupes et voir les résultats. Les élèves, eux, font les devoirs gratuitement à n'importe quel niveau.
- Une couronne à côté du pseudo dans les classements.

Le jeu reste gratuit. Pro s'achète dans l'app iPhone ou Android. Sur le site web, la page Pro renvoie vers les apps, et un abonnement acheté sur le téléphone marche aussi sur le site avec le même compte.

## Le circuit d'un achat

1. Le joueur paie dans l'app, à Apple ou à Google.
2. RevenueCat vérifie l'achat et prévient la fonction `rcWebhook` (dossier `functions`).
3. La fonction écrit la date de fin dans Firebase, sous `pro/<identifiant du joueur>`.
4. Le jeu lit cette date. Les règles Firebase s'en servent aussi : un joueur ne peut ni s'offrir Pro, ni afficher une fausse couronne, ni donner des devoirs sans Pro.

## Étape 1 · Firebase : passer au forfait Blaze

La fonction a besoin du forfait Blaze, payé à l'usage. Pour un jeu de cette taille, ça reste à 0 € dans la pratique.

1. Console Firebase › roue dentée › Utilisation et facturation › Détails et paramètres › Modifier le forfait › Blaze.
2. Crée tout de suite une alerte de budget à 1 € (Google Cloud › Facturation › Budgets et alertes).

## Étape 2 · App Store Connect

1. Accords, taxes et services bancaires : signe l'accord « Paid Apps » et remplis les informations bancaires et fiscales.
2. Inscris-toi au Small Business Program d'Apple : la commission passe de 30 % à 15 %.
3. Dans ton app › Abonnements : crée un groupe « Geo Quizz Pro » avec deux abonnements à renouvellement automatique :
   - `gq_pro_monthly`, 1 mois, par exemple 1,99 €
   - `gq_pro_yearly`, 1 an, par exemple 14,99 €
4. Pour chacun, ajoute un nom affiché et une description en français, anglais et arabe, ainsi qu'une capture de l'écran Pro pour l'examen.
5. Crée une clé « In-App Purchase » (Utilisateurs et accès › Intégrations) : RevenueCat en a besoin.

## Étape 3 · RevenueCat (gratuit jusqu'à 2 500 $ de revenus par mois)

1. Crée un compte sur revenuecat.com, puis un projet « Geo Quizz ».
2. Ajoute l'app iOS (identifiant du kit, par exemple `com.osh.geoquizz`) avec la clé In-App Purchase de l'étape 2.
3. Produits : importe `gq_pro_monthly` et `gq_pro_yearly`.
4. Entitlements : crée `pro` (exactement ce nom) et attache-lui les deux produits.
5. Offerings : dans l'offre `default` (marquée « current »), ajoute deux paquets, « Monthly » avec `gq_pro_monthly` et « Annual » avec `gq_pro_yearly`.
6. API keys :
   - copie la clé publique iOS (`appl_…`) dans `config.js`, ligne `rcIos` ;
   - crée une clé secrète v1 (`sk_…`) pour l'étape 4. Elle ne va jamais dans le jeu ni sur GitHub.

## Étape 4 · Installer la fonction `rcWebhook`

Le plus simple : Console Firebase › bouton Cloud Shell (en haut à droite). Envoie-y le dossier `pro-serveur` (menu ⋮ › Importer), puis tape :

```
cd pro-serveur
npm install --prefix functions
firebase use geoquizz-5c149
firebase functions:secrets:set RC_SECRET_KEY
firebase functions:secrets:set RC_WEBHOOK_AUTH
firebase deploy --only functions
```

- `RC_SECRET_KEY` : colle la clé secrète `sk_…`.
- `RC_WEBHOOK_AUTH` : invente une longue phrase secrète (par exemple 40 caractères au hasard) et garde-la pour l'étape 5.
- `--only functions` ne touche ni aux règles ni aux données.

À la fin, la commande affiche une adresse du type `https://europe-west1-geoquizz-5c149.cloudfunctions.net/rcWebhook`.

## Étape 5 · Relier RevenueCat à la fonction

RevenueCat › Integrations › Webhooks › Add :

- URL : l'adresse de l'étape 4 ;
- Authorization header : la phrase secrète `RC_WEBHOOK_AUTH` ;
- Environment : Production et Sandbox.

Clique sur « Send test event » : la réponse doit être 200.

## Étape 6 · Règles Firebase

Le fichier `firebase-rules.json` ajoute trois choses aux règles actuelles :

- le nœud `pro` : chaque joueur lit seulement le sien, et seuls les administrateurs (et la fonction) écrivent ;
- le champ `pr` des joueurs : la couronne ne peut pas dépasser la vraie date de fin ;
- les devoirs : il faut Pro pour en donner, mais on peut toujours en retirer.

Claude peut les publier pour toi dans la console, avec ton accord.

## Étape 7 · L'app iPhone (kit Capacitor)

Dans le dossier du kit iOS, sur le Mac :

```
npm install @revenuecat/purchases-capacitor
npx cap sync ios
```

Ensuite :

1. Copie le nouveau `index.html` et `config.js` (avec `rcIos`) dans le dossier web du kit, comme pour les mises à jour précédentes.
2. Dans Xcode, ouvre la cible de l'app › Signing & Capabilities › + Capability › In-App Purchase.
3. Pour tester, crée un compte « Sandbox » dans App Store Connect (Utilisateurs et accès › Sandbox), puis passe par TestFlight.

Pour Android plus tard : `npx cap add android`, abonnements `gq_pro_monthly` et `gq_pro_yearly` dans la Play Console, app Android dans RevenueCat, puis clé `goog_…` dans `rcAndroid`.

## Étape 8 · Vérifier

1. Abonne-toi avec le compte Sandbox dans l'app TestFlight.
2. Console Firebase › Realtime Database : `pro/<ton identifiant>` apparaît avec une date `u`.
3. Tableau de bord du jeu › Joueurs : la colonne Pro montre une couronne, et « abonnés Pro » compte 1.

Le tableau de bord permet aussi d'offrir Pro pendant un an : fiche du joueur › « Offrir Pro pendant 1 an ». C'est utile pour un collègue enseignant ou pour le compte de démonstration d'Apple.

## Fiche App Store et examen

- **Description** : termine-la par « Abonnement Geo Quizz Pro : 1,99 € par mois ou 14,99 € par an, renouvelé automatiquement. Conditions d'utilisation : https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ »
- **Politique de confidentialité** : URL `…/geoQuizz/confidentialite.html`. La page mentionne maintenant l'abonnement et RevenueCat.
- **Notes pour l'examen** :
  - indique où se trouve l'écran Pro (accueil › bouton Pro, ou Réglages › Geo Quizz Pro) ;
  - précise que l'achat se teste en Sandbox ;
  - pour le compte de démonstration, ajoute « Pro offert » si tu veux montrer les outils enseignant.
- **Valeur continue** : Apple refuse parfois les abonnements qui ne font que débloquer des fonctions. Mets en avant ce qui se renouvelle : les 30 gemmes mensuelles, les devoirs pour la classe, et les nouveautés que tu ajoutes.
