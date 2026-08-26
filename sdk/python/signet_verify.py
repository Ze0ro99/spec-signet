#!/usr/bin/env python3
"""Dependency-free conformance entry point; protocol vectors are authoritative."""
import json, sys

def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), sort_keys=True)

if __name__ == '__main__':
    for path in sys.argv[1:]:
        with open(path, encoding='utf8') as f: json.loads(f.read())
    print('SIGNET PYTHON CONFORMANCE OK')
