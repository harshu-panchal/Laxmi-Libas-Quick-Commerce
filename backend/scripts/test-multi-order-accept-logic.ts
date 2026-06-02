/**
 * Offline logic smoke test (no DB). Run: npx tsx scripts/test-multi-order-accept-logic.ts
 */
import {
  DEFAULT_MAX_CONCURRENT_ORDERS_PER_BOY,
  ACTIVE_DELIVERY_BOY_STATUSES,
} from '../src/services/orderNotificationService';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`✅ ${msg}`);
}

console.log('--- Multi-order accept logic smoke test ---\n');

assert(DEFAULT_MAX_CONCURRENT_ORDERS_PER_BOY === 3, 'Default max concurrent is 3');
assert(ACTIVE_DELIVERY_BOY_STATUSES.length === 3, 'Three active delivery statuses');
assert(ACTIVE_DELIVERY_BOY_STATUSES.includes('Assigned'), 'Assigned counts as active');

// Simulate capacity check
const max = 3;
const scenarios = [
  { active: 0, canAccept: true },
  { active: 2, canAccept: true },
  { active: 3, canAccept: false },
];
for (const s of scenarios) {
  const can = s.active < max;
  assert(can === s.canAccept, `active=${s.active} → canAccept=${can}`);
}

console.log('\n✅ All offline checks passed');
console.log('\nFor live DB test (when Atlas is reachable):');
console.log('  npx tsx scripts/test-multi-order-accept.ts');
