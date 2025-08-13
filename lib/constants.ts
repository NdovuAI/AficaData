export const DOMAIN_CONFIG = {
  production: "https://ndovu.guru",
  development: "http://localhost:3000",
  staging: "https://staging.ndovu.guru", // if needed later
} as const

export const AUTH_REDIRECT_URLS = {
  callback: "/auth/callback",
  confirm: "/auth/confirm",
  resetPassword: "/auth/reset-password",
  updatePassword: "/auth/update-password",
} as const

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  if (process.env.NODE_ENV === "production") {
    return DOMAIN_CONFIG.production
  }

  return DOMAIN_CONFIG.development
}

export const getAuthRedirectUrl = (path: keyof typeof AUTH_REDIRECT_URLS) => {
  return `${getBaseUrl()}${AUTH_REDIRECT_URLS[path]}`
}
