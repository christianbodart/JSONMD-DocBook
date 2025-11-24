const { create } = require('xmlbuilder2');

/**
 * Create a new XML document with a root element and optional attributes.
 * @param {string} rootName - The root element name.
 * @param {object} [attributes={}] - Attributes for the root element.
 * @returns {XMLBuilder} An xmlbuilder2 document instance.
 */
function createXmlDocument(rootName, attributes = {}) {
  return create({ version: '1.0', encoding: 'UTF-8' }).ele(rootName, attributes);
}

/**
 * Add a child element with optional text and attributes to a parent element.
 * @param {XMLBuilder} parent - Parent XML element.
 * @param {string} name - Child element name.
 * @param {string} [text] - Text content for the child.
 * @param {object} [attributes={}] - Attributes for the child element.
 * @returns {XMLBuilder} The new child element.
 */
function addElement(parent, name, text = '', attributes = {}) {
  const child = parent.ele(name, attributes);
  if (text) {
    child.txt(text);
  }
  return child;
}

/**
 * Serialize XML document or element to pretty-printed string.
 * @param {XMLBuilder} xmlDoc - XML document or element.
 * @returns {string} Pretty-printed XML string.
 */
function serializeXml(xmlDoc) {
  return xmlDoc.end({ prettyPrint: true });
}

/**
 * Parse simple XML string and return xmlbuilder2 document.
 * @param {string} xmlString - XML string.
 * @returns {XMLDocument} Parsed xmlbuilder2 document.
 */
function parseXml(xmlString) {
  return create(xmlString);
}

module.exports = {
  createXmlDocument,
  addElement,
  serializeXml,
  parseXml
};
