// RNG validation helper using Jing
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

    let jingCmd;
    const javaPath = 'C:\\Program Files (x86)\\Java\\jre1.8.0_471\\bin\\java.exe';
    
    // Try jar first (Windows-friendly approach)
    const jarPath = path.resolve(__dirname, '../../tools/jing.jar');
    if (fs.existsSync(jarPath)) {
      jingCmd = `"${javaPath}" -jar "${jarPath}" "${rngPath}" "${xmlPath}"`;
    } else {
      // Fallback to npx
      jingCmd = `npx jing "${rngPath}" "${xmlPath}"`;
    }

    execSync(jingCmd, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
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
