import { canonicalBytes } from '../core/canonical.js';
export function dashboard(input){return {escrow:input.escrow??'UNVERIFIABLE',floor:input.floor??'UNVERIFIABLE',pool:input.pool??[],engagement:input.engagement??[],alloc:input.alloc??null};}
export function dashboardBytes(input){return canonicalBytes(dashboard(input));}
