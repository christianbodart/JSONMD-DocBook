// Validate IDs are unique within an array of items
function ensureUniqueIds(items) {
  const seen = new Set();
  const duplicates = [];

  items.forEach(item => {
    if (seen.has(item.id)) {
      duplicates.push(item.id);
    } else {
      seen.add(item.id);
    }
  });

  if (duplicates.length > 0) {
    throw new Error(`Duplicate IDs found: ${duplicates.join(', ')}`);
  }
}

// Extract all reference IDs from markdown text: footnotes [^id], citations [@id]
function extractReferenceIds(text) {
  const refIds = [];
  const footnoteMatches = text.matchAll(/\[\^([^\]]+)\]/g);
  const citationMatches = text.matchAll(/\[@([^\]]+)\]/g);

  for (const match of footnoteMatches) {
    refIds.push(match[1]);
  }
  for (const match of citationMatches) {
    refIds.push(match[1]);
  }
  return refIds;
}

// Verify all references exist in target ID sets
function verifyReferencesExist(contents, validIds) {
  contents.forEach(section => {
    section.content.forEach(block => {
      if (block.text) {
        const refs = extractReferenceIds(block.text);
        refs.forEach(refId => {
          if (!validIds.has(refId)) {
            throw new Error(`Reference ID "${refId}" not found in document`);
          }
        });
      }
    });
  });
}

module.exports = {
  ensureUniqueIds,
  extractReferenceIds,
  verifyReferencesExist
};
