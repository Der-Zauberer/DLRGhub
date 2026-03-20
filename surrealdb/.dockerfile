FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm install express jsonwebtoken jwks-rsa

ENV GOOGLE_OAUTH_URL=GOOGLE_OAUTH_URL
ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]