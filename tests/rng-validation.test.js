const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const { validateAgainstRng } = require('./helpers/validateRng');

describe('DocBook RNG Validation', function () {
  const schemaPath = path.resolve(__dirname, '../schemas/docbook.rng');
  const outputsDir = path.resolve(__dirname, 'outputs');

  it('should validate jsonToDocbook.output.xml against DocBook RNG', function () {
    const xmlPath = path.join(outputsDir, 'jsonToDocbook.output.xml');
    const result = validateAgainstRng(xmlPath, schemaPath);
    if (!result.isValid && result.errors[0].includes('Jing not found')) {
      this.skip();
    }
    assert.isTrue(result.isValid, `Validation failed: ${result.errors.join('; ')}`);
  });

  it('should validate basic-markdown.xml against DocBook RNG', function () {
    const xmlPath = path.join(outputsDir, 'basic-markdown.xml');
    if (!fs.existsSync(xmlPath)) {
      this.skip();
    }
    const result = validateAgainstRng(xmlPath, schemaPath);
    if (!result.isValid && result.errors[0].includes('Jing not found')) {
      this.skip();
    }
    assert.isTrue(result.isValid, `Validation failed: ${result.errors.join('; ')}`);
  });
});
