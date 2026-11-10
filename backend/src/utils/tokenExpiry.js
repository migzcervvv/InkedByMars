'use strict';

// Meta returns Unix seconds; persisted refresh results use milliseconds.
function normalizeTokenExpiry(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) throw new Error('Instagram token expiry must be a non-negative Unix timestamp.');
  if (numeric === 0) return null;
  return numeric < 1e12 ? numeric * 1000 : numeric;
}

module.exports = { normalizeTokenExpiry };
