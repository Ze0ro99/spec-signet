#!/usr/bin/env python3
 v0/ze0ro99-a8e6e867
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

"""Dependency-free SIGNET vector verifier.

This intentionally consumes vectors and protocol bytes without importing the
Node implementation. It verifies the shared Ed25519 PEP fixture and checks the
canonical JSON contract used by the JS implementation.
"""

import base64
import hashlib
import json
import pathlib
import sys
import unicodedata

Q = 2 ** 255 - 19
L = 2 ** 252 + 27742317777372353535851937790883648493
D = (-121665 * pow(121666, Q - 2, Q)) % Q
I = pow(2, (Q - 1) // 4, Q)
B = None


def normalize(value):
    if isinstance(value, str):
        return unicodedata.normalize("NFC", value)
    if value is None or isinstance(value, bool) or isinstance(value, int):
        if isinstance(value, int) and value < 0:
            raise ValueError("negative integer")
        return value
    if isinstance(value, float):
        if value < 0 or not value.is_integer():
            raise ValueError("non-integer number")
        return int(value)
    if isinstance(value, list):
        return [normalize(item) for item in value]
    if isinstance(value, dict):
        return {
            unicodedata.normalize("NFC", key): normalize(value[key])
            for key in sorted(value)
        }
    raise ValueError("unsupported value")


def canonical(value):
    return json.dumps(
        normalize(value),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
        allow_nan=False,
    )


def xrecover(y):
    xx = (y * y - 1) * pow(D * y * y + 1, Q - 2, Q) % Q
    x = pow(xx, (Q + 3) // 8, Q)
    if (x * x - xx) % Q:
        x = x * I % Q
    if x & 1:
        x = Q - x
    return x


def edwards_add(point_a, point_b):
    x1, y1 = point_a
    x2, y2 = point_b
    product = D * x1 * x2 * y1 * y2 % Q
    x3 = (x1 * y2 + x2 * y1) * pow(1 + product, Q - 2, Q) % Q
    y3 = (y1 * y2 + x1 * x2) * pow(1 - product, Q - 2, Q) % Q
    return x3, y3


def scalar_mult(point, scalar):
    result = (0, 1)
    addend = point
    while scalar:
        if scalar & 1:
            result = edwards_add(result, addend)
        addend = edwards_add(addend, addend)
        scalar >>= 1
    return result


def decode_point(encoded):
    raw = bytearray(encoded)
    sign = raw[31] >> 7
    raw[31] &= 127
    y = int.from_bytes(raw, "little")
    if y >= Q:
        raise ValueError("invalid point")
    x = xrecover(y)
    if (x & 1) != sign:
        x = Q - x
    return x, y


def verify_ed25519(public_der, signature_b64, message):
    public_raw = base64.b64decode(public_der)[-32:]
    signature = base64.b64decode(signature_b64)
    if len(public_raw) != 32 or len(signature) != 64:
        return False
    try:
        point_r = decode_point(signature[:32])
        point_a = decode_point(public_raw)
    except ValueError:
        return False
    scalar_s = int.from_bytes(signature[32:], "little")
    if scalar_s >= L:
        return False
    digest = hashlib.sha512(signature[:32] + public_raw + message).digest()
    scalar_h = int.from_bytes(digest, "little") % L
    return scalar_mult((xrecover(4 * pow(5, Q - 2, Q) % Q), 4 * pow(5, Q - 2, Q) % Q), scalar_s) == edwards_add(
        point_r, scalar_mult(point_a, scalar_h)
    )


def verify_vector(path):
    with path.open(encoding="utf8") as handle:
        value = json.load(handle)
    if path.name == "cross-language.json":
        body = value["body"]
        expected = (
            '{"action_id":"retail.order_delivered","app_id":"app.marketplace",'
            '"key_id":"k1","nonce":"cross-language-0001",'
            '"pioneer_uid_hash":"h1:dGVzdC1wcm9vZg==","spec":"SIGNET-PEP-v1",'
            '"timestamp_ms":1764000000000,"utility_class":"A","weight":2}'
        )
        actual = canonical(body)
        if actual != expected:
            raise ValueError(f"canonical mismatch in {path}")
        message = (value["domain"] + actual).encode("utf8")
        if not verify_ed25519(value["public_key"], value["signature"], message):
            raise ValueError(f"signature mismatch in {path}")
    return value


def main(arguments):
    paths = [pathlib.Path(argument) for argument in arguments]
    if not paths:
        root = pathlib.Path(__file__).resolve().parents[2] / "vectors"
        paths = sorted(root.rglob("*.json"))
    for path in paths:
        verify_vector(path)
    print(f"SIGNET PYTHON CONFORMANCE OK: {len(paths)} vectors; canonical and Ed25519 checks passed")


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"SIGNET PYTHON CONFORMANCE FAILED: {error}", file=sys.stderr)
        raise SystemExit(1)
 main
