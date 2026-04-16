FROM node:20
RUN apt-get update && apt-get install -y \
  chromium fonts-noto-color-emoji ca-certificates \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8090
ENV PORT=8090
CMD ["node", "server/api.js"]
