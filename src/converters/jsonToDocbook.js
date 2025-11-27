const { create } = require('xmlbuilder2');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ breaks: true });

// Element builder handlers for different content types
const blockBuilders = {
  paragraph: (parent, block) => {
    const para = parent.ele('para');
    markdownToDocbookNodes(block.text, para);
  },
  
  table: (parent, table) => {
    const t = parent.ele('table');
    t.ele('title').txt(table.caption || '');
    const tgroup = t.ele('tgroup', { cols: table.headers.length.toString() });
    const thead = tgroup.ele('thead');
    const headRow = thead.ele('row');
    table.headers.forEach(h => headRow.ele('entry').txt(h));
    const tbody = tgroup.ele('tbody');
    table.rows.forEach(row => {
      const rowEl = tbody.ele('row');
      row.forEach(cell => rowEl.ele('entry').txt(cell));
    });
  },
  
  image: (parent, image) => {
    const fig = parent.ele('figure');
    if (image.caption) fig.ele('title').txt(image.caption);
    const mediaobject = fig.ele('mediaobject');
    const imageobject = mediaobject.ele('imageobject');
    imageobject.ele('imagedata', { fileref: image.src, alttxt: image.alt || '' });
  },
  
  deflist: (parent, deflist) => {
    const vl = parent.ele('variablelist');
    deflist.items.forEach(item => {
      const entry = vl.ele('varlistentry');
      entry.ele('term').txt(item.term);
      const li = entry.ele('listitem');
      li.ele('para').txt(item.definition);
    });
  }
};

// Helper: convert markdown inline tokens to DocBook nodes
function markdownToDocbookNodes(markdownText, parent) {
  const tokens = md.parseInline(markdownText, {});
  let i = 0;
  const children = tokens[0].children;

  while (i < children.length) {
    const token = children[i];
    switch (token.type) {
      case 'text':
        parent.txt(token.content);
        break;

      case 'softbreak':
      case 'hardbreak':
        parent.ele('linebreak');
        break;

      case 'em_open': {
        const em = parent.ele('emphasis', { role: 'bold' });
        i++;
        while (i < children.length && children[i].type !== 'em_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, em);
          i++;
        }
        break;
      }

      case 'strong_open': {
        const strong = parent.ele('emphasis', { role: 'bold' });
        i++;
        while (i < children.length && children[i].type !== 'strong_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, strong);
          i++;
        }
        break;
      }

      case 'code_inline':
        parent.ele('literal').txt(token.content);
        break;

      case 'link_open': {
        const href = token.attrs?.find(([name]) => name === 'href');
        if (href && href[1].startsWith('#fn')) {
          parent.ele('footnoteref', { linkend: href[1].slice(1) });
        } else if (href && href[1].startsWith('#cite')) {
          parent.ele('citation', { 'xlink:href': href[1] });
        }
        while (i < children.length && children[i].type !== 'link_close') i++;
        break;
      }

      case 'footnote_ref':
        parent.ele('footnoteref', { linkend: token.meta?.id || '' });
        break;

      case 'mark_open': {
        const mark = parent.ele('phrase', { role: 'mark' });
        i++;
        while (i < children.length && children[i].type !== 'mark_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, mark);
          i++;
        }
        break;
      }

      case 'ins_open': {
        const ins = parent.ele('phrase', { role: 'ins' });
        i++;
        while (i < children.length && children[i].type !== 'ins_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, ins);
          i++;
        }
        break;
      }

      default:
        if (token.content) parent.txt(token.content);
        break;
    }
    i++;
  }
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
    const fnEl = parent.ele('footnote', { id: fn.id });
    fnEl.ele('para').txt(fn.content);
  });
}

// Build bibliography using a factory function
function buildBibliography(parent, bibliography) {
  const bibEl = parent.ele('bibliography');
  bibliography.forEach(item => {
    const bibItem = bibEl.ele('bibliomixed', { id: item.id });
    bibItem.ele('title').txt(item.title);
    item.authors.forEach(author => {
      const authorEl = bibItem.ele('author');
      const pn = authorEl.ele('personname');
      const parts = author.split(' ');
      pn.ele('firstname').txt(parts[0] || '');
      pn.ele('surname').txt(parts.slice(1).join(' ') || '');
    });
    if (item.year) bibItem.ele('date').txt(item.year);
    if (item.publisher) bibItem.ele('publisher').txt(item.publisher);
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
