const DAY_MS = 86400000;

export function validateManifest(manifest = {}, classCeilings = { A: 100, B: 20, C: 5 }, catalog = {}) {
  for (const [action, weight] of Object.entries(manifest)) {
    if (!Number.isSafeInteger(weight) || weight < 0) throw Error('MANIFEST_WEIGHT_INVALID');
    const ceiling = catalog[action]?.weight_ceiling ?? classCeilings[catalog[action]?.utility_class ?? 'A'];
    if (ceiling == null || weight > ceiling) throw Error('MANIFEST_WEIGHT_OVERFLOW');
  }
  return true;
}

export function scoreEngagement(
  events,
  { windowStartMs, windowEndMs, classCeilings = { A: 100, B: 20, C: 5 }, manifest = {}, catalog = {} } = {},
) {
  if (!Number.isSafeInteger(windowStartMs) || !Number.isSafeInteger(windowEndMs) || windowEndMs <= windowStartMs) {
    throw Error('ENGAGEMENT_WINDOW');
  }
  validateManifest(manifest, classCeilings, catalog);
  const windowDays = Math.max(1, Math.ceil((windowEndMs - windowStartMs) / DAY_MS));
  const accepted = events.filter((event) => event.policy === 'ALLOW'
    && event.timestamp_ms >= windowStartMs && event.timestamp_ms < windowEndMs);
  const byProject = new Map();
  for (const event of accepted) {
    const project = event.app_id ?? 'unknown';
    const entry = byProject.get(project) ?? { app_id: project, poa: 0, pou: 0, days: new Set() };
    const protocolCeiling = classCeilings[event.utility_class] ?? 0;
    const manifestCeiling = manifest[event.action_id] ?? protocolCeiling;
    entry.poa += 1;
    entry.pou += Math.min(event.weight, protocolCeiling, manifestCeiling);
    entry.days.add(Math.floor(event.timestamp_ms / DAY_MS));
    byProject.set(project, entry);
  }
  const leaderboard = [...byProject.values()].map((entry) => {
    const consistency_ppm = Math.min(1000000, Math.floor((entry.days.size / windowDays) * 1000000));
    return {
      app_id: entry.app_id,
      poa: entry.poa,
      pou: entry.pou,
      consistency_ppm,
      score: Math.floor((entry.pou * consistency_ppm) / 1000000),
    };
  }).sort((a, b) => b.score - a.score || a.app_id.localeCompare(b.app_id));
  return {
    window_start_ms: windowStartMs,
    window_end_ms: windowEndMs,
    accepted_events: accepted.length,
    leaderboard,
    consistency_note: 'Policy-ALLOW events only; scores are capped by protocol and manifest ceilings.',
  };
}