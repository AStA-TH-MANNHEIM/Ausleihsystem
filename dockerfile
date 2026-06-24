# ---- STAGE 1: Build-Environment ----
FROM node:18-slim AS builder

# Arbeitsverzeichnis festlegen
WORKDIR /app

# OpenSSL installieren
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Projektdateien kopieren
COPY . .

# Eventuell auch lockfiles: package-lock.json oder pnpm-lock.yaml / yarn.lock
RUN npm install

# Anwendung bauen (SvelteKit build)
RUN npm run build

# ---- STAGE 2: Runtime-Environment ----
FROM node:18-slim AS runner

# OpenSSL installieren
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*


WORKDIR /app

# Nur das fertige Build-Verzeichnis und die Node Modules aus dem Builder übernehmen
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./


# Port freigeben (Standardport für Node-Adapter ist 3000)
EXPOSE 3000

# Startbefehl für die Node-Adapter Anwendung:
# Spielt offene Migrationen ein und startet anschließend den Server.
CMD npx prisma migrate deploy && node build

