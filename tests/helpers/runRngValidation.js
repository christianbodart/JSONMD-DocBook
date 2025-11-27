#!/usr/bin/env node
/*
 Simple runner for RNG validation using the project helper.
 Usage: `node tests/helpers/runRngValidation.js [file1 file2 ...]`
 If no files are provided, validates all XML files in `tests/outputs/`.
 Exits with code 0 when all files validate, non-zero otherwise.
 */
const fs = require('fs');
const path = require('path');
const { validateAgainstRng } = require('./validateRng');

const schemaPath = path.resolve(__dirname, '../../schemas/docbook.rng');
const outputsDir = path.resolve(__dirname, '..', 'outputs');

function gatherTargets(args) {
  if (args.length > 0) return args.map(p => path.resolve(process.cwd(), p));
  // otherwise find all .xml files in tests/outputs
  const files = fs.readdirSync(outputsDir).filter(f => f.endsWith('.xml'));
  return files.map(f => path.join(outputsDir, f));
}

(async function main() {
  const targets = gatherTargets(process.argv.slice(2));
  if (!fs.existsSync(schemaPath)) {
    console.error('RNG schema not found:', schemaPath);
    process.exit(2);
  }

  let hadError = false;
  for (const t of targets) {
    if (!fs.existsSync(t)) {
      console.warn('Skipping (not found):', t);
      continue;
    }
    process.stdout.write(`Validating ${path.relative(process.cwd(), t)}... `);
    const res = validateAgainstRng(t, schemaPath);
    if (res.isValid) {
      console.log('OK');
    } else {
      hadError = true;
      console.log('FAILED');
      for (const e of res.errors) console.log('  ', e.replace(/\n/g, '\n   '));
    }
  }

  process.exit(hadError ? 1 : 0);
})();
