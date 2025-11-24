
const fs = require('fs');
const path = require('path');
const assert = require('chai').assert;
const deepEqual = require('deep-equal');
const markdownIt = require('markdown-it')();

const convertJsonToDocbookXml = require('../src/converters/jsonToDocbook');
const convertDocbookXmlToJson = require('../src/converters/docbookToJson');

describe('Roundtrip Conversion Tests', function () {
  it('should roundtrip an article without loss of data', async function () {
    const inputPath = path.resolve(__dirname, 'expectedOutputs/article000.json');
    const expectedDocbookPath = path.resolve(__dirname, 'inputs/article000.xml');

    const jsonInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const expectedDocbookXml = fs.readFileSync(expectedDocbookPath, 'utf8').trim();

    // Convert JSON to DocBook XML
    const generatedDocbookXml = await convertJsonToDocbookXml(jsonInput);

    // Basic string comparison of DocBook XML output (could add schema validation here)
    assert.strictEqual(generatedDocbookXml.trim(), expectedDocbookXml, 'Generated DocBook XML should match expected');

    // Convert back DocBook XML to JSON-plus-markdown
    const roundTripJson = await convertDocbookXmlToJson(generatedDocbookXml);

    // Deep compare to original JSON input
    assert.isTrue(deepEqual(jsonInput, roundTripJson), 'Round-trip JSON should match original input');

    // Extra: verify markdown content renders consistently
    assert.strictEqual(
      markdownIt.render(jsonInput.sections[0].content[0].text),
      markdownIt.render(roundTripJson.sections[0].content[0].text),
      'Markdown rendered output should be consistent after roundtrip'
    );
  });
});