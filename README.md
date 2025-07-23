# DLRGhub

An application to manage shift plans for beach lifegards and events.

## Database Setup

Install [SurrealDB](https://surrealdb.com/install).

```bash
surreal upgrade
surreal start --log info --user admin --pass admin --deny-all --allow-guests --allow-scripting --allow-funcs --bind 0.0.0.0:8080 surrealkv:data
```

Import the schmea script.

## Vue Setup

```bash
npm install
npm run dev
```
