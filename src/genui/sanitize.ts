import type { z } from 'zod';

const REMOVED = Symbol('removed');
type Path = readonly PropertyKey[];

/**
 * Validate component props against their schema, repairing what can be repaired.
 *
 * Invalid optional fields are deleted and invalid array items are dropped, then the result is
 * re-validated. Returns null only when a required field is invalid, so one bad link or icon name
 * costs that field rather than the whole section.
 */
export function sanitizeProps<T extends z.ZodType>(schema: T, props: unknown): z.infer<T> | null {
  let current: unknown = structuredClone(props);

  // Each pass removes at least one value, so a small bound is plenty.
  for (let pass = 0; pass < 8; pass++) {
    const result = schema.safeParse(current);
    if (result.success) return result.data;

    let changed = false;
    for (const issue of result.error.issues) {
      if (issue.path.length === 0) return null;
      changed = remove(current, issue.path) || changed;
    }
    if (!changed) return null;
    current = compact(current);
  }
  return null;
}

// Delete the value at `path`. If it is already absent (a required field failed), delete the
// nearest enclosing value instead: an optional object that lost a required field goes away as a
// whole, and an invalid array item is dropped so the rest of the array survives. If that walks
// all the way up to a required top-level prop, the next pass fails and the section is dropped.
function remove(root: unknown, path: Path): boolean {
  for (let end = path.length; end > 0; end--) {
    const parent = walk(root, path.slice(0, end - 1));
    const key = path[end - 1];
    if (!isContainer(parent)) continue;
    const value = (parent as Record<PropertyKey, unknown>)[key];
    if (key in parent && value !== REMOVED && value !== undefined) {
      (parent as Record<PropertyKey, unknown>)[key] = REMOVED;
      return true;
    }
  }
  return false;
}

function walk(root: unknown, path: Path): unknown {
  let node = root;
  for (const key of path) {
    if (!isContainer(node)) return undefined;
    node = (node as Record<PropertyKey, unknown>)[key];
  }
  return node;
}

function compact(node: unknown): unknown {
  if (Array.isArray(node)) return node.filter((v) => v !== REMOVED).map(compact);
  if (isContainer(node)) {
    return Object.fromEntries(
      Object.entries(node)
        .filter(([, v]) => v !== REMOVED)
        .map(([k, v]) => [k, compact(v)]),
    );
  }
  return node;
}

function isContainer(node: unknown): node is object {
  return typeof node === 'object' && node !== null;
}
