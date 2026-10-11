import '@testing-library/jest-dom/vitest'

const localStorageItems = new Map<string, string>()

const testLocalStorage: Storage = {
  get length() {
    return localStorageItems.size
  },
  clear() {
    localStorageItems.clear()
  },
  getItem(key) {
    return localStorageItems.get(key) ?? null
  },
  key(index) {
    return Array.from(localStorageItems.keys())[index] ?? null
  },
  removeItem(key) {
    localStorageItems.delete(key)
  },
  setItem(key, value) {
    localStorageItems.set(key, String(value))
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: testLocalStorage,
})
