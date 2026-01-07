# Vortex Protocol API - Dockerfile for Fly.io
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install production dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy source code and build
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Runtime
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json .

# Run the app
USER bun
EXPOSE 3001/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]

