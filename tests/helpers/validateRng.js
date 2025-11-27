// RNG validation helper using Jing
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Validate XML against a RELAX NG schema using Jing
 * @param {string} xmlPath - Path to XML file to validate
 * @param {string} rngPath - Path to RNG schema file
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateAgainstRng(xmlPath, rngPath) {
  try {
    // Ensure both files exist
    if (!fs.existsSync(xmlPath)) {
      return { isValid: false, errors: [`XML file not found: ${xmlPath}`] };
    }
    if (!fs.existsSync(rngPath)) {
      return { isValid: false, errors: [`RNG schema not found: ${rngPath}`] };
    }

    // Read XML and determine whether we need to wrap the fragment
    const originalXml = fs.readFileSync(xmlPath, 'utf8');
    // strip any xml prolog
    const stripped = originalXml.replace(/^\s*<\?xml[\s\S]*?\?>\s*/, '');

    // detect root element start tag
    const startTagMatch = stripped.match(/^<\s*([^\s>]+)([^>]*)>/);
    let root = null;
    let xmlToValidatePath = xmlPath;
    let tempPath = null;

    if (startTagMatch && startTagMatch[1]) {
      root = startTagMatch[1].includes(':') ? startTagMatch[1].split(':').pop() : startTagMatch[1];
      // check whether root start tag already contains a default namespace
      const attrs = startTagMatch[2] || '';
      const hasXmlns = /\bxmlns(=|:)/.test(attrs) || /\bxmlns=/.test(attrs);
      const needsXlink = /\bxlink:/.test(stripped);

      const allowedRoots = new Set(['book', 'set', 'article', 'chapter', 'refentry', 'section', 'simplesect', 'articleinfo']);
      if (allowedRoots.has(root)) {
        const rest = stripped.slice(startTagMatch[0].length);
        const needsTitle = !/^\s*<(info|subtitle|title|titleabbrev)/i.test(rest);
        const nsAttrs = hasXmlns ? '' : ` xmlns="http://docbook.org/ns/docbook"${needsXlink ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''}`;
        if (!hasXmlns || needsTitle) {
          // create a temporary copy with namespace and/or injected minimal title to satisfy ordering
          const injectedTitle = needsTitle ? '<title>temp</title>' : '';
          const newStart = `<${startTagMatch[1]}${attrs}${nsAttrs}>`;
          let newDoc = `<?xml version="1.0"?>\n${newStart}${injectedTitle}${rest}`;
          // convert plain id attributes to xml:id for schema compatibility
          newDoc = newDoc.replace(/\s+id=("[^"]*")/g, ' xml:id=$1');
          const tmpName = `jsonmd-docbook-rng-${Date.now()}-${Math.random().toString(36).slice(2)}.xml`;
          tempPath = path.join(os.tmpdir(), tmpName);
          fs.writeFileSync(tempPath, newDoc, 'utf8');
          xmlToValidatePath = tempPath;
        }
        // otherwise validate original file as-is
      } else {
        // root exists but is not one of the allowed roots; wrap the fragment content
        const needsXlinkWrap = /\bxlink:/.test(stripped);
        const nsDecl = ` xmlns="http://docbook.org/ns/docbook"${needsXlinkWrap ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''}`;
        const inner = stripped; // stripped has no prolog
        // wrap into an article with a title to satisfy content model
        let wrapped = `<?xml version="1.0"?>\n<article${nsDecl}>\n<title>temp</title>\n${inner}\n</article>`;
        // convert plain id attributes to xml:id for schema compatibility
        wrapped = wrapped.replace(/\s+id=("[^"]*")/g, ' xml:id=$1');
        const tmpName = `jsonmd-docbook-rng-${Date.now()}-${Math.random().toString(36).slice(2)}.xml`;
        tempPath = path.join(os.tmpdir(), tmpName);
        fs.writeFileSync(tempPath, wrapped, 'utf8');
        xmlToValidatePath = tempPath;
      }
    } else {
      // No root detected; wrap as fragment
      const needsXlinkWrap = /\bxlink:/.test(stripped);
      const nsDecl = ` xmlns="http://docbook.org/ns/docbook"${needsXlinkWrap ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''}`;
      const inner = stripped;
      const wrapped = `<?xml version="1.0"?>\n<book${nsDecl} version=\"5.0\">\n${inner}\n</book>`;
      const tmpName = `jsonmd-docbook-rng-${Date.now()}-${Math.random().toString(36).slice(2)}.xml`;
      tempPath = path.join(os.tmpdir(), tmpName);
      fs.writeFileSync(tempPath, wrapped, 'utf8');
      xmlToValidatePath = tempPath;
    }

    let jingCmd;
    const javaPath = 'C:\\Program Files (x86)\\Java\\jre1.8.0_471\\bin\\java.exe';
    // Try jar first (Windows-friendly approach)
    const jarPath = path.resolve(__dirname, '../../tools/jing.jar');
    if (fs.existsSync(jarPath)) {
      jingCmd = `"${javaPath}" -jar "${jarPath}" "${rngPath}" "${xmlToValidatePath}"`;
    } else {
      // Fallback to npx if available
      try {
        execSync('npx -v', { stdio: 'pipe' });
        jingCmd = `npx jing "${rngPath}" "${xmlToValidatePath}"`;
      } catch (e) {
        return {
          isValid: false,
          errors: [
            'Jing not found. Options:\n' +
            '1. Copy jing-20091111.jar to tools/jing.jar\n' +
            '2. Or install: npm install -g jing\n' +
            '3. Or install via: brew install jing'
          ]
        };
      }
    }

    try {
      execSync(jingCmd, { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } finally {
      if (tempPath && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) { /* ignore cleanup errors */ }
      }
    }
    
    return { isValid: true, errors: [] };
  } catch (error) {
    // Jing outputs validation errors to stderr on failure
    const errorMessage = error.stderr || error.stdout || error.message;
    return { 
      isValid: false, 
      errors: [errorMessage.trim()] 
    };
  }
}

module.exports = {
  validateAgainstRng
};
