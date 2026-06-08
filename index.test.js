const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { splitAndMapKeys, mapLifeGroups, validateColumns } = require('./index');

const makeGroup = (overrides = {}) => ({
  'LifeGroup Name': 'Test Group',
  'Name': 'Jane Doe',
  'Display Email': 'Jane@Example.com',
  'Display Phone': '555-1234',
  'Target | Gray Text': 'anyone',
  'Description': 'A test group',
  'Meeting Days': 'Mondays at 7:00 PM',
  'Location of LifeGroup': 'Test Location',
  'Form Link': 'https://example.com/form',
  'Category': 'co-ed',
  'Demographic Filter': 'adults',
  'Type Filter': 'Bible Study & Discipleship',
  'Filter Days': 'Monday',
  'Demographic (HOW OLD ARE THE PEOPLE?)': '',
  'Category (WHO GATHERS TOGETHER)': '',
  'Target | Gray Text (WHO SHOULD SIGN UP)': '',
  'Group Type (WHAT HAPPENS IN GROUP)': '',
  'Childcare\nCheckbox': 'No',
  'Online/Zoom Checkbox': 'No',
  'Hidden': 'No',
  ...overrides,
});

describe('splitAndMapKeys', () => {
  it('splits a comma-separated string into trimmed values', () => {
    assert.deepEqual(splitAndMapKeys('Monday, Tuesday, Wednesday'), ['Monday', 'Tuesday', 'Wednesday']);
  });

  it('returns a single-element array when there is no comma', () => {
    assert.deepEqual(splitAndMapKeys('Sunday'), ['Sunday']);
  });

  it('trims whitespace from each value', () => {
    assert.deepEqual(splitAndMapKeys('  adults  ,  seniors  '), ['adults', 'seniors']);
  });

  it('coerces non-string input to string', () => {
    assert.deepEqual(splitAndMapKeys(42), ['42']);
  });

  it('handles an empty string', () => {
    assert.deepEqual(splitAndMapKeys(''), ['']);
  });

  it('returns an empty array for undefined', () => {
    assert.deepEqual(splitAndMapKeys(undefined), []);
  });

  it('returns an empty array for null', () => {
    assert.deepEqual(splitAndMapKeys(null), []);
  });
});

describe('mapLifeGroups', () => {
  it('maps CSV fields to output keys', () => {
    const [result] = mapLifeGroups([makeGroup()]);
    assert.equal(result.name, 'Test Group');
    assert.equal(result.leaders, 'Jane Doe');
    assert.equal(result.location, 'Test Location');
    assert.equal(result.formLink, 'https://example.com/form');
  });

  it('lowercases the email address', () => {
    const [result] = mapLifeGroups([makeGroup({ 'Display Email': 'Jane@Example.com' })]);
    assert.equal(result.email, 'jane@example.com');
  });

  it('converts filter fields to arrays', () => {
    // The later duplicate columns (e.g. 'Demographic (HOW OLD ARE THE PEOPLE?)')
    // override the earlier short-form columns when both are present.
    const [result] = mapLifeGroups([makeGroup({
      'Demographic (HOW OLD ARE THE PEOPLE?)': 'adults, seniors',
      'Category (WHO GATHERS TOGETHER)': 'co-ed, women',
      'Filter Days': 'Monday, Wednesday',
      'Group Type (WHAT HAPPENS IN GROUP)': 'Bible Study & Discipleship, Prayer & Devotional Life',
    })]);
    assert.deepEqual(result.filterDemographic, ['adults', 'seniors']);
    assert.deepEqual(result.filterCategory, ['co-ed', 'women']);
    assert.deepEqual(result.filterDays, ['Monday', 'Wednesday']);
    assert.deepEqual(result.filterType, ['Bible Study & Discipleship', 'Prayer & Devotional Life']);
  });

  it('removes embedded newlines from string fields', () => {
    const [result] = mapLifeGroups([makeGroup({ 'Description': 'line one\nline two' })]);
    assert.equal(result.description, 'line oneline two');
  });

  it('excludes groups with no name', () => {
    const results = mapLifeGroups([makeGroup({ 'LifeGroup Name': '' })]);
    assert.equal(results.length, 0);
  });

  it('excludes groups with no leaders', () => {
    const results = mapLifeGroups([makeGroup({ 'Name': '' })]);
    assert.equal(results.length, 0);
  });

  it('excludes hidden groups', () => {
    const results = mapLifeGroups([makeGroup({ Hidden: 'Yes' })]);
    assert.equal(results.length, 0);
  });

  it('includes groups where Hidden is not Yes', () => {
    const results = mapLifeGroups([makeGroup({ Hidden: 'No' })]);
    assert.equal(results.length, 1);
  });

  it('returns an empty array for empty input', () => {
    assert.deepEqual(mapLifeGroups([]), []);
  });

  it('processes multiple groups', () => {
    const results = mapLifeGroups([makeGroup(), makeGroup({ 'LifeGroup Name': 'Second Group' })]);
    assert.equal(results.length, 2);
    assert.equal(results[1].name, 'Second Group');
  });

  it('produces empty string email when Display Email column is missing', () => {
    const group = makeGroup();
    delete group['Display Email'];
    const [result] = mapLifeGroups([group]);
    assert.equal(result.email, '');
  });

  it('produces empty arrays for filter fields when columns are missing', () => {
    const group = makeGroup();
    delete group['Demographic Filter'];
    delete group['Demographic (HOW OLD ARE THE PEOPLE?)'];
    const [result] = mapLifeGroups([group]);
    assert.deepEqual(result.filterDemographic, []);
  });
});

describe('validateColumns', () => {
  const validHeaders = [
    'LifeGroup Name',
    'Name',
    'Display Email',
    'Display Phone',
    'Description',
    'Meeting Days',
    'Location of LifeGroup',
    'Form Link',
    'Filter Days',
    'Childcare\nCheckbox',
    'Online/Zoom Checkbox',
    'Hidden',
    'Demographic (HOW OLD ARE THE PEOPLE?)',
    'Category (WHO GATHERS TOGETHER)',
    'Target | Gray Text (WHO SHOULD SIGN UP)',
    'Group Type (WHAT HAPPENS IN GROUP)',
  ];

  it('returns no warnings for a valid header set', () => {
    assert.deepEqual(validateColumns(validHeaders), []);
  });

  it('warns when a required column is missing', () => {
    const headers = validHeaders.filter(h => h !== 'Hidden');
    const warnings = validateColumns(headers);
    assert.equal(warnings.length, 1);
    assert.ok(warnings[0].includes('"Hidden"'));
  });

  it('warns when multiple required columns are missing', () => {
    const headers = validHeaders.filter(h => h !== 'Hidden' && h !== 'Display Email');
    const warnings = validateColumns(headers);
    assert.equal(warnings.length, 1);
    assert.ok(warnings[0].includes('"Hidden"'));
    assert.ok(warnings[0].includes('"Display Email"'));
  });

  it('warns when all variants of an aliased column group are missing', () => {
    const headers = validHeaders.filter(
      h => h !== 'Demographic Filter' && h !== 'Demographic (HOW OLD ARE THE PEOPLE?)'
    );
    const warnings = validateColumns(headers);
    assert.equal(warnings.length, 1);
    assert.ok(warnings[0].includes('Demographic'));
  });

  it('accepts the short-form alias when the long-form is absent', () => {
    const headers = validHeaders
      .filter(h => h !== 'Demographic (HOW OLD ARE THE PEOPLE?)')
      .concat('Demographic Filter');
    assert.deepEqual(validateColumns(headers), []);
  });

  it('returns multiple warnings when several things are wrong', () => {
    const warnings = validateColumns([]);
    assert.ok(warnings.length >= 2);
  });
});
