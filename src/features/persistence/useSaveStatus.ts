import { useSyncExternalStore } from "react"

import { getSaveStatus, subscribeSaveStatus } from "./status"

export function useSaveStatus() {
  return useSyncExternalStore(subscribeSaveStatus, getSaveStatus, getSaveStatus)
}
