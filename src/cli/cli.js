#!/usr/bin/env node
import {readFile} from 'node:fs/promises'; import {canonicalString} from '../core/canonical.js'; import {catalog,catalogHash} from '../adapter/catalog.js';
const [cmd]=process.argv.slice(2); if(cmd==='catalog'&&process.argv.includes('hash')) console.log(catalogHash()); else if(cmd==='catalog') console.log(canonicalString(catalog)); else if(cmd==='help'||!cmd) console.log('signet catalog hash'); else console.error(`Unknown command: ${cmd}`);
