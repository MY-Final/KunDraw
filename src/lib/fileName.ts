/** Strips characters that browsers and file systems dislike in download names. */
export function sanitizeNamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=~]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24)
}

/** `20260917-1822`, used to keep downloads distinguishable. */
export function timestampFor(value: number) {
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

export function extensionFor(mimeType: string) {
  return mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png"
}
