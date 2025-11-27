const assert = require('chai').assert;
const docbookToJson = require('../src/converters/docbookToJson');

describe('docbookToJson', function () {
  it('parses a simple article with sections, footnotes and bibliography', async function () {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<article>
  <title>My Title</title>
  <section>
    <title>Sec 1</title>
    <para>Paragraph text</para>
  </section>
  <footnote id="f1"><para>Footnote text</para></footnote>
  <bibliography>
    <bibliomixed id="b1">
      <title>Book</title>
      <author><personname><firstname>John</firstname><surname>Doe</surname></personname></author>
      <date>2020</date>
      <publisher>Pub</publisher>
    </bibliomixed>
  </bibliography>
</article>`;

    const json = await docbookToJson(xml);
    assert.strictEqual(json.title, 'My Title');
    assert.isArray(json.sections);
    assert.strictEqual(json.sections[0].title, 'Sec 1');
    assert.isArray(json.footnotes);
    assert.strictEqual(json.footnotes[0].id, 'f1');
    assert.isArray(json.bibliography);
    assert.strictEqual(json.bibliography[0].id, 'b1');
  });
});
