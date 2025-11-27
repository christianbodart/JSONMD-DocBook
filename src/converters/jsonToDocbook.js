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

// Factory for creating paired element handlers (open/close tokens)
function createPairedHandler(elementName, attrs = {}, closingType) {
  return (parent, token, children, iterator) => {
    const elem = parent.ele(elementName, attrs);
    iterator.next(); // skip open token
    while (iterator.current() && iterator.current().type !== closingType) {
      processToken(elem, iterator.current(), children, iterator);
      iterator.next();
    }
  };
}

// Simple token handlers
const tokenHandlers = {
  text: (parent, token) => parent.txt(token.content),
  
  softbreak: (parent) => parent.ele('linebreak'),
  hardbreak: (parent) => parent.ele('linebreak'),
  
  code_inline: (parent, token) => parent.ele('literal').txt(token.content),
  
  footnote_ref: (parent, token) => 
    parent.ele('footnoteref', { linkend: token.meta?.id || '' }),
  
  em_open: createPairedHandler('emphasis', { role: 'bold' }, 'em_close'),
  strong_open: createPairedHandler('emphasis', { role: 'bold' }, 'strong_close'),
  mark_open: createPairedHandler('phrase', { role: 'mark' }, 'mark_close'),
  ins_open: createPairedHandler('phrase', { role: 'ins' }, 'ins_close'),
  
  link_open: (parent, token, children, iterator) => {
    const href = token.attrs?.find(([name]) => name === 'href');
    if (href && href[1].startsWith('#fn')) {
      parent.ele('footnoteref', { linkend: href[1].slice(1) });
    } else if (href && href[1].startsWith('#cite')) {
      parent.ele('citation', { 'xlink:href': href[1] });
    }
    // Skip to link_close
    iterator.next();
    while (iterator.current() && iterator.current().type !== 'link_close') {
      iterator.next();
    }
  },
};

// Iterator wrapper for token stream
class TokenIterator {
  constructor(children) {
    this.children = children;
    this.index = 0;
  }
  
  current() {
    return this.children[this.index];
  }
  
  next() {
    this.index++;
  }
}

// Process a single token
function processToken(parent, token, children, iterator) {
  const handler = tokenHandlers[token.type];
  if (handler) {
    handler(parent, token, children, iterator);
  } else if (token.content) {
    parent.txt(token.content);
  }
}

// Convert markdown inline tokens to DocBook nodes
function markdownToDocbookNodes(markdownText, parent) {
  const tokens = md.parseInline(markdownText, {});
  const children = tokens[0].children;
  const iterator = new TokenIterator(children);
  
  while (iterator.current()) {
    processToken(parent, iterator.current(), children, iterator);
    iterator.next();
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
