const fs = require('fs');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

let validate;

/**
 * Loads and compiles a JSON Schema from a given file path.
 * @param {string} schemaPath - Path to the JSON Schema file.
 * @returns {Function} Compiled AJV validation function.
 */
function loadSchema(schemaPath) {
  const schemaData = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(schemaData);
  validate = ajv.compile(schema);
  return
}

/**
 * Validates a JSON document against a compiled AJV schema function.
 * @param {Object} jsonData - The JSON document to validate.
 * @param {Function} validateFunc - AJV validation function.
 * @returns {Object} Validation result with isValid and errors array.
 */
function validateJson(jsonData, validator) {
  const validateFunc = validator || validate;
  if (!validateFunc) {
    throw new Error("Validator has not been loaded, call loadSchema() first.");
  }

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
