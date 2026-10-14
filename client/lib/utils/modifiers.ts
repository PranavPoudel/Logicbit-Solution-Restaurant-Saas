type ModifierShape = { maxSelect?: number; isRequired?: boolean; options?: unknown[] };

export function isSingleModifier<T extends ModifierShape>(group: T): group is T & { options: [NonNullable<T["options"]>[number]] } {
  return (group.maxSelect ?? 1) === 1 && !group.isRequired && group.options?.length === 1;
}
