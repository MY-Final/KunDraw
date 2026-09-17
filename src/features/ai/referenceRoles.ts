import { DEFAULT_REFERENCE_ROLE, REFERENCE_ROLE_LABELS, REFERENCE_ROLES } from "./constants"
import type { ReferenceImage, ReferenceRole } from "./types"

/** "风格参考×1、内容参考×2" — used in the UI and in generated-image metadata. */
export function summarizeReferenceRoles(references: Pick<ReferenceImage, "role">[]) {
  const counts = new Map<ReferenceRole, number>()
  for (const reference of references) {
    counts.set(reference.role, (counts.get(reference.role) ?? 0) + 1)
  }

  return REFERENCE_ROLES.filter((role) => counts.has(role))
    .map((role) => `${REFERENCE_ROLE_LABELS[role]}×${counts.get(role)}`)
    .join("、")
}

/**
 * A short instruction telling the model what each reference is for. Gateways only
 * accept a prompt, so the roles have to travel as text; a single default-role
 * reference is left alone to keep simple edits unchanged.
 */
export function referenceBrief(references: ReferenceImage[]) {
  const hasCustomRole = references.some((reference) => reference.role !== DEFAULT_REFERENCE_ROLE)
  if (!hasCustomRole && references.length < 2) return ""

  const parts = references.map(
    (reference, index) => `第 ${index + 1} 张为${REFERENCE_ROLE_LABELS[reference.role]}`
  )
  return `参考图说明：${parts.join("，")}。`
}
