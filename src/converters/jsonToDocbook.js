const { create } = require('xmlbuilder2');
const blockBuilders = require('./handlers/blockBuilders');
const { markdownToDocbookNodes } = require('./handlers/tokenHandlers');

// Configuration: allow toggling between `xml:id` and `id` via env var
const useXmlId = process.env.USE_XML_ID !== 'false';
function idAttr(id) {
  if (!id) return {};
  return useXmlId ? { 'xml:id': id } : { id };
}

// Build sections recursively using handler map for content blocks
function buildSections(parent, sections) {
  sections.forEach(section => {
    const sec = parent.ele('section');
    sec.ele('title').txt(section.title);
    if (Array.isArray(section.content)) {
      section.content.forEach(block => {
        const builder = blockBuilders[block.type];
        if (builder) builder(sec, block);
      });
    }
  });
}

// Build footnotes using a factory function
function buildFootnotes(parent, footnotes) {
  footnotes.forEach(fn => {
    const attrs = idAttr(fn.id);
    const fnEl = parent.ele('footnote', attrs);
    fnEl.ele('para').txt(fn.content);
  });
}

// Build bibliography using a factory function
function buildBibliography(parent, bibliography) {
  const bibEl = parent.ele('bibliography');
  bibliography.forEach(item => {
    const attrs = idAttr(item.id);
    const bibItem = bibEl.ele('bibliomixed', attrs);
    bibItem.ele('title').txt(item.title);
    item.authors.forEach(author => {
      const authorEl = bibItem.ele('author');
      const pn = authorEl.ele('personname');
      const parts = author.split(' ');
      pn.ele('firstname').txt(parts[0] || '');
      pn.ele('surname').txt(parts.slice(1).join(' ') || '');
    });
    if (item.year) bibItem.ele('date').txt(item.year);
    if (item.publisher) bibItem.ele('publisher').ele('publishername').txt(item.publisher);
  });
}

// Main JSON to DocBook conversion
function jsonToDocbook(json) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' }).ele('article');
  doc.ele('title').txt(json.title);

  if (Array.isArray(json.sections)) buildSections(doc, json.sections);
  if (Array.isArray(json.footnotes)) buildFootnotes(doc, json.footnotes);
  if (Array.isArray(json.bibliography)) buildBibliography(doc, json.bibliography);

  return doc.end({ prettyPrint: true, headless: true });
}

module.exports = jsonToDocbook;
