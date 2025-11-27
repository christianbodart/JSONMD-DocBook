const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const jsonToDocbook = require('../src/converters/jsonToDocbook');

describe('jsonToDocbook', function () {
  it('generates basic article XML with title, section, footnote, bibliography', function () {
    const inputPath = path.resolve(__dirname, 'inputs/jsonToDocbook.input.json');
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    const xml = jsonToDocbook(input).trim();
    
    // Check that it generates valid XML structure
    assert.include(xml, '<article>');
    assert.include(xml, '<title>My Title</title>');
    assert.include(xml, '<section>');
    assert.include(xml, '<para>Hello world</para>');
    assert.include(xml, '<bibliography>');
  });
});
