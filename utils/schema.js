// utils/schema.js

// Single place to define the default schema
const DEFAULT_SCHEMA = "public";

// Given a request, decide which schema to use
function resolveSchema(req) {
  // If the route has /dbselect/:db, use that
  // Otherwise fall back to the default
  return req.params?.db || DEFAULT_SCHEMA;
}

module.exports = {
  resolveSchema,
  DEFAULT_SCHEMA
};