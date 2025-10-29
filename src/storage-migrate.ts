const LEGACY_KEYS = [
  "token",
  "user",
]

try {
  LEGACY_KEYS.forEach((k) => {
    try { localStorage.removeItem(k) } catch { void 0 }
  })
} catch { void 0 }


