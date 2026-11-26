# Roadmap — portfolio-ready

Branch di lavoro: `portfolio-ready`. Nessun push diretto su `master`.
La pull request raccoglie il lavoro sotto. Questo file è il piano; il dettaglio operativo sta nel README e in `docs/`.

## Nome

GitTix viene sostituito. Tre opzioni:

1. **Footlight** — le luci di ribalta. Breve, legato al vivo, facile da ricordare.
2. **Aisle** — il corridoio tra i posti. Molto corto, più generico.
3. **Stubline** — dallo stub del biglietto. Descrittivo, meno elegante.

Scelta: **Footlight**. Il cluster NATS, le immagini e l'interfaccia usano questo nome. L'id interno degli eventi (`ticket:created`, `order:created`, …) resta quello del protocollo già pubblicato da `@petickets/common`.

## 1. Sicurezza

- Togliere `client/.env` e `client/.next` dall'indice git.
- Ignorare `.env`, `.env.*` (con eccezione per `.env.example`), `client/.next`, `dist`, `coverage`.
- Aggiungere `.env.example` per auth, tickets, orders, payments, expiration, client e per Compose, solo con i nomi delle variabili.
- README: i segreti vivono in variabili d'ambiente e in Kubernetes Secrets, mai nel git.
- `docs/git-history-cleanup.md`: istruzioni per `git filter-repo`. Non eseguirle in questo lavoro. La cronologia di `master` contiene ancora il materiale rimosso dalla punta del branch.

## 2. Pulizia e bug

- `expiration`: dipendenze `bull` e `ioredis` (Bull parla con Redis tramite ioredis), tipi, `test:ci`, test sul listener e sulla pubblicazione di `expiration:complete`.
- Il workflow `tests-peyments.yaml` non viene rinominato e lasciato in parallelo: i quattro workflow parziali (solo pull request, un servizio, niente lint) sono sostituiti da una CI unica. Il refuso sparisce.
- Eliminare `client/pages/banana.js`, `client/index.js` (Next usa `pages/`), `orders/npm` vuoto, errori e middleware duplicati in `auth` (le route usano `@petickets/common`), la sandbox `nats-test`.
- Rimuovere il gitlink `common` (submodule senza `.gitmodules`). La libreria condivisa è il pacchetto npm `@petickets/common`.
- Correggere `global.signin` in payments, che ignorava l'id utente, e il client che non inoltrava il token Stripe.
- I test di payments non chiamano Stripe in rete: il client Stripe è mockato, così la CI non ha bisogno della chiave.
- `GET /health` su ogni servizio nostro. All'avvio, un errore di Mongo o NATS fa uscire il processo con codice 1.
- Redis di expiration in `infra/k8s`: il Deployment si chiamava `expiration-depl` e non aveva le label del Service.

## 3. Interfaccia

- Pages Router invariato.
- `react-stripe-checkout` sostituito da `@stripe/react-stripe-js` (Card Element, `createToken`, ancora compatibile con `POST /api/payments`).
- Solo modalità test. In pagina ordine è indicata la carta `4242 4242 4242 4242`.
- La chiave pubblicabile arriva a runtime da `STRIPE_PUBLISHABLE_KEY` (il server Next la legge in `getInitialProps`). Non va più hardcoded.
- Layout responsive, elenco, dettaglio, ordine con countdown, pagamento, stati vuoti ed errori.

## 4. Ambiente locale e produzione

- `Dockerfile` multi-stage per ogni servizio: target `development` (Skaffold) e `production` (immagine finale, utente `node`, healthcheck).
- `docker-compose.yml`: Mongo per servizio, Redis, NATS Streaming, i sei servizi, Traefik sulle stesse path dell'Ingress (`/api/users`, `/api/tickets`, `/api/orders`, `/api/payments`, il resto al client).
- `docker-compose.prod.yml`: stesse regole, immagini `ghcr.io/pooriaeshghi/ticketing-*`, HTTPS Let's Encrypt su `ticketing.paidastudio.com`.
- `infra/k8s` resta per Skaffold (Ingress nginx, host `ticketing.dev`).
- `infra/k8s-prod`: overlay Kustomize per k3s su un nodo, Ingress Traefik, cert-manager, immagini GHCR.

## 5. CI/CD

- `.github/workflows/ci.yml`: push e pull request, matrice sui sei servizi, cache npm, lint, typecheck, test.
- `.github/workflows/cd.yml`: push su `master`, build multi-stage, push su GHCR, deploy SSH (`docker compose pull && up -d`) solo se la variable `DEPLOY_ENABLED` è `true`.
- Segreti GitHub: host, utente, chiave SSH, token di pull GHCR, `JWT_KEY`, `STRIPE_KEY`, `STRIPE_PUBLISHABLE_KEY`.

## 6. Deploy e demo

- `docs/deploy.md`: VPS Ubuntu (esempio Hetzner), Docker, firewall, utente `deploy`, DNS Cloudflare, HTTPS.
- `scripts/seed.mjs`: utente demo e quattro biglietti, eseguito con il profile Compose `seed`.

## 7. Documentazione

- `README.md` in italiano e in inglese: architettura Mermaid, flusso eventi, concorrenza ottimistica, avvio locale, test, CI/CD, deploy, origine del progetto, badge CI.

## Azioni manuali (non automatizzate)

1. Nella dashboard Stripe, revocare la chiave segreta di test che era in `client/.env` e la chiave pubblicabile hardcoded nella pagina ordine. Crearne una nuova coppia di test. Non riutilizzare i valori già pubblicati su GitHub.
2. Quando si è pronti a riscrivere la storia pubblica, seguire `docs/git-history-cleanup.md` (`git filter-repo`, poi force-push). Va fatto a parte, su un clone dedicato, dopo aver avvisato chiunque abbia un clone.
3. Creare i GitHub Actions secrets sul repository `PooriaEshghi/ticketing`:
   - `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
   - `GHCR_PULL_TOKEN` (PAT con `read:packages`, se i package GHCR non sono pubblici)
   - `JWT_KEY` (stringa lunga casuale, diversa da qualunque valore di sviluppo)
   - `STRIPE_KEY` (nuova `sk_test_…`)
   - `STRIPE_PUBLISHABLE_KEY` (nuova `pk_test_…`)
4. Creare la repository variable `DEPLOY_ENABLED=true` solo dopo che la VPS risponde. Fino ad allora la CD pubblica le immagini e salta lo SSH.
5. Rendere pubblici i package GHCR, oppure fare il login sulla VPS con `GHCR_PULL_TOKEN`.
6. Comprare una VPS Ubuntu economica e seguire `docs/deploy.md`.
7. Su Cloudflare, record DNS `A` (o `AAAA`) di `ticketing.paidastudio.com` verso l'IP della VPS, proxy DNS-only (nuvola grigia) finché il challenge HTTP-01 di Let's Encrypt non è stabile. Poi si può valutare il proxy arancione.
8. Non committare `.env`. Copiare gli example e compilare i valori solo in locale e sulla VPS.

## Fuori scope

- Migrazione all'App Router di Next.js.
- Passaggio da NATS Streaming a JetStream.
- Pagamenti Stripe con PaymentIntents (il backend usa ancora Charges + token, in test).
- Esecuzione di `git filter-repo` e force-push di `master`.
