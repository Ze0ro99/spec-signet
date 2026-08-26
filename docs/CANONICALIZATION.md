# SIGNET canonicalization

SIGNET encodes only JSON-compatible values from each artifact's closed schema. Object keys are NFC-normalized and sorted lexicographically; strings are NFC-normalized; arrays preserve order and cannot contain holes. Numbers must be non-negative safe integers. Undefined, floating point, non-finite, negative, and unsupported values are rejected. The canonical UTF-8 bytes are JSON text with no insignificant whitespace. Every signed body is prefixed by its artifact-specific domain before Ed25519 signing.
