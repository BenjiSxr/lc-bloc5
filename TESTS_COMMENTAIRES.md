# Procédure de test : commentaires

Cette procédure vérifie la fonctionnalité de commentaires du blog, côté API puis côté client, en environnement local.

| Campagne | |
|---|---|
| Date | |
| Testeur | |
| Commit testé | |
| Résultat global | OK / KO |

## 1. Préparation

### Prérequis

- Docker Desktop, Node.js et Git Bash sont installés.
- Les dépendances sont installées à la racine, dans `client/` et dans `server/` (`npm install`).
- `server/.env` et `client/.env` existent, à partir des fichiers `.env.example`.

Les tests n'envoient pas d'image, donc aucun token Vercel Blob n'est nécessaire.

### Démarrer l'application

Depuis la racine du projet, dans deux terminaux :

```text
cd server && docker compose up -d
npm run dev
```

Attendus :

- l'API répond sur `http://localhost:5030` ;
- le client est disponible à l'adresse affichée par Vite, en général `http://localhost:5173`.

Redémarrez `npm run dev` après toute modification du serveur, car il ne se recharge pas tout seul.

## 2. Tests de l'API

Exécutez les blocs dans l'ordre, dans **un même terminal Git Bash**, car ils partagent des variables.

### Mise en place

Ce bloc crée deux utilisateurs, A et B, puis un article appartenant à A.

```bash
API=http://localhost:5030/api
JSON='Content-Type: application/json'
req() { curl -s -w '\n[HTTP %{http_code}]\n' "$@"; }
get() { node -pe "JSON.parse(require('fs').readFileSync(0)).$1"; }
sql() { docker exec blog_mysql_dev mysql -uroot blog_db -N -e "$1"; }

sql "DELETE FROM users WHERE email LIKE '%@test.local';"

for U in a b; do
  curl -s -o /dev/null -X POST "$API/auth/register" -H "$JSON" \
    -d "{\"username\":\"test_$U\",\"email\":\"test_$U@test.local\",\"password\":\"Test1234!\"}"
done

TOKEN_A=$(curl -s -X POST "$API/auth/login" -H "$JSON" \
  -d '{"email":"test_a@test.local","password":"Test1234!"}' | get token)
TOKEN_B=$(curl -s -X POST "$API/auth/login" -H "$JSON" \
  -d '{"email":"test_b@test.local","password":"Test1234!"}' | get token)
ARTICLE_ID=$(curl -s -X POST "$API/articles" -H "Authorization: Bearer $TOKEN_A" \
  -F "title=Article de test" -F "content=Contenu de test" | get id)

echo "Article : $ARTICLE_ID"
```

Attendu : un numéro d'article s'affiche, sans erreur.

### Lire et créer

```bash
echo "--- A1"; req "$API/comments/article/$ARTICLE_ID"

echo "--- A2"; RAW=$(curl -s -X POST "$API/comments/article/$ARTICLE_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{"content":"Premier commentaire"}')
echo "$RAW"; COMMENT_ID=$(echo "$RAW" | get id)

echo "--- A3"; req "$API/comments/article/$ARTICLE_ID"

echo "--- A4"; req -X POST "$API/comments/article/$ARTICLE_ID" -H "$JSON" -d '{"content":"x"}'

echo "--- A5"; req -X POST "$API/comments/article/$ARTICLE_ID" \
  -H "Authorization: Bearer invalide" -H "$JSON" -d '{"content":"x"}'

echo "--- A6"; req -X POST "$API/comments/article/$ARTICLE_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{"content":"   "}'

echo "--- A7"; req -X POST "$API/comments/article/$ARTICLE_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{}'

echo "--- A8"; req -X POST "$API/comments/article/999999999" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{"content":"x"}'

echo "--- A9"; req -X POST "$API/comments/article/$ARTICLE_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" \
  -d "{\"content\":\"'); DROP TABLE comments; --\"}"
sql "SHOW TABLES LIKE 'comments';"
```

| ID | Cas testé | Code | Réponse attendue | OK/KO |
|---|---|---|---|---|
| A1 | Liste d'un article sans commentaire, sans connexion | 200 | `[]` | |
| A2 | Création par un utilisateur connecté | 201 (non affiché) | Commentaire complet : `id`, `content`, `article_id`, `user_id`, `created_at`, `username`, `avatar` | |
| A3 | Liste après création | 200 | Tableau d'un commentaire, avec `username` à `test_a` et le bon `id` | |
| A4 | Création sans token | 403 | `No token provided` | |
| A5 | Création avec un token invalide | 401 | `Unauthorized` | |
| A6 | Contenu composé d'espaces | 400 | `Content is required` | |
| A7 | Contenu absent | 400 | `Content is required` | |
| A8 | Article inexistant | 404 | `Article not found` | |
| A9 | Tentative d'injection SQL | 201 | Texte enregistré tel quel, et la table `comments` existe toujours | |

### Modifier

```bash
echo "--- A10"; req -X PUT "$API/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN_B" -H "$JSON" -d '{"content":"Pirate"}'

echo "--- A11"; req -X PUT "$API/comments/$COMMENT_ID" -H "$JSON" -d '{"content":"x"}'

echo "--- A12"; req -X PUT "$API/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{"content":""}'

echo "--- A13"; req -X PUT "$API/comments/999999999" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{"content":"x"}'

echo "--- A14"; req -X PUT "$API/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{"content":"Commentaire modifie"}'
sql "SELECT content FROM comments WHERE id = $COMMENT_ID;"
```

| ID | Cas testé | Code | Réponse attendue | OK/KO |
|---|---|---|---|---|
| A10 | Modification par un autre utilisateur | 403 | `Forbidden` | |
| A11 | Modification sans token | 403 | `No token provided` | |
| A12 | Contenu vide | 400 | `Content is required` | |
| A13 | Commentaire inexistant | 404 | `Comment not found` | |
| A14 | Modification par l'auteur | 200 | `Comment updated successfully`, et `Commentaire modifie` en base | |

### Supprimer

```bash
echo "--- A15"; req -X DELETE "$API/comments/$COMMENT_ID" -H "Authorization: Bearer $TOKEN_B"

echo "--- A16"; req -X DELETE "$API/comments/$COMMENT_ID"

echo "--- A17"; req -X DELETE "$API/comments/$COMMENT_ID" -H "Authorization: Bearer $TOKEN_A"

echo "--- A18"; req -X DELETE "$API/comments/$COMMENT_ID" -H "Authorization: Bearer $TOKEN_A"
```

| ID | Cas testé | Code | Réponse attendue | OK/KO |
|---|---|---|---|---|
| A15 | Suppression par un autre utilisateur | 403 | `Forbidden` | |
| A16 | Suppression sans token | 403 | `No token provided` | |
| A17 | Suppression par l'auteur | 200 | `Comment deleted successfully` | |
| A18 | Commentaire déjà supprimé | 404 | `Comment not found` | |

### Suppressions en cascade

```bash
echo "--- A19"; COMMENT_B=$(curl -s -X POST "$API/comments/article/$ARTICLE_ID" \
  -H "Authorization: Bearer $TOKEN_B" -H "$JSON" -d '{"content":"Commentaire de B"}' | get id)
sql "DELETE FROM users WHERE email = 'test_b@test.local';"
sql "SELECT COUNT(*) FROM comments WHERE id = $COMMENT_B;"

echo "--- A20"; curl -s -o /dev/null -X POST "$API/comments/article/$ARTICLE_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "$JSON" -d '{"content":"Commentaire de A"}'
req -X DELETE "$API/articles/$ARTICLE_ID" -H "Authorization: Bearer $TOKEN_A"
sql "SELECT COUNT(*) FROM comments WHERE article_id = $ARTICLE_ID;"
```

| ID | Cas testé | Résultat attendu | OK/KO |
|---|---|---|---|
| A19 | Suppression d'un utilisateur | `0` : son commentaire est supprimé | |
| A20 | Suppression d'un article | Code 200 puis `0` : ses commentaires sont supprimés | |


## 3. Tests du client

### Mise en place

1. Ouvrez le client et créez les comptes `test_a@test.local` et `test_b@test.local` depuis la page d'inscription, avec le mot de passe `Test1234!`.
2. Connecté en tant que A, publiez un article nommé `Article de test`, sans image.
3. Copiez l'URL de cet article, de la forme `/article/<id>`.
4. Déconnectez-vous.

### Visiteur non connecté

| ID | Action | Résultat attendu | OK/KO |
|---|---|---|---|
| C1 | Ouvrir l'article | La section `Commentaires (0)` et le texte `Aucun commentaire pour le moment.` s'affichent | |
| C2 | Observer le formulaire | Il n'y a pas de zone de saisie, mais le message `Connectez-vous pour laisser un commentaire.` | |
| C3 | Cliquer sur `Connectez-vous` | La page de connexion s'ouvre | |

### Ajouter un commentaire (utilisateur A)

Connectez-vous en tant que A et revenez sur l'article.

| ID | Action | Résultat attendu | OK/KO |
|---|---|---|---|
| C4 | Observer la section | La zone de saisie et le bouton `Publier le commentaire` s'affichent | |
| C5 | Publier avec le champ vide | Le navigateur demande de remplir le champ, et rien n'est publié | |
| C6 | Publier uniquement des espaces | Rien n'est publié et le compteur ne change pas | |
| C7 | Publier `Premier commentaire` | La carte apparaît sans recharger la page, avec l'auteur et la date. Le compteur passe à 1 et le champ se vide | |
| C8 | Attendre 2 secondes, puis publier `Deuxième commentaire` | Il apparaît au-dessus du premier, et le compteur passe à 2 | |
| C9 | Publier un texte sur deux lignes | Le retour à la ligne est conservé | |
| C10 | Publier `<b>test</b>` | Le texte s'affiche tel quel, sans passer en gras | |
| C11 | Actualiser la page (F5) | Les commentaires et leur ordre sont conservés | |
| C12 | Cliquer sur le nom de l'auteur d'un commentaire | Son profil s'ouvre | |

### Modifier et supprimer (utilisateur A)

> **Attention :** A est aussi l'auteur de l'article, qui a ses propres boutons `Modifier` et `Supprimer` en haut de la page. Dans les tests ci-dessous, utilisez toujours ceux de la **carte du commentaire**.

| ID | Action | Résultat attendu | OK/KO |
|---|---|---|---|
| C13 | Observer les cartes de A | Chacune affiche `Modifier` et `Supprimer` | |
| C14 | Cliquer sur `Modifier` | Un champ apparaît avec le texte actuel, ainsi que `Enregistrer` et `Annuler` | |
| C15 | Changer le texte, puis cliquer sur `Annuler` | L'ancien texte s'affiche à nouveau | |
| C16 | Rouvrir `Modifier` | Le champ contient le texte d'origine, sans le texte abandonné | |
| C17 | Remplacer le texte par des espaces, puis cliquer sur `Enregistrer` | Le champ reste ouvert et rien n'est modifié | |
| C18 | Saisir `Texte modifié`, puis cliquer sur `Enregistrer` | Le nouveau texte s'affiche et le champ se ferme | |
| C19 | Actualiser la page (F5) | `Texte modifié` est conservé | |
| C20 | Cliquer sur `Supprimer`, puis annuler la confirmation | Le commentaire reste affiché | |
| C21 | Cliquer sur `Supprimer`, puis confirmer | La carte disparaît sans recharger la page, et le compteur baisse de 1 | |
| C22 | Actualiser la page (F5) | Le commentaire ne revient pas | |

### Droits selon l'utilisateur

Laissez au moins un commentaire de A, puis connectez-vous en tant que B et ouvrez l'article.

| ID | Action | Résultat attendu | OK/KO |
|---|---|---|---|
| C23 | Observer les cartes de A | Il n'y a ni `Modifier` ni `Supprimer` | |
| C24 | Publier un commentaire | Il apparaît avec les boutons `Modifier` et `Supprimer` | |
| C25 | Se déconnecter et rouvrir l'article | Les commentaires restent visibles, sans aucun bouton | |
| C26 | Se connecter en tant que A, l'auteur de l'article | Il n'y a pas de bouton sur le commentaire de B | |

### Erreurs de l'API

Connecté en tant que A, sur l'article, ouvrez les outils de développement (F12), puis l'onglet **Console**, et exécutez :

```js
localStorage.setItem('token', 'invalide');
```

Sans actualiser la page :

| ID | Action | Résultat attendu | OK/KO |
|---|---|---|---|
| C27 | Publier un commentaire | Message `Erreur lors de la publication du commentaire`, et le texte saisi reste dans le champ | |
| C28 | Modifier un commentaire et enregistrer | Message `Erreur lors de la modification du commentaire`, et le champ reste ouvert avec le texte saisi | |
| C29 | Annuler, puis supprimer un commentaire et confirmer | Message `Erreur lors de la suppression du commentaire`, et le commentaire reste affiché | |

Déconnectez-vous ensuite pour effacer le token invalide.





## `CommentCard.jsx` (nouveau composant)

Chaque commentaire est affiché par un composant dédié, sur le modèle d'`ArticleCard`, pour isoler son affichage et sa logique et alléger la page de l'article. Chaque carte gère son propre état de modification avec `useState` : on peut ainsi modifier un commentaire sans affecter les autres. Le composant utilise `useAuth` pour savoir si l'utilisateur connecté en est l'auteur, sans transmettre cette information par les props, et n'affiche Modifier et Supprimer que dans ce cas. Il réutilise la classe `glass`, les icônes `lucide-react` et le style des boutons de l'article pour rester cohérent avec le design, ainsi que l'instance `API` d'axios, qui ajoute automatiquement le token aux requêtes. `Link` de React Router permet d'ouvrir le profil de l'auteur sans recharger la page.

## `ArticleDetail.jsx` (page modifiée)

La section Commentaires est placée dans la page de l'article, car elle dépend directement de l'article affiché. La liste est conservée dans le composant parent : elle y est partagée entre le formulaire et les cartes, qui la mettent à jour grâce aux props onUpdate et onDelete. Un useEffect charge les commentaires à l'ouverture de la page et lorsque l'identifiant de l'article change, sur le même modèle que le chargement de l'article. Les actions suivantes mettent à jour la liste localement : on évite ainsi de nouveaux appels à l'API, et l'affichage reste immédiat. Le formulaire n'apparaît que pour un utilisateur connecté, car l'API exige un token pour publier, et les états de chargement, d'absence de commentaire et d'erreur informent toujours l'utilisateur de ce qui se passe.
