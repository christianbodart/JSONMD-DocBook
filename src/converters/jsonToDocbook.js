const { create } = require('xmlbuilder2');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ breaks: true });

// Helper: convert markdown inline tokens to DocBook nodes, handling emphasis, literal, footnotes, citations, marked/inserted text
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
        // Always write explicit <linebreak/> for any break token (hard or soft)
        parent.ele('linebreak');
        break;

      case 'em_open':
        // Emphasis (italic or bold, assume bold for Pandoc/DocBook mapping of *)
        const em = parent.ele('emphasis', { role: 'bold' });
        i++;
        while (i < children.length && children[i].type !== 'em_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, em);
          i++;
        }
        break;

      case 'em_close':
        // End of emphasis. Token is handled by the open tag logic above.
        break;

      case 'strong_open':
        // Strong emphasis
        const strong = parent.ele('emphasis', { role: 'bold' });
        i++;
        while (i < children.length && children[i].type !== 'strong_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, strong);
          i++;
        }
        break;

      case 'strong_close':
        break;

      case 'code_inline':
        parent.ele('literal').txt(token.content);
        break;

      case 'link_open':
        // Footnote/citation detection depends on href or title attribute conventions—expand as needed.
        const href = token.attrs?.find(([name]) => name === "href");
        if (href && href[1].startsWith("#fn")) {
          // Footnote references, e.g. href="#fn1"
          parent.ele('footnoteref', { linkend: href[1].slice(1) });
        } else if (href && href[1].startsWith("#cite")) {
          // Citation references, e.g. href="#cite-id"
          parent.ele('citation', { "xlink:href": href[1] });
        }
        // Move to link_close, skipping inline text
        while (i < children.length && children[i].type !== 'link_close') i++;
        break;

      case 'link_close':
        break;

      case 'footnote_ref':
        // If using markdown-it-footnote plugin
        parent.ele('footnoteref', { linkend: token.meta && token.meta.id ? token.meta.id : '' });
        break;

      // Plugin: 'mark_open' and 'mark_close' for ==marked==
      case 'mark_open':
        const mark = parent.ele('phrase', { role: 'mark' });
        i++;
        while (i < children.length && children[i].type !== 'mark_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, mark);
          i++;
        }
        break;
      case 'mark_close':
        break;

      // Plugin: 'ins_open' and 'ins_close' for ++inserted++
      case 'ins_open':
        const ins = parent.ele('phrase', { role: 'ins' });
        i++;
        while (i < children.length && children[i].type !== 'ins_close') {
          markdownToDocbookNodes(children[i].content || children[i].markup, ins);
          i++;
        }
        break;
      case 'ins_close':
        break;

      default:
        // Pipe through or ignore any other plugin extensions or custom tokens
        if (token.content) parent.txt(token.content);
        break;
    }
    i++;
  }
}

// Build <para> from paragraph JSON with markdown inline to DocBook
function buildPara(parent, paragraph) {
  const para = parent.ele('para');
  markdownToDocbookNodes(paragraph.text, para);
}

// Build <section> recursively with subsections and blocks
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
      case 'deflist':
        buildDefinitionList(sec, block);
        break;
      // Expand for other types as needed
      default:
        break;
    }
  });
}

// Build <table> from JSON representation
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

// Build <figure> element with image
function buildFigure(parent, image) {
  const fig = parent.ele('figure');
  if (image.caption) {
    fig.ele('title').txt(image.caption);
  }
  const mediaobject = fig.ele('mediaobject');
  const imageobject = mediaobject.ele('imageobject');
  imageobject.ele('imagedata', { fileref: image.src, alttxt: image.alt || '' });
}

// Build definition list (<variablelist>) from JSON deflist type
function buildDefinitionList(parent, deflist) {
  const vl = parent.ele('variablelist');
  deflist.items.forEach(item => {
    const entry = vl.ele('varlistentry');
    entry.ele('term').txt(item.term);
    const li = entry.ele('listitem');
    li.ele('para').txt(item.definition);
  });
}

// Build footnotes
function buildFootnotes(parent, footnotes) {
  footnotes.forEach(fn => {
    const fnEl = parent.ele('footnote', { id: fn.id });
    fnEl.ele('para').txt(fn.content);
  });
}

// Build bibliography
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

// Main JSON to DocBook conversion method updated:
function jsonToDocbook(json) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' }).ele('article');
  doc.ele('title').txt(json.title);

  if (Array.isArray(json.sections)) {
    json.sections.forEach(section => {
      buildSection(doc, section);
    });
  }
  if (Array.isArray(json.footnotes)) {
    buildFootnotes(doc, json.footnotes);
  }
  if (Array.isArray(json.bibliography)) {
    buildBibliography(doc, json.bibliography);
  }

  // Use headless: true to exclude XML declaration
  return doc.end({ prettyPrint: true, headless: true });
}

module.exports = jsonToDocbook;
