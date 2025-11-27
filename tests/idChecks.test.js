const assert = require('chai').assert;
const { ensureUniqueIds, verifyReferencesExist } = require('../src/utils/idChecks');

describe('idChecks', function () {
  it('ensureUniqueIds does not throw for unique ids', function () {
    assert.doesNotThrow(() => ensureUniqueIds([{ id: 'a' }, { id: 'b' }]));
  });

  it('ensureUniqueIds throws for duplicate ids', function () {
    assert.throws(() => ensureUniqueIds([{ id: 'a' }, { id: 'a' }]), /Duplicate IDs/);
  });

  it('verifyReferencesExist passes when references are present', function () {
    const contents = [{ content: [{ type: 'paragraph', text: 'See [^a] and [@b]' }] }];
    const validIds = new Set(['a', 'b']);
    assert.doesNotThrow(() => verifyReferencesExist(contents, validIds));
  });

  it('verifyReferencesExist throws when reference missing', function () {
    const contents = [{ content: [{ type: 'paragraph', text: 'See [^x]' }] }];
    const validIds = new Set(['a']);
    assert.throws(() => verifyReferencesExist(contents, validIds), /Reference ID "x" not found/);
  });
});
