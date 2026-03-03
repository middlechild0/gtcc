# use the official Bun image
FROM oven/bun:1-alpine as base
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock turbo.json /temp/prod/
COPY apps /temp/prod/apps/
COPY packages /temp/prod/packages/
RUN cd /temp/prod && bun install --frozen-lockfile

# copy to final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=install /temp/prod/apps apps
COPY --from=install /temp/prod/packages packages
COPY --from=install /temp/prod/package.json .
COPY --from=install /temp/prod/bun.lock .
COPY --from=install /temp/prod/turbo.json .

WORKDIR /app/apps/api

# run the app
USER bun
EXPOSE 3003
ENV PORT=3003
CMD ["bun", "run", "src/index.ts"]
