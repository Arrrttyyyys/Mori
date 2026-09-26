export const ACCOUNT_RELATIONSHIPS = [
  {
    value: "participant",
    title: "I’ll use Mori myself",
    description: "Build my Life Map and use memory sessions at my own pace.",
  },
  {
    value: "family",
    title: "I support a family member",
    description: "Help someone close to me organize memories and prepare sessions.",
  },
  {
    value: "professional",
    title: "I work with older adults",
    description: "Explore Mori for supervised support, care, or research work.",
  },
] as const;

export type AccountRelationship =
  (typeof ACCOUNT_RELATIONSHIPS)[number]["value"];

export function isAccountRelationship(
  value: unknown,
): value is AccountRelationship {
  return ACCOUNT_RELATIONSHIPS.some((option) => option.value === value);
}
