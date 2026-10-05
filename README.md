# Douceurs du Gabon

Site de commande de gâteaux en FCFA, avec catalogue public et tableau de bord administrateur. L’application est conçue pour être publiée sur Vercel et utilise Supabase pour les comptes, la base de données et les photos.

## Mise en ligne

1. Créez un projet Supabase et copiez l’URL du projet ainsi que sa clé publique (publishable/anon).
2. Dans **Supabase → SQL Editor**, exécutez `supabase/schema.sql`.
3. Créez le compte administrateur dans **Supabase → Authentication → Users**. Copiez son identifiant, puis exécutez :

   ```sql
   update public.profiles set role = 'admin' where id = 'IDENTIFIANT-UUID-DU-COMPTE';
   ```

4. Publiez le code dans un dépôt Git, puis importez-le dans Vercel. Dans **Project Settings → Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL` : l’URL de votre projet Supabase
   - `VITE_SUPABASE_ANON_KEY` : la clé publique du projet (jamais la clé `service_role`)
5. Déployez le projet. Après chaque changement de variable d’environnement, relancez un déploiement.
6. Connectez-vous à `/admin` avec le compte créé. Ajoutez vos coordonnées, votre numéro WhatsApp, les numéros Airtel Money et Moov Money, puis vos gâteaux et promotions.

Les commandes client sont créées via une fonction Supabase qui revérifie les produits publiés, leur disponibilité, les prix et les frais de livraison. Leur consultation et leur gestion, ainsi que les modifications du catalogue et les téléversements, nécessitent un compte explicitement promu administrateur. Les règles RLS Supabase et les politiques du stockage sont définies dans le script SQL.

Vercel construit le site avec `npm run build` lors du déploiement. Sans les variables Supabase, le catalogue de démonstration reste visible, mais les commandes et l’espace admin ne sont pas activés. Les paiements Airtel Money et Moov Money sont confirmés manuellement avec le client ; aucune collecte de code PIN ou de secret de paiement n’est effectuée.
