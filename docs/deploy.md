# Deploy su una VPS

Guida per pubblicare Footlight su una macchina Ubuntu economica, con Docker e HTTPS su `ticketing.paidastudio.com`. Stripe resta in **modalità test**.

La variante Kubernetes per un nodo k3s è in fondo. Il percorso principale è Docker Compose.

## English

The same steps, in English, start at [English](#english).

## 1. Macchina

Un VPS Ubuntu 24.04 con 2 GB di RAM basta per la demo (per esempio Hetzner CX22). Annota l'indirizzo IPv4 pubblico.

Entra come root la prima volta, poi crea un utente che non sia root:

```bash
adduser deploy
usermod -aG sudo deploy
```

Copia la tua chiave SSH:

```bash
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Da qui in poi entra come `deploy`.

## 2. Firewall

```bash
sudo apt update
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Non aprire 27017, 4222 o 6379. Mongo, NATS e Redis restano sulla rete Docker.

## 3. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
```

Esci e rientra, così il gruppo `docker` è attivo.

## 4. DNS su Cloudflare

Nel dominio `paidastudio.com` crea un record:

| Tipo | Nome | Valore | Proxy |
| --- | --- | --- | --- |
| A | ticketing | IP pubblico della VPS | DNS only (nuvola grigia) |

La nuvola grigia serve al challenge HTTP-01 di Let's Encrypt, che deve raggiungere la porta 80 della VPS. Quando il certificato è emesso puoi rivalutare il proxy arancione. Con il proxy attivo, Let's Encrypt deve usare un solver DNS, che questa guida non configura.

## 5. Codice e segreti sulla VPS

La CD di GitHub Actions copia i file in `/opt/footlight` e scrive `.env` dai GitHub Secrets. Per il primo avvio manuale:

```bash
sudo mkdir -p /opt/footlight
sudo chown deploy:deploy /opt/footlight
cd /opt/footlight
git clone https://github.com/PooriaEshghi/ticketing.git .
```

Crea `/opt/footlight/.env` (non committarlo):

```bash
umask 077
cat > .env << 'EOF'
IMAGE_TAG=latest
JWT_KEY=una-stringa-lunga-e-casuale
STRIPE_KEY=sk_test_nuova
STRIPE_PUBLISHABLE_KEY=pk_test_nuova
DOMAIN=ticketing.paidastudio.com
LETSENCRYPT_EMAIL=admin@paidastudio.com
EOF
chmod 600 .env
```

`STRIPE_KEY` e `STRIPE_PUBLISHABLE_KEY` sono una **coppia nuova di chiavi di test**, creata dopo aver revocato quelle finite nel git. `JWT_KEY` non va riusata da un ambiente di sviluppo.

Login al registry, se i package non sono pubblici:

```bash
docker login ghcr.io -u pooriaeshghi
```

Il token è un PAT con `read:packages` (il secret `GHCR_PULL_TOKEN`).

## 6. Avvio

```bash
cd /opt/footlight
docker compose -f docker-compose.prod.yml pull auth tickets orders payments expiration client
docker compose -f docker-compose.prod.yml up -d --build
```

`--build` ricostruisce solo NATS (immagine locale, con healthcheck). Gli altri servizi usano `ghcr.io/pooriaeshghi/ticketing-*`.

Traefik chiede il certificato a Let's Encrypt la prima volta che arriva traffico HTTPS su `ticketing.paidastudio.com`. Controlla i log se il certificato non compare entro un minuto:

```bash
docker compose -f docker-compose.prod.yml logs traefik
```

## 7. Dati di demo

Con lo stack su:

```bash
SEED_BASE_URL=https://ticketing.paidastudio.com node scripts/seed.mjs
```

Oppure, in locale, `docker compose --profile seed run --rm seed`.

Lo script crea `demo@footlight.app` / `password` se non esiste, e quattro biglietti se la bacheca è vuota. In pagamento usa la carta di test `4242 4242 4242 4242`, una scadenza futura, un CVC qualsiasi.

## 8. GitHub Actions

Secrets del repository:

- `VPS_HOST` — IP o nome della VPS
- `VPS_USER` — `deploy`
- `VPS_SSH_KEY` — chiave privata il cui pubblico è in `authorized_keys`
- `GHCR_PULL_TOKEN` — solo se i package GHCR sono privati
- `JWT_KEY`
- `STRIPE_KEY`
- `STRIPE_PUBLISHABLE_KEY`

Variable (non secret): `DEPLOY_ENABLED=true`. Senza questa variable la CD pubblica le immagini e non apre SSH.

L'utente `deploy` deve poter usare Docker senza sudo. La directory `/opt/footlight` deve essere scrivibile da quell'utente.

## 9. k3s su un solo nodo

Alternativa a Compose, non il percorso della CD.

```bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
```

k3s include Traefik. Installa cert-manager, poi i manifest:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
kubectl -n cert-manager rollout status deploy/cert-manager
# Compila infra/k8s-prod/secrets.example.yaml con valori veri, fuori dal git, poi:
kubectl apply -f infra/k8s-prod/secrets.example.yaml
kubectl apply -k infra/k8s-prod
```

L'Ingress di produzione ascolta `ticketing.paidastudio.com` e chiede il certificato all'issuer `letsencrypt-prod`. L'Ingress di sviluppo (`ticketing.dev`, nginx) viene tolto dall'overlay.

I pod usano `ghcr.io/pooriaeshghi/ticketing-*:latest`. Se il registry è privato:

```bash
kubectl create secret docker-registry ghcr \
  --docker-server=ghcr.io \
  --docker-username=pooriaeshghi \
  --docker-password="$GHCR_PULL_TOKEN"
```

e aggiungi `imagePullSecrets` ai Deployment prima di applicare.

## English

### Machine

Use an Ubuntu 24.04 VPS with about 2 GB of RAM (a Hetzner CX22 is enough). Note the public IPv4 address. Create a `deploy` user, copy your SSH key, and stop using root for daily work.

### Firewall

Allow OpenSSH, TCP 80 and TCP 443 only. MongoDB, NATS and Redis stay on the Docker network.

### Docker

Install Docker with the official convenience script and add `deploy` to the `docker` group. Log in again.

### DNS

At Cloudflare, add an `A` record `ticketing` pointing at the VPS, **DNS only** (grey cloud), so the Let's Encrypt HTTP-01 challenge can reach port 80. Turn the orange proxy on later only if you switch the solver to DNS-01.

### App directory

Clone the repository to `/opt/footlight` or let the CD workflow copy `docker-compose.prod.yml`, `infra/nats/Dockerfile` and `scripts/seed.mjs` there. Write a mode `600` `.env` with:

- `IMAGE_TAG`
- `JWT_KEY` (long random string)
- `STRIPE_KEY` (a new `sk_test_…` key)
- `STRIPE_PUBLISHABLE_KEY` (the matching `pk_test_…` key)
- `DOMAIN=ticketing.paidastudio.com`
- `LETSENCRYPT_EMAIL`

Revoke any Stripe test key that was ever committed before you create this pair. See `docs/git-history-cleanup.md`.

### Start

```bash
docker compose -f docker-compose.prod.yml pull auth tickets orders payments expiration client
docker compose -f docker-compose.prod.yml up -d --build
```

Traefik obtains the certificate on the first HTTPS request. Seed the board with `scripts/seed.mjs`. Pay with `4242 4242 4242 4242`.

### GitHub

Set the secrets listed in the Italian section and the repository variable `DEPLOY_ENABLED=true` when the VPS is ready. Until then, CD only publishes images.

### Single-node k3s

Install k3s and cert-manager, fill `infra/k8s-prod/secrets.example.yaml` outside of git, then `kubectl apply -k infra/k8s-prod`. The overlay deletes the nginx development Ingress and adds a Traefik Ingress plus a Let's Encrypt `ClusterIssuer`.
