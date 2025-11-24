const { create } = require('xmlbuilder2');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

/**
 * Convert markdown inline tokens to DocBook XML elements recursively.
 * This handles emphasis (*text*), code (`text`), footnote refs ([^id]), citations ([@id]).
 */
function markdownToDocbookNodes(text, parent) {
  const tokens = md.parseInline(text, {});
  const children = tokens[0].children;

  for (let i = 0; i < children.length; i++) {
    const token = children[i];
    switch (token.type) {
      case 'text':
        parent.txt(token.content);
        break;
      case 'em_open':
        const emphasis = parent.ele('emphasis', { role: 'bold' });
        i++;
        while (i < children.length && children[i].type !== 'em_close') {
          if (children[i].type === 'text') {
            emphasis.txt(children[i].content);
          }
          i++;
        }
        break;
      case 'code_inline':
        parent.ele('literal').txt(token.content);
        break;
      case 'footnote_reference': // markdown-it footnote plugin token (custom handling may be needed)
        // typically, [^id] is parsed as footnote_reference with id attr
        parent.ele('footnoteref', { linkend: token.meta.id || '' });
        break;
      case 'link_open':
        // Check if this is a citation: [@id]
        if (token.attrs && token.attrs.find(([k, v]) => k === 'href' && v.startsWith('#'))) {
          const href = token.attrs.find(([k, v]) => k === 'href')[1];
          const citationId = href.slice(1);
          parent.ele('citation', { 'xlink:href': `#${citationId}` });
          // Consume inline text and closing link
          while (children[i].type !== 'link_close') i++;
        }
        break;
      default:
        // handle other inline tokens or skip
        parent.txt(token.content || '');
        break;
    }
  }
}

/**
 * Helper to build a <para> with parsed markdown inside.
 */
function buildPara(parent, paragraph) {
  const para = parent.ele('para');
  markdownToDocbookNodes(paragraph.text, para);
}

/**
 * Build a <section> recursively including subsections and content blocks.
 */
function buildSection(parent, section) {
  const sec = parent.ele('section');
  sec.ele('title').txt(section.title);
  section.content.forEach(block => {
    switch (block.type) {
      case 'paragraph':
        buildPara(sec, block);
        break;
      case 'table':
        buildTable(sec, block);
        break;
      case 'image':
        buildFigure(sec, block);
        break;
      // Expand for lists, admonitions etc.
      default:
        // Unknown content types ignored for now
        break;
    }
  });
}

/**
 * Build a <table> element from JSON representation.
 */
function buildTable(parent, table) {
  const t = parent.ele('table');
  t.ele('title').txt(table.caption || '');
  const tgroup = t.ele('tgroup', { cols: table.headers.length.toString() });

  const thead = tgroup.ele('thead');
  const headRow = thead.ele('row');
  table.headers.forEach(headerText => headRow.ele('entry').txt(headerText));

  const tbody = tgroup.ele('tbody');
  table.rows.forEach(row => {
    const rowEl = tbody.ele('row');
    row.forEach(cellText => rowEl.ele('entry').txt(cellText));
  });
}

/**
 * Build a <figure> element with image.
 */
function buildFigure(parent, image) {
  const fig = parent.ele('figure');
  if (image.caption) {
    fig.ele('title').txt(image.caption);
  }
  const mediaobject = fig.ele('mediaobject');
  const imageobject = mediaobject.ele('imageobject');
  imageobject.ele('imagedata', { fileref: image.src, alttxt: image.alt || '' });
}

/**
 * Build footnotes section.
 */
function buildFootnotes(parent, footnotes) {
  footnotes.forEach(fn => {
    const fnEl = parent.ele('footnote', { id: fn.id });
    fnEl.ele('para').txt(fn.content);
  });
}

/**
 * Build bibliography section.
 */
function buildBibliography(parent, bibliography) {
  const bibEl = parent.ele('bibliography');
  bibliography.forEach(item => {
    const bibItem = bibEl.ele('bibliomixed', { id: item.id });
    bibItem.ele('title').txt(item.title);
    item.authors.forEach(author => {
      const authorEl = bibItem.ele('author');
      const personname = authorEl.ele('personname');
      const parts = author.split(' ');
      personname.ele('firstname').txt(parts[0] || '');
      personname.ele('surname').txt(parts.slice(1).join(' ') || '');
    });
    if (item.year) bibItem.ele('date').txt(item.year);
    if (item.publisher) bibItem.ele('publisher').txt(item.publisher);
  });
}

/**
 * Main function: convert JSON-plus-markdown to DocBook XML string.
 */
function jsonToDocbook(json) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' }).ele('article');
  doc.ele('title').txt(json.title);

  if (Array.isArray(json.sections)) {
    json.sections.forEach(section => buildSection(doc, section));
  }
  if (Array.isArray(json.footnotes)) {
    buildFootnotes(doc, json.footnotes);
  }
  if (Array.isArray(json.bibliography)) {
    buildBibliography(doc, json.bibliography);
  }

  return doc.end({ prettyPrint: true });
}

module.exports = jsonToDocbook;
