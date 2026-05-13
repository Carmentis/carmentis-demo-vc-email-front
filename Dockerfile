FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --dangerously-allow-all-builds --frozen-lockfile

EXPOSE 3000

CMD pnpm run build && pnpm run preview --host --port 3000
