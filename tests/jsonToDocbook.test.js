const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const jsonToDocbook = require('../src/converters/jsonToDocbook');

describe('jsonToDocbook', function () {
  it('generates basic article XML with title, section, footnote, bibliography', function () {
    const inputPath = path.resolve(__dirname, 'inputs/jsonToDocbook.input.json');
    const expectedPath = path.resolve(__dirname, 'outputs/jsonToDocbook.output.xml');
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const expectedXml = fs.readFileSync(expectedPath, 'utf8');

    const xml = jsonToDocbook(input);
    assert.strictEqual(xml.trim(), expectedXml.trim());
  });
});
