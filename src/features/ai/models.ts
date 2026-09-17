/** Models kunDraw offers by default; any model from `/models` is added alongside. */
export const builtInModelIds = ["images-2.5", "banner", "agens"] as const

export function mergeModels(builtIn: readonly string[], remote: string[]): string[] {
  const seen = new Set(builtIn)
  const extra = remote.filter((id) => id && !seen.has(id))
  return [...builtIn, ...extra]
}

/** Keeps a typed-but-unknown model name usable instead of forcing a pick from the list. */
export function isKnownModel(models: string[], model: string) {
  return models.includes(model)
}
