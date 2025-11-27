const assert = require('chai').assert;
const jsonToDocbook = require('../src/converters/jsonToDocbook');

describe('jsonToDocbook', function () {
  it('generates basic article XML with title, section, footnote, bibliography', function () {
    const input = {
      title: 'My Title',
      sections: [
        {
          title: 'Sec 1',
          content: [{ type: 'paragraph', text: 'Hello world' }]
        }
      ],
      footnotes: [{ id: 'f1', content: 'Footnote text' }],
      bibliography: [
        { id: 'b1', title: 'Book', authors: ['John Doe'], year: '2020', publisher: 'Pub' }
      ]
    };

    const xml = jsonToDocbook(input);
    assert.isString(xml);
    assert.match(xml, /<title>My Title<\/title>/);
    assert.match(xml, /<section>/);
    assert.match(xml, /<title>Sec 1<\/title>/);
    assert.match(xml, /<footnote[^>]*id="f1"/);
    assert.match(xml, /<bibliomixed[^>]*id="b1"/);
  });
});
