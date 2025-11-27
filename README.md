# JSONMD-DocBook
Experimental (AI assisted) toolkit for conversion, validation, and testing between JSON+[pandoc]markdown and DocBook XML formats

## Goals
Personal - regain familiarity with js, node, github, schemas etc and explore using AI as an assistant 

Technical - Create a JavaScript toolkit for bi-directional conversion, validation, and automated round-trip testing between JSON-plus-markdown and DocBook XML, supporting XML, JSON, and rendered HTML outputs for technical publishing workflows.

## Proposed Features

- Converting structured JSON-plus-markdown documents to DocBook XML and back  
- Embedding Pandoc-style markdown syntax for footnotes, citations, and emphasis  
- Validating output against DocBook RELAX NG schemas and JSON schemas  
- Provide automated testing framework for round-trip fidelity and schema compliance  
- Generate and examine multiple output formats: DocBook XML, JSON, and rendered HTML  

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)  
- Installed dependencies via `npm install`  
- (optional, recommended) Jing for RNG schema validation: https://relaxng.org/jing.html

### Installation

Clone the repository:

`git clone https://github.com/christianbodart/JSONMD-DocBook.git`

`cd jsonmd-docbook`

`npm install`

### Setting Up RNG Validation (Optional)

To enable automatic validation of generated XML against the DocBook RELAX NG schema, install Jing:

**Option 1: Add jing jar to project (Windows/any OS):**
1. Download jing from https://relaxng.org/jing.html
2. Copy the jar file (e.g., `jing-20091111.jar`) to the `tools/` directory
3. Rename it to `jing.jar`
4. Run `npm test` — RNG validation will automatically use it

**Option 2: macOS (via Homebrew):**
```bash
brew install jing
npm test
```

**Option 3: Any OS (global npm):**
```bash
npm install -g jing
npm test
```

Once jing is available (via any method), RNG validation tests will automatically run and validate all test XML files against `schemas/docbook.rng`.

### Usage

Run all tests (including unit tests and validation):

`npm test`

Run only core functionality tests (skips RNG validation if jing not installed):

`npm test -- --grep "^(?!.*RNG)"`

Extend or integrate conversion functions located in the `src/converters/` directory.

## Testing

The test suite includes:

- **Unit Tests** — converter functions, ID checks, schema validation
- **Integration Tests** — round-trip conversions with static expected outputs
- **RNG Validation** (optional) — validates generated XML against DocBook RELAX NG schema

Test fixtures are stored in:
- `tests/inputs/` — JSON and XML input files
- `tests/outputs/` — expected output files for comparison

To run a specific test file:
```bash
npx mocha tests/jsonToDocbook.test.js
```

## Repository Structure

- `src/` — Core conversion and validation modules  
- `tests/` — Input/output pairs and automated test suites  
- `schemas/` — JSON and DocBook schema definitions  
- `ci/` — Continuous integration workflows  

## Contributing

Kagi AI models / Perplexity AI / Me



