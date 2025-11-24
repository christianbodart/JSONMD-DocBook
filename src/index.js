const fs = require('fs');
const path = require('path');
const docbookToJson = require('./docbookToJson');
const jsonToDocbook = require('./jsonToDocbook');
const { validateDocbookXml } = require('./validateDocbook');
const { loadSchema, validateJson } = require('./validateJsonSchema');
const { ensureUniqueIds, verifyReferencesExist } = require('./idChecks');

async function runConversionAndValidation(inputXmlPath, jsonSchemaPath, rngSchemaPath) {
  try {
    // Load DocBook XML content
    const xmlContent = fs.readFileSync(inputXmlPath, 'utf8');

    // Convert DocBook XML → JSON-plus-markdown
    const jsonData = await docbookToJson(xmlContent);

    // Validate JSON against schema
    const validate = loadSchema(jsonSchemaPath);
    const jsonValidationResult = validateJson(jsonData, validate);
    if (!jsonValidationResult.isValid) {
      console.error('JSON Schema validation errors:', jsonValidationResult.errors);
      return;
    }

    // Run cross-reference id checks on JSON data
    ensureUniqueIds(jsonData.footnotes);
    ensureUniqueIds(jsonData.bibliography);
    verifyReferencesExist(jsonData.sections, new Set([
      ...jsonData.footnotes.map(f => f.id),
      ...jsonData.bibliography.map(b => b.id)
    ]));

    // Convert JSON → DocBook XML
    const xmlOutput = jsonToDocbook(jsonData);

    // Validate generated DocBook XML against RELAX NG
    const xmlValidationResult = validateDocbookXml(xmlOutput, rngSchemaPath);
    if (!xmlValidationResult.isValid) {
      console.error('DocBook XML RELAX NG validation errors:', xmlValidationResult.errors);
      return;
    }

    // Write output XML file for review
    const outputPath = path.join(path.dirname(inputXmlPath), 'converted_output.xml');
    fs.writeFileSync(outputPath, xmlOutput, 'utf8');

    console.log('Conversion and validation succeeded. Output written to:', outputPath);
  } catch (err) {
    console.error('Error during conversion/validation workflow:', err);
  }
}

// Example usage: node index.js sample_input.xml ./schemas/docbook-jsonmd.schema.json ./schemas/docbook.rng
const [inputXmlPath, jsonSchemaPath, rngSchemaPath] = process.argv.slice(2);
if (!inputXmlPath || !jsonSchemaPath || !rngSchemaPath) {
  console.error('Usage: node index.js <input-xml> <json-schema> <rng-schema>');
  process.exit(1);
}

runConversionAndValidation(inputXmlPath, jsonSchemaPath, rngSchemaPath);
