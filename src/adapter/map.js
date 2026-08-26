export function mapContext(context, catalog) {
  const action = catalog.actions[context.action_id];
  if (!action) throw Object.assign(new Error('Unknown action'), { code: 'ADAPTER_UNMAPPABLE' });
  if (!Object.hasOwn(context, 'weight') || !Number.isSafeInteger(context.weight) || context.weight < 0) throw Object.assign(new Error('Explicit weight required'), { code: 'ADAPTER_WEIGHT_CLAMP_DENIED' });
  if (context.weight > action.weight_ceiling) throw Object.assign(new Error('Weight exceeds catalog ceiling'), { code: 'ADAPTER_WEIGHT_CLAMP_DENIED' });
  return { spec: 'SIGNET-PEP-v1', app_id: context.app_id, key_id: context.key_id, pioneer_uid_hash: context.pioneer_uid_hash, action_id: context.action_id, utility_class: action.utility_class, weight: context.weight, timestamp_ms: context.timestamp_ms, nonce: context.nonce };
}
