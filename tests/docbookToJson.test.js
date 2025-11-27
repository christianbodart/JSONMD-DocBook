const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const docbookToJson = require('../src/converters/docbookToJson');

describe('docbookToJson', function () {
  it('parses a simple article with sections, footnotes and bibliography', async function () {
    const xmlPath = path.resolve(__dirname, 'inputs/docbookToJson.input.xml');
    const expectedPath = path.resolve(__dirname, 'outputs/docbookToJson.output.json');
    const xml = fs.readFileSync(xmlPath, 'utf8');
    const expectedJson = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));

    const json = await docbookToJson(xml);
    assert.deepEqual(json, expectedJson);
  });
});
