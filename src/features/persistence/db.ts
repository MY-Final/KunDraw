/**
 * Low-level IndexedDB helpers. tldraw's store stays the runtime source of truth;
 * this module only knows how to read and write the persisted records.
 */

const DB_NAME = "kundraw"
const DB_VERSION = 1

export const PROJECTS_STORE = "projects"
export const CANVASES_STORE = "canvases"
export const ASSETS_STORE = "assets"
export const SETTINGS_STORE = "settings"
export const META_STORE = "meta"

const STORE_KEY_PATHS: Array<[string, string]> = [
  [PROJECTS_STORE, "id"],
  [CANVASES_STORE, "projectId"],
  [ASSETS_STORE, "id"],
  [SETTINGS_STORE, "key"],
  [META_STORE, "key"],
]

let connection: Promise<IDBDatabase> | null = null

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      for (const [name, keyPath] of STORE_KEY_PATHS) {
        if (!request.result.objectStoreNames.contains(name)) {
          request.result.createObjectStore(name, { keyPath })
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("无法打开本地数据库"))
  })
}

export function getDatabase() {
  connection ??= openDatabase()
  return connection
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("本地数据库请求失败"))
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("本地数据库事务失败"))
    transaction.onabort = () => reject(transaction.error ?? new Error("本地数据库事务被中止"))
  })
}

export async function readRecord<T>(storeName: string, key: IDBValidKey) {
  const db = await getDatabase()
  const transaction = db.transaction(storeName, "readonly")
  return (await requestResult(transaction.objectStore(storeName).get(key))) as T | undefined
}

export async function readRecords<T>(storeName: string) {
  const db = await getDatabase()
  const transaction = db.transaction(storeName, "readonly")
  return (await requestResult(transaction.objectStore(storeName).getAll())) as T[]
}

export async function writeRecord(storeName: string, value: unknown) {
  const db = await getDatabase()
  const transaction = db.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).put(value)
  await transactionDone(transaction)
}

export async function deleteRecord(storeName: string, key: IDBValidKey) {
  const db = await getDatabase()
  const transaction = db.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).delete(key)
  await transactionDone(transaction)
}

export async function deleteRecords(storeName: string, keys: IDBValidKey[]) {
  if (keys.length === 0) return
  const db = await getDatabase()
  const transaction = db.transaction(storeName, "readwrite")
  const store = transaction.objectStore(storeName)
  for (const key of keys) store.delete(key)
  await transactionDone(transaction)
}

export async function clearRecords(storeName: string) {
  const db = await getDatabase()
  const transaction = db.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).clear()
  await transactionDone(transaction)
}
