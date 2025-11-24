const fs = require('fs');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

/**
 * Loads and compiles a JSON Schema from a given file path.
 * @param {string} schemaPath - Path to the JSON Schema file.
 * @returns {Function} Compiled AJV validation function.
 */
function loadSchema(schemaPath) {
  const schemaData = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(schemaData);
  return ajv.compile(schema);
}

/**
 * Validates a JSON document against a compiled AJV schema function.
 * @param {Object} jsonData - The JSON document to validate.
 * @param {Function} validateFunc - AJV validation function.
 * @returns {Object} Validation result with isValid and errors array.
 */
function validateJson(jsonData, validateFunc) {
  const isValid = validateFunc(jsonData);
  return {
    isValid,
    errors: isValid ? [] : validateFunc.errors
  };
}

module.exports = {
  loadSchema,
  validateJson
};
