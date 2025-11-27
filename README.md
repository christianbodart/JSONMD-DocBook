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

### Quick RNG validation (project script)

You can validate the XML test outputs (including fragments) with the included helper and runner. The helper will automatically wrap fragments in a minimal DocBook container for validation (it does not modify source files).

- Add `jing.jar` to `tools/jing.jar` (preferred) or install `jing` globally / via Homebrew / npx.
- Then run:

```powershell
npm run validate:rng
```

This command runs `tests/helpers/runRngValidation.js`, which uses `tests/helpers/validateRng.js`.

How fragment validation works
- If a file is a full DocBook document (e.g., begins with `<book>` or `<article>`), the helper will add missing `xmlns`/`xmlns:xlink` declarations if needed and inject a minimal `<title>` when the RNG requires it.
- If a file is a fragment (no root or unsupported root), the helper wraps the fragment in a minimal `<article>` (with namespace and `<title>`) so Jing can validate the fragment in context.
- Temporary files are created for validation and removed afterward; original files remain unchanged.

Why `xml:id`? (short explanation)

The DocBook RELAX NG schema is strict about which attributes it allows on which elements. Many DocBook elements expect identifier attributes to be in the `xml` namespace (i.e. `xml:id`) rather than an unqualified `id` attribute. That is a schema-level constraint, not specific to Jing. The helper converts `id="..."` to `xml:id="..."` in the temporary validation document to avoid spurious validation failures while leaving source files untouched.

If you prefer the converters to output `xml:id` directly, I can update the converters to emit `xml:id` instead of `id`.

### Configuration

- **`USE_XML_ID`**: Control whether converters emit `xml:id` (default: enabled).
	- Set to `false` to emit plain `id` attributes instead of `xml:id`.
	- Examples:
		- PowerShell (Windows):

```powershell
$env:USE_XML_ID = 'false'
npm test
```

		- Bash / macOS / Linux:

```bash
USE_XML_ID=false npm test
```

- **CI behavior**: The included GitHub Actions workflow at `.github/workflows/ci.yml` runs unit tests and RNG validation and sets `USE_XML_ID=true` in the CI environment to prefer `xml:id` during validation.

If you'd like the default behaviour changed (for example, default to plain `id`), I can flip the default and update the tests accordingly.

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



