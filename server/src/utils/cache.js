const store = new Map();

export const getCache = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

export const setCache = (key, value, ttlMs = 120000) => {
  store.set(key, { value, expires: Date.now() + ttlMs });
};

export const invalidateCache = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};
