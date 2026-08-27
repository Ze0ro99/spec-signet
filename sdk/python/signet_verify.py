#!/usr/bin/env python3
"""Dependency-free SIGNET canonicalization and vector verifier."""
import json
import sys
import unicodedata


def canonical(value):
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(unicodedata.normalize('NFC', str(k)), ensure_ascii=False, separators=(',', ':')) + ':' + canonical(value[k]) for k in sorted(value, key=lambda k: unicodedata.normalize('NFC', str(k)))) + '}'
    if isinstance(value, list):
        return '[' + ','.join(canonical(item) for item in value) + ']'
    if isinstance(value, str):
        return json.dumps(unicodedata.normalize('NFC', value), ensure_ascii=False, separators=(',', ':'))
    if value is True: return 'true'
    if value is False: return 'false'
    if value is None: return 'null'
    if isinstance(value, int) and value >= 0 and value <= 9007199254740991: return str(value)
    raise ValueError('unsupported canonical value')


def main(paths):
    for path in paths:
        with open(path, encoding='utf8') as handle:
            value = json.load(handle)
        encoded = canonical(value).encode('utf8')
        if canonical(json.loads(encoded.decode('utf8'))).encode('utf8') != encoded:
            raise SystemExit(f'canonicalization mismatch: {path}')
    print(f'SIGNET PYTHON CONFORMANCE OK: {len(paths)} vectors')


if __name__ == '__main__':
    main(sys.argv[1:])
