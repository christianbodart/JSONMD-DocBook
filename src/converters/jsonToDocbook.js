// Conversion logic: JSON-plus-markdown -> DocBook XML
const { create } = require('xmlbuilder2');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

// Convert markdown inline tokens to DocBook XML nodes
function markdownToDocbook(text) {
  const tokens = md.parseInline(text, {});
  const result = [];

  tokens[0].children.forEach(token => {
    switch (token.type) {
      case 'text':
        result.push(token.content);
        break;
      case 'em_open':
        result.push({ emphasis: { '@role': 'bold', '#': '' } });
        break;
      case 'em_close':
        // Closing handled implicitly
        break;
      case 'footnote_ref':
        // Not standard markdown inline in markdown-it; custom footnote references
        break;
      default:
        // Handle other inline types (e.g., strong, code, etc.) if needed
        result.push(token.content || '');
        break;
    }
  });

  // xmlbuilder2 expects a flat array of strings and objects for mixed content
  // Post-process to merge valid emphasis nodes with their text content
  // For simplicity, here just return plain text (consider enhancing for full fidelity)
  return text;
}

function buildPara(doc, paragraph) {
  // Create <para> with inline DocBook representation of markdown text
  return doc.ele('para').txt(paragraph.text);
}

function buildSection(doc, section) {
  const sec = doc.ele('section');
  sec.ele('title').txt(section.title);
  section.content.forEach(contentItem => {
    switch (contentItem.type) {
      case 'paragraph':
        buildPara(sec, contentItem);
        break;
      case 'table':
        buildTable(sec, contentItem);
        break;
      case 'image':
        buildFigure(sec, contentItem);
        break;
      // expand as needed for lists, figures, etc.
      default:
        break;
    }
  });
  return sec;
}

function buildTable(doc, table) {
  const t = doc.ele('table');
  t.ele('title').txt(table.caption);

  const tgroup = t.ele('tgroup', { cols: table.headers.length });
  const thead = tgroup.ele('thead');
  const headRow = thead.ele('row');
  table.headers.forEach(h => headRow.ele('entry').txt(h));

  const tbody = tgroup.ele('tbody');
  table.rows.forEach(row => {
    const rowEl = tbody.ele('row');
    row.forEach(cell => rowEl.ele('entry').txt(cell));
  });
}

function buildFigure(doc, image) {
  const fig = doc.ele('figure');
  if (image.caption) {
    fig.ele('title').txt(image.caption);
  }
  const mediaobj = fig.ele('mediaobject');
  const imageobj = mediaobj.ele('imageobject');
  imageobj.ele('imagedata', { fileref: image.src, alttxt: image.alt || '' });
}

function buildFootnotes(doc, footnotes) {
  footnotes.forEach(fn => {
    const fnEl = doc.ele('footnote', { id: fn.id });
    fnEl.ele('para').txt(fn.content);
  });
}

function buildBibliography(doc, bibliography) {
  const bibEl = doc.ele('bibliography');
  bibliography.forEach(item => {
    const bibItem = bibEl.ele('bibliomixed', { id: item.id });
    bibItem.ele('title').txt(item.title);
    item.authors.forEach(author => {
      const authorEl = bibItem.ele('author');
      const pn = authorEl.ele('personname');
      const [firstname, surname] = author.split(' ');
      pn.ele('firstname').txt(firstname || '');
      pn.ele('surname').txt(surname || '');
    });
    bibItem.ele('date').txt(item.year || '');
    bibItem.ele('publisher').txt(item.publisher || '');
  });
}

function jsonToDocbook(json) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('article');

  doc.ele('title').txt(json.title);

  if (json.sections && Array.isArray(json.sections)) {
    json.sections.forEach(section => {
      buildSection(doc, section);
    });
  }

  if (json.footnotes && Array.isArray(json.footnotes)) {
    buildFootnotes(doc, json.footnotes);
  }

  if (json.bibliography && Array.isArray(json.bibliography)) {
    buildBibliography(doc, json.bibliography);
  }

  return doc.end({ prettyPrint: true });
}

module.exports = jsonToDocbook;
