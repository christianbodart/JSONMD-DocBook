const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

/**
 * Render markdown text to HTML for preview or validation.
 * @param {string} markdownText - The markdown text to render.
 * @returns {string} HTML string.
 */
function renderMarkdownToHtml(markdownText) {
  return md.render(markdownText);
}

/**
 * Extract inline references like footnotes [^id] and citations [@id] from markdown text.
 * @param {string} markdownText
 * @returns {Array<string>} Array of reference IDs found.
 */
function extractReferences(markdownText) {
  const references = [];
  const footnoteRegex = /\[\^([^\]]+)\]/g;
  const citationRegex = /\[@([^\]]+)\]/g;

  let match;
  while ((match = footnoteRegex.exec(markdownText)) !== null) {
    references.push(match[1]);
  }
  while ((match = citationRegex.exec(markdownText)) !== null) {
    references.push(match[1]);
  }

  return references;
}

/**
 * Replace footnote and citation references in markdown text with placeholders or alternate syntax.
 * Example: For preview, replace [^id] → <sup>fn</sup> or similar.
 * @param {string} markdownText
 * @param {function} replacerFn - Function to generate replacement for each matched reference.
 * @returns {string} Modified markdown text.
 */
function replaceReferences(markdownText, replacerFn) {
  return markdownText
    .replace(/\[\^([^\]]+)\]/g, (match, id) => replacerFn('footnote', id))
    .replace(/\[@([^\]]+)\]/g, (match, id) => replacerFn('citation', id));
}

/**
 * Validate basic markdown well-formedness (e.g., balanced emphasis markers).
 * @param {string} markdownText
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidMarkdown(markdownText) {
  // Simple example: check balanced asterisks for bold/italic emphasis
  const countAsterisks = (markdownText.match(/\*/g) || []).length;
  return countAsterisks % 2 === 0;
}

module.exports = {
  renderMarkdownToHtml,
  extractReferences,
  replaceReferences,
  isValidMarkdown
};
