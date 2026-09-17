import { useCallback, useState } from "react"

import { DEFAULT_REFERENCE_ROLE, MAX_REFERENCE_BYTES } from "./constants"
import { createId } from "./storage"
import type { ReferenceImage, ReferenceRole } from "./types"

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("读取图片失败"))
    reader.readAsDataURL(file)
  })
}

export function useReferences() {
  const [references, setReferences] = useState<ReferenceImage[]>([])

  /** Appends files; there is no fixed limit, only a per-file size guard. */
  const addReferences = useCallback(async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"))
    if (images.length === 0) return

    const tooLarge = images.find((file) => file.size > MAX_REFERENCE_BYTES)
    if (tooLarge) {
      throw new Error(`参考图过大（上限 ${Math.round(MAX_REFERENCE_BYTES / 1024 / 1024)}MB）：${tooLarge.name}`)
    }

    const loaded = await Promise.all(
      images.map(async (file) => {
        const dataUrl = await readFileAsDataUrl(file)
        return {
          id: createId("ref"),
          name: file.name,
          mimeType: file.type || "image/png",
          dataUrl,
          bytes: file.size,
          role: DEFAULT_REFERENCE_ROLE,
        } satisfies ReferenceImage
      })
    )

    setReferences((current) => [...current, ...loaded])
  }, [])

  const removeReference = useCallback((id: string) => {
    setReferences((current) => current.filter((reference) => reference.id !== id))
  }, [])

  const updateReferenceRole = useCallback((id: string, role: ReferenceRole) => {
    setReferences((current) =>
      current.map((reference) => (reference.id === id ? { ...reference, role } : reference))
    )
  }, [])

  const clearReferences = useCallback(() => setReferences([]), [])

  return { references, addReferences, removeReference, updateReferenceRole, clearReferences }
}
