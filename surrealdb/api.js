const express = require('express')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')

const PORT = process.env.PORT || 3000;
const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;

const app = express()
app.use(express.json())
const client = jwksClient({ jwksUri: GOOGLE_OAUTH_URL })

function getKey(header, callback) {
  client.getSigningKey(header.kid, (error, key) => {
    if (error) return callback(error)
    callback(null, key.getPublicKey())
  })
}

app.post('/oath', (request, response) => {
  const token = request.body.token;
  if (!token) return response.status(400).json({ error: 'Token required' })

  jwt.verify(token, getKey, {}, (error, decoded) => {
    if (error) return response.status(401).json({ error: 'Invalid token' })
    response.json({ token, decoded });
  })
})

app.listen(PORT, () => console.log(`Listening on ${PORT}`))