const fs = require('fs');
const path = require('path');
const chai = require('chai');
const { expect } = chai;
const xml2js = require('xml2js');
const Ajv = require('ajv');
const deepEqual = require('deep-equal');

// Load and compile your JSON schema
const schema = require('../schemas/jsonmd-docbook.schema.json');
const ajv = new Ajv({ allErrors: true, strict: false });
require('ajv-formats')(ajv); // add this line
const validate = ajv.compile(schema);

describe('DocBook XML Sample Validation', function () {
  let xmlData;
  let parsedJson;

  before(function (done) {
    const filePath = path.resolve(__dirname, './inputs/docbook-sample.xml');
    xmlData = fs.readFileSync(filePath, 'utf8');
    // Parse XML to JS object
    xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
      if (err) return done(err);
      parsedJson = result;
      console.log(JSON.stringify(parsedJson, null, 2));
      done();
    });
  });

  it('should parse XML without errors', function () {
    expect(parsedJson).to.be.an('object');
  });

  it('should validate the parsed JSON against the schema', function () {
    const valid = validate(parsedJson);
    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).to.be.true;
  });

  it('should contain expected top-level DocBook elements', function () {
    expect(parsedJson).to.have.property('article');
    expect(parsedJson.article).to.have.property('section');
  });

  // Additional tests can check round-trip fidelity or specific element structures using deepEqual or custom logic
});
