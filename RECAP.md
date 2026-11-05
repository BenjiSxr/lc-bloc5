# Récapitulatif du travail effectué

Application de blog : React (Vite), Node.js/Express et MySQL.
État au 5 novembre 2026.

## En résumé

- Le problème Docker a été diagnostiqué : il venait du réseau, pas du fichier compose.
- Les commentaires ont été ajoutés de bout en bout : table, API et interface.
- L'application a été préparée pour Vercel : variables d'environnement, images sur Vercel Blob et réécriture des routes du front.
- L'application a été déployée sur Vercel en deux projets, `server` et `client`.
- **Restent ouverts :** les envois d'images en production et le compte admin par défaut. Voir [Reste à faire](#reste-à-faire).


## 2. Commentaires côté base de données

La table `comments` a été ajoutée dans `server/config/db.js`, avec :

- `id`, `content`, `article_id`, `user_id` et `created_at` ;
- des clés étrangères `ON DELETE CASCADE` vers `articles` et `users`.

**Écart avec l'énoncé :** `article_id` et `user_id` sont en `NOT NULL`, pour éviter un commentaire sans article ou sans auteur.

## 3. Commentaires côté API

Fichiers : `server/controllers/comments.controller.js`, `server/routes/comments.routes.js` et `server/server.js`.

| Méthode | URL | Connexion | Rôle |
|---|---|---|---|
| GET | `/api/comments/article/:articleId` | Non | Liste les commentaires d'un article |
| POST | `/api/comments/article/:articleId` | Oui | Ajoute un commentaire et le renvoie complet |
| PUT | `/api/comments/:id` | Oui, auteur uniquement | Modifie un commentaire |
| DELETE | `/api/comments/:id` | Oui, auteur uniquement | Supprime un commentaire |

**Corrections apportées au contrôleur de départ :**

- Le `INSERT` permettait une injection SQL.

## 4. Commentaires côté interface

Fichiers : `client/src/components/CommentCard.jsx` et `client/src/pages/ArticleDetail.jsx`.

- Une zone de saisie apparaît sur la page d'un article, avec la liste des commentaires en dessous.
- Un visiteur non connecté voit un lien vers la page de connexion.
- L'auteur d'un commentaire voit les boutons **Modifier** et **Supprimer**. La modification se fait directement dans la carte.
- La liste se met à jour sans être rechargée.

## 5. Droits d'accès

- La vérification du propriétaire existait déjà pour les articles et les profils, et elle a été ajoutée pour les commentaires.

## 6. Préparation au déploiement

### Git

Un `.gitignore` a été ajouté à la racine. Il exclut notamment les fichiers `.env`, `node_modules`, `dist` et `.vercel`.

### Variables d'environnement

| Variable | Projet | Rôle |
|---|---|---|
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `server` | Connexion à MySQL (déjà existantes) |
| `DB_PORT` | `server` | Port MySQL (nouvelle) |
| `DB_CA` | `server` | Certificat CA ; active le SSL quand il est renseigné (nouvelle) |
| `JWT_SECRET` | `server` | Signature des tokens de connexion (déjà existante) |
| `BLOB_READ_WRITE_TOKEN` | `server` | Accès à Vercel Blob (nouvelle) |
| `VITE_API_URL` | `client` | URL de l'API (nouvelle) |

Des fichiers `.env.example` ont été ajoutés dans `server/` et `client/`.

### URL dans le front

- `client/src/api/axios.js` lit maintenant `VITE_API_URL`.
- Une fonction `getAssetUrl()` remplace les 8 URL d'images écrites en dur, dont la plupart pointaient vers le mauvais port (5000 au lieu de 5030).

### Images avec Vercel Blob

- `server/middleware/upload.js` garde le fichier en mémoire, avec une limite de 4 Mo, car Vercel refuse les requêtes de plus de 4,5 Mo.
- `server/config/blob.js` envoie le fichier sur Vercel Blob et renvoie son URL publique.
- La route statique `/uploads` a été retirée de `server/server.js`.

### Réécriture des routes

`client/vercel.json` renvoie `index.html` pour toutes les routes, afin qu'actualiser une page comme `/article/5` ne donne pas une erreur 404.

## 7. Bugs corrigés au passage

- **Injection SQL dans `createArticle` :** la requête est maintenant paramétrée.
- **Chemin d'image cassé dans `updateArticle` :** le chemin `/ uploads / ...` contenait des espaces.

## 8. Déploiement sur Vercel

Le dépôt GitHub et les projets Vercel `server` et `client` sont en place.

**Vérifié en ligne :**

- L'API répond, et `/api/articles` renvoie les articles depuis la base.
- Le front pointe vers la bonne API.
- Les variables d'environnement attendues existent sur le projet `server`.

**Problème en cours : les envois d'images.**

- **Cause très probable :** le seul déploiement de `server` a été créé juste avant l'ajout des variables Blob, et Vercel ne les applique qu'aux déploiements suivants.
- **Solution :** redéployer le projet `server`.
- **Limite :** cette cause n'a pas été confirmée par un envoi réel en production.

## Tests réalisés

| Sujet | Méthode | Résultat |
|---|---|---|
| Suppressions en cascade | Transaction annulée sur MySQL | Réussi |
| Routes de l'API | Requêtes sur un vrai serveur | Réussi |
| Interface des commentaires | Navigateur Chrome automatisé | Réussi |
| Refus pour un autre utilisateur | Requêtes avec un second compte | Réussi |
| URL du front | Navigateur Chrome automatisé | Réussi |
| Connexion SSL à MySQL | MySQL Docker local | Réussi |
| Envoi d'images | Vrai SDK, fausse API Blob locale | Réussi |

**Non testé :**

- un envoi réel vers Vercel Blob ;
- le comportement de `client/vercel.json` en ligne.

Les scripts de test étaient temporaires et ne font pas partie du projet.

## Reste à faire

### Urgent

1. **Changer le mot de passe du compte admin en production.** Le compte par défaut existe très probablement, et son mot de passe est écrit dans le README, qui est sur GitHub.
2. **Retirer ce mot de passe du README**, puis désactiver la création automatique de ce compte en production.
3. **Redéployer le projet `server`**, puis tester l'envoi d'une image.
4. **Vérifier que le store Blob est en accès Public.** Ce réglage n'a pas pu être contrôlé.

### À vérifier

5. Sur le site en ligne, actualiser une page d'article pour contrôler `client/vercel.json`.
6. Ajouter `BLOB_READ_WRITE_TOKEN` à `server/.env` pour envoyer des images en local. Ce store serait partagé avec la production, sauf si un second est créé.

### Améliorations possibles

- Renvoyer `401` au lieu de `403` quand le token est absent (`server/middleware/auth.js`).
- Renvoyer un message d'erreur clair quand un fichier est refusé. La réponse actuelle est une erreur 500 en HTML.
- Supprimer les anciennes images de Blob quand on les remplace ou qu'on supprime un article.
- Corriger les 2 erreurs ESLint de `client/src/context/AuthContext.jsx`.
- Permettre à l'auteur d'un article de modérer les commentaires, si besoin.
