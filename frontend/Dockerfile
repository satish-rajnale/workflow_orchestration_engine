FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* .npmrc* ./
RUN npm install --no-audit --no-fund || true
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]
