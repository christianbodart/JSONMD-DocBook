// Markdown token handlers for converting markdown inline elements to DocBook
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ breaks: true });

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

module.exports = {
  tokenHandlers,
  markdownToDocbookNodes,
  TokenIterator,
  processToken
};
