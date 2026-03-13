import rateLimit from 'express-rate-limit'

const isDev = process.env.NODE_ENV !== 'production'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 15,       // strict in prod, unrestricted in dev for load testing
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

export const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 10000 : 120,      // generous — staff may scan fast
  message: { error: 'Too many scan attempts, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
})

export const lookupLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 10000 : 180,      // most generous — read-only, no state change
  message: { error: 'Too many lookup attempts, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
})

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev              // zero limits in dev, no 429s ever
})