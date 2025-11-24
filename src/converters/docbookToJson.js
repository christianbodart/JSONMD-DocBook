// Conversion logic:  DocBook XML -> JSON-plus-markdown
const fs = require('fs');
const xml2js = require('xml2js');

// Recursive helper to convert mixed content nodes to markdown text
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
        case 'emphasis':
          result += node[key].map(e => `*${convertMixedContent(e._ || e)}*`).join('');
          break;
        case 'literal':
          result += node[key].map(lit => `\`${convertMixedContent(lit._ || lit)}\``).join('');
          break;
        case 'footnote':
          result += node[key].map(fn => {
            const id = fn.$?.id || '';
            return `[^${id}]`;
          }).join('');
          break;
        case 'citation':
          result += node[key].map(cit => {
            const id = cit.$?.['xlink:href']?.replace(/^#/, '') || '';
            return `[@${id}]`;
          }).join('');
          break;
        case '_':
          result += node._;
          break;
        default:
          // Recursively process child elements
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

// Convert <para> elements to paragraph JSON
function parseParagraphs(paras) {
  return paras.map(p => ({
    type: 'paragraph',
    text: convertMixedContent(p)
  }));
}

// Convert <section> elements recursively
function parseSections(sections) {
  return sections.map(section => {
    const title = section.title?.[0] || '';
    const content = [];

    if (section.para) {
      content.push(...parseParagraphs(section.para));
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
    // Add other block-level elements as needed

    return {
      title,
      content
    };
  });
}

// Convert <table> elements
function parseTables(tables) {
  return tables.map(table => {
    const caption = table.caption?.[0] || '';
    const headers = table.tgroup?.[0]?.thead?.[0]?.row?.[0]?.entry?.map(e => e._) || [];
    const rows = table.tgroup?.[0]?.tbody?.[0]?.row?.map(row => row.entry.map(e => e._ || '')) || [];

    return {
      type: 'table',
      caption,
      headers,
      rows
    };
  });
}

// Convert <figure> elements
function parseFigures(figures) {
  return figures.map(figure => {
    const caption = figure.title?.[0] || '';
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

// Parse footnotes from the document
function parseFootnotes(article) {
  const footnotes = [];
  if (!article.footnote) return footnotes;

  article.footnote.forEach(fn => {
    footnotes.push({
      id: fn.$?.id || '',
      content: convertMixedContent(fn.para || [])
    });
  });

  return footnotes;
}

// Parse bibliography
function parseBibliography(article) {
  const bibliography = [];
  if (!article.bibliography) return bibliography;

  article.bibliography.forEach(bib => {
    if (!bib.bibliomixed) return;
    bib.bibliomixed.forEach(item => {
      bibliography.push({
        id: item.$?.id || '',
        title: item.title?.[0] || '',
        authors: item.author?.map(a => {
          const pn = a.personname?.[0];
          if (pn) {
            const first = pn.firstname?.[0] || '';
            const last = pn.surname?.[0] || '';
            return `${first} ${last}`.trim();
          }
          return '';
        }) || [],
        year: item.date?.[0] || '',
        publisher: item.publisher?.[0] || ''
      });
    });
  });

  return bibliography;
}

async function docbookToJson(docbookXml) {
  const parser = new xml2js.Parser({ explicitChildren: true, preserveChildrenOrder: true, explicitArray: true, mergeAttrs: true, charsAsChildren: false });
  const result = await parser.parseStringPromise(docbookXml);

  const article = result.article || result['db:article'];
  if (!article) {
    throw new Error("No <article> element found in the XML");
  }

  const json = {
    title: article.title?.[0] || '',
    sections: parseSections(article.section || []),
    footnotes: parseFootnotes(article),
    bibliography: parseBibliography(article)
  };

  return json;
}

module.exports = docbookToJson;
