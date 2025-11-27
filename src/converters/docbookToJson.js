const xml2js = require('xml2js');

// Convert mixed content and inline elements to markdown text recursively
function convertMixedContent(node) {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(convertMixedContent).join('');
  }
  if (typeof node === 'object') {
    let result = '';
    for (const key in node) {
      switch (key) {
        case 'linebreak':
          result += '\n'; // Markdown line break
          break;  
        case 'emphasis':
          // Treat emphasis role="bold" as *text*
          result += node[key].map(e => {
            const text = convertMixedContent(e._ || e);
            if (e.$?.role === 'bold') {
              return `*${text}*`;
            }
            return `_${text}_`; // fallback to _italic_
          }).join('');
          break;
        case 'literal':
          // Inline code with `code`
          result += node[key].map(lit => `\`${convertMixedContent(lit._ || lit)}\``).join('');
          break;
        case 'footnote':
          // Footnote text ignored here; footnotes handled separately
          break;
        case 'footnoteref':
          // Footnote reference [^id]
          result += node[key].map(ref => {
            const id = ref.$?.linkend || '';
            return `[^${id}]`;
          }).join('');
          break;
        case 'citation':
          // Citation reference [@id]
          result += node[key].map(cit => {
            const id = cit.$?.['xlink:href']?.replace(/^#/, '') || '';
            return `[@${id}]`;
          }).join('');
          break;
        case 'phrase':
          // Marked text with role="mark", inserted text with role="ins"
          result += node[key].map(p => {
            const text = convertMixedContent(p._ || p);
            if (p.$?.role === 'mark') {
              return `==${text}==`; // marked text
            }
            if (p.$?.role === 'ins') {
              return `++${text}++`; // inserted text
            }
            return text;
          }).join('');
          break;
        case 'abbrev':
          // Abbreviation as *[abbr]: Full text* handled in footnotes/bibliography maybe
          result += node[key].map(abbr => convertMixedContent(abbr._ || abbr)).join('');
          break;
        case 'variablelist':
          // Convert DocBook definition list to markdown deflist syntax
          const entries = node[key].flatMap(vl => {
            return vl.varlistentry?.map(ve => {
              const term = ve.term?.[0] || '';
              const def = ve.listitem?.[0].para?.[0] || '';
              return `${term}\n: ${def}\n`;
            }) || [];
          });
          result += entries.join('\n');
          break;
        case '_':
          result += node._;
          break;
        default:
          // Recursively process other children
          if (Array.isArray(node[key])) {
            result += node[key].map(convertMixedContent).join('');
          }
          break;
      }
    }
    return result;
  }
  return '';
}

// Parse paragraphs including markdown inline conversions
function parseParagraphs(paras) {
  return paras.map(p => {
    const text = typeof p === 'string' ? p : (p._ || convertMixedContent(p));
    return {
      type: 'paragraph',
      text
    };
  });
}

// Safely extract text from various xml2js node shapes
function getText(node) {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return getText(node[0]);
  if (typeof node === 'object') {
    if (typeof node._ === 'string') return node._;
    // If the node directly contains text-like children, try to join them
    if (node.hasOwnProperty('_')) return String(node._ || '');
    // Fallback: try to stringify primitive properties
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string') return v;
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    }
  }
  return '';
}

// Parse sections recursively
function parseSections(sections) {
  return sections.map(section => {
    const title = getText(section.title?.[0] || section.title) || '';
    let content = [];

    if (section.para) {
      content.push(...parseParagraphs(section.para));
    }
    if (section.variablelist) {
      // Treat variablelist as definition list paragraphs
      section.variablelist.forEach(vl => {
        content.push({
          type: 'paragraph',
          text: convertMixedContent(vl)
        });
      });
    }
    if (section.section) {
      content.push(...parseSections(section.section));
    }
    if (section.table) {
      content.push(...parseTables(section.table));
    }
    if (section.figure) {
      content.push(...parseFigures(section.figure));
    }

    return { title, content };
  });
}

// Parse tables
function parseTables(tables) {
  return tables.map(table => {
    const caption = getText(table.caption?.[0] || table.caption) || '';
    const headers = table.tgroup?.[0]?.thead?.[0]?.row?.[0]?.entry?.map(e => getText(e)) || [];
    const rows = table.tgroup?.[0]?.tbody?.[0]?.row?.map(row => row.entry.map(e => getText(e) || '')) || [];

    return {
      type: 'table',
      caption,
      headers,
      rows
    };
  });
}

// Parse figures
function parseFigures(figures) {
  return figures.map(figure => {
    const caption = getText(figure.title?.[0] || figure.title) || '';
    const mediaobject = figure.mediaobject?.[0];
    const imageData = mediaobject?.imageobject?.[0]?.imagedata?.[0].$ || {};
    const src = imageData.fileref || '';
    const alt = imageData.alttxt || '';

    return {
      type: 'image',
      caption,
      src,
      alt
    };
  });
}

// Parse footnotes fully
function parseFootnotes(article) {
  const footnotes = [];
  if (!article.footnote) return footnotes;

  article.footnote.forEach(fn => {
    // fn.para is an array; take first element's text or use getText
    const paraContent = fn.para && fn.para[0];
    const content = typeof paraContent === 'string' ? paraContent : getText(paraContent);
    footnotes.push({
      id: fn.$?.id || '',
      content: content || ''
    });
  });

  return footnotes;
}

// Parse bibliography entries
function parseBibliography(article) {
  const bibliography = [];
  if (!article.bibliography) return bibliography;

  article.bibliography.forEach(bib => {
    if (!bib.bibliomixed) return;
    bib.bibliomixed.forEach(item => {
      const authors = (item.author || []).map(a => {
        // author may contain personname or direct personname object
        const pn = (a.personname && a.personname[0]) || a.personname || a;
        const first = getText(pn.firstname || pn.firstname?.[0]);
        const last = getText(pn.surname || pn.surname?.[0]);
        const combined = `${first} ${last}`.trim();
        return combined || getText(a);
      });

      bibliography.push({
        id: getText(item.$?.id) || '',
        title: getText(item.title?.[0] || item.title) || '',
        authors: authors || [],
        year: getText(item.date?.[0] || item.date) || '',
        publisher: getText(item.publisher?.[0] || item.publisher) || ''
      });
    });
  });

  return bibliography;
}

async function docbookToJson(docbookXml) {
  const parser = new xml2js.Parser({
  explicitChildren: true,
  preserveChildrenOrder: true,
  trim: false,              // Do not trim whitespace
  explicitArray: true,
  charsAsChildren: false,   // Disable to avoid text node duplication
  charkey: '_'
});
  const result = await parser.parseStringPromise(docbookXml);

  const article = result.article || result['db:article'];
  if (!article) {
    throw new Error("No <article> element found in the XML");
  }

  return {
    title: getText(article.title?.[0] || article.title) || '',
    sections: parseSections(article.section || []),
    footnotes: parseFootnotes(article),
    bibliography: parseBibliography(article)
  };
}

module.exports = docbookToJson;
