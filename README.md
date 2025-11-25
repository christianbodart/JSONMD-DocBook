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
- (for running tests) pandoc client: https://pandoc.org/installing.html

### Installation

Clone the repository:

`git clone https://github.com/christianbodart/JSONMD-DocBook.git`

`cd jsonmd-docbook`

`npm install`

### Usage

Run conversion scripts or tests:

`npm test`

Extend or integrate conversion functions located in the `src/converters/` directory.

## Repository Structure

- `src/` — Core conversion and validation modules  
- `tests/` — Input/output pairs and automated test suites  
- `schemas/` — JSON and DocBook schema definitions  
- `ci/` — Continuous integration workflows  

## Contributing

Kagi AI models / Perplexity AI / Me



