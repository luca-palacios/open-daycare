export function parseAllergyTags(allergies: string): string[] {
  return allergies
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
