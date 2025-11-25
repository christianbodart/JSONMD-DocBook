const pandoc = require('node-pandoc');
const path = require('path');

/**
 * Convert markdown string to Pandoc JSON AST
 */
function markdownToPandocJson(markdown) {
  return new Promise((resolve, reject) => {
    const args = ['-f', 'markdown', '-t', 'json'];
    pandoc(markdown, args, (err, result) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(result));
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}

/**
 * Convert Pandoc JSON AST to DocBook XML string
 */
function pandocJsonToDocBook(json) {
  return new Promise((resolve, reject) => {
    const args = ['-f', 'json', '-t', 'docbook'];
    const jsonString = JSON.stringify(json);
    pandoc(jsonString, args, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Convert DocBook XML string back to Pandoc JSON AST
 */
function docbookToPandocJson(docbookXml) {
  return new Promise((resolve, reject) => {
    const args = ['-f', 'docbook', '-t', 'json'];
    pandoc(docbookXml, args, (err, result) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(result));
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}

/**
 * Convert Pandoc JSON AST back to markdown string
 */
function pandocJsonToMarkdown(json) {
  return new Promise((resolve, reject) => {
    const args = ['-f', 'json', '-t', 'markdown'];
    const jsonString = JSON.stringify(json);
    pandoc(jsonString, args, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

module.exports = {
  markdownToPandocJson,
  pandocJsonToDocBook,
  docbookToPandocJson,
  pandocJsonToMarkdown
};
