type MinimalSession = { id: string; title: string; parent_id: string | null };

/**
 * Depth-first, indentable list of sessions for a "Parent session" <select>.
 * When editing an existing session, excludeId must be set to that session's
 * own id — otherwise nothing stops an admin from picking itself or one of
 * its own descendants as its new parent, creating a cycle.
 */
export function buildParentOptions(
  sessions: MinimalSession[],
  excludeId?: string
): { id: string; title: string; depth: number }[] {
  const excluded = new Set<string>();
  if (excludeId) {
    excluded.add(excludeId);
    // Collect all descendants of excludeId so they can't be picked as a
    // new parent either (that would create a cycle).
    let frontier = [excludeId];
    while (frontier.length > 0) {
      const next = sessions.filter((s) => s.parent_id && frontier.includes(s.parent_id));
      for (const s of next) excluded.add(s.id);
      frontier = next.map((s) => s.id);
    }
  }

  const eligible = sessions.filter((s) => !excluded.has(s.id));
  const childrenByParent = new Map<string | null, MinimalSession[]>();
  for (const session of eligible) {
    const key = session.parent_id;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(session);
  }

  const result: { id: string; title: string; depth: number }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const session of childrenByParent.get(parentId) ?? []) {
      result.push({ id: session.id, title: session.title, depth });
      walk(session.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}
