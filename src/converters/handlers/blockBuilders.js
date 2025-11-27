// Block-level content builders for JSON to DocBook conversion
const { markdownToDocbookNodes } = require('./tokenHandlers');

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

module.exports = blockBuilders;
