# Default production image for the Next.js web app (Linux)
FROM node:22-bookworm-slim AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_INCLUDE=optional

COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/

RUN npm ci --include=dev --include=optional --include-workspace-root --ignore-scripts

COPY apps/web apps/web

RUN node apps/web/scripts/ensure-native-css-bindings.cjs \
  && npm run build --workspace=web

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["npm", "run", "start"]
