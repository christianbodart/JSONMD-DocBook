const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Inline validation helper
function validateAgainstRng(xmlPath, rngPath) {
  try {
    if (!fs.existsSync(xmlPath)) {
      return { isValid: false, errors: [`XML file not found: ${xmlPath}`] };
    }
    if (!fs.existsSync(rngPath)) {
      return { isValid: false, errors: [`RNG schema not found: ${rngPath}`] };
    }

    // Try to find jing in multiple locations
    const jingPaths = [
      path.resolve(__dirname, '../tools/jing.jar'),
      'jing',
      path.resolve(__dirname, '../node_modules/.bin/jing'),
      path.resolve(__dirname, '../node_modules/jing/bin/jing.js')
    ];

    let jingCmd = null;
    const javaPath = 'C:\\Program Files (x86)\\Java\\jre1.8.0_471\\bin\\java.exe';
    
    for (const jingPath of jingPaths) {
      if (jingPath.endsWith('.jar')) {
        // Check if jar exists
        if (fs.existsSync(jingPath)) {
          jingCmd = `"${javaPath}" -jar "${jingPath}"`;
          break;
        }
      } else {
        // Try to run the command
        try {
          execSync(`${jingPath} -version`, { stdio: 'pipe' });
          jingCmd = jingPath;
          break;
        } catch (e) {
          // Try next path
        }
      }
    }

    if (!jingCmd) {
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

    execSync(`${jingCmd} "${rngPath}" "${xmlPath}"`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    return { isValid: true, errors: [] };
  } catch (error) {
    const errorMessage = error.stderr || error.stdout || error.message;
    return { 
      isValid: false, 
      errors: [errorMessage.trim()] 
    };
  }
}

describe('DocBook RNG Validation', function () {
  const schemaPath = path.resolve(__dirname, '../schemas/docbook.rng');
  const outputsDir = path.resolve(__dirname, 'outputs');

  it.skip('should validate jsonToDocbook.output.xml against DocBook RNG', function () {
    const xmlPath = path.join(outputsDir, 'jsonToDocbook.output.xml');
    const result = validateAgainstRng(xmlPath, schemaPath);
    if (!result.isValid && result.errors[0].includes('Jing not found')) {
      this.skip();
    }
    assert.isTrue(result.isValid, `Validation failed: ${result.errors.join('; ')}`);
  });

  it.skip('should validate basic-markdown.xml against DocBook RNG', function () {
    const xmlPath = path.join(outputsDir, 'basic-markdown.xml');
    if (!fs.existsSync(xmlPath)) {
      this.skip();
    }
    const result = validateAgainstRng(xmlPath, schemaPath);
    if (!result.isValid && result.errors[0].includes('Jing not found')) {
      this.skip();
    }
    assert.isTrue(result.isValid, `Validation failed: ${result.errors.join('; ')}`);
  });
});
