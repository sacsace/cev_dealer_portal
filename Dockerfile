# Default production image for the Next.js web app (Linux)
FROM node:22-bookworm-slim AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_INCLUDE=optional
ENV HOSTNAME=0.0.0.0

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY package.json package-lock.json .npmrc ./
COPY scripts/ensure-native-css-bindings.cjs scripts/
COPY apps/web/scripts/ensure-native-css-bindings.cjs apps/web/scripts/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/

RUN env -u NPM_CONFIG_OMIT -u npm_config_omit -u NPM_CONFIG_PRODUCTION -u npm_config_production \
  npm ci --include=dev --include=optional --include-workspace-root --ignore-scripts

COPY apps/web apps/web

RUN env -u NPM_CONFIG_OMIT -u npm_config_omit -u NPM_CONFIG_PRODUCTION -u npm_config_production \
  node scripts/ensure-native-css-bindings.cjs \
  && npm run build --workspace=web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=web"]
