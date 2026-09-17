export type SaveStatus = "saved" | "saving" | "error"

let status: SaveStatus = "saved"
const listeners = new Set<() => void>()

export function setSaveStatus(next: SaveStatus) {
  if (next === status) return
  status = next
  for (const listener of listeners) listener()
}

export function getSaveStatus() {
  return status
}

export function subscribeSaveStatus(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
