// Workaround for hey-api/openapi-ts#2539
// Generated code uses `BodyInit` as a global type, but it only exists in
// lib.dom.d.ts / lib.webworker.d.ts. In a Node.js-only tsconfig (`"types": ["node"]`),
// this type is missing. Provide a minimal declaration sourced from undici-types.
// Remove this file once hey-api stops emitting bare `BodyInit` references.
type BodyInit =
  | ArrayBuffer
  | AsyncIterable<Uint8Array>
  | Blob
  | FormData
  | Iterable<Uint8Array>
  | NodeJS.ArrayBufferView
  | URLSearchParams
  | null
  | string;
