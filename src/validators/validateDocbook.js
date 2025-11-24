const fs = require('fs');
const libxmljs = require('libxmljs2');

/**
 * Validates a DocBook XML string against the RELAX NG schema.
 * @param {string} xmlContent - The DocBook XML as string.
 * @param {string} rngSchemaPath - Path to the RELAX NG schema file (e.g., "schemas/docbook.rng").
 * @returns {Object} Validation result with isValid boolean and errors array.
 */
function validateDocbookXml(xmlContent, rngSchemaPath) {
  try {
    const xmlDoc = libxmljs.parseXml(xmlContent);
    const rngSchemaContent = fs.readFileSync(rngSchemaPath, 'utf8');
    const rngSchema = libxmljs.parseXml(rngSchemaContent);

    const isValid = xmlDoc.relaxNGValidate(rngSchema);
    const errors = isValid ? [] : xmlDoc.validationErrors;

    return {
      isValid,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message]
    };
  }
}

module.exports = {
  validateDocbookXml
};
