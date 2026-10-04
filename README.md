# L'Écrin du Goût — thème Shopify

Ce dépôt est connecté à la boutique via l'intégration GitHub de Shopify.
Chaque push sur `main` met à jour automatiquement le thème connecté.

## Développement local

```bash
npm install -g @shopify/cli
shopify theme dev --store <boutique>.myshopify.com
```

> Les modifications faites dans l'éditeur de thème Shopify sont commitées
> automatiquement par Shopify dans ce dépôt (surtout `config/settings_data.json`
> et `templates/*.json`) — pensez à `git pull` avant de travailler.
