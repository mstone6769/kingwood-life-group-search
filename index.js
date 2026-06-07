const csv = require('csvtojson');
const fs = require('fs');

const csvFilePath = './life-groups.csv';

const pickedFields = [
  'LifeGroup Name',
  'Name',
  'Display Email',
  'Display Phone',
  'Target | Gray Text',
  'Description',
  'Meeting Days',
  'Location of LifeGroup',
  'Form Link',
  'Category',
  'Demographic Filter',
  'Type Filter',
  'Filter Days',
  'Demographic (HOW OLD ARE THE PEOPLE?)',
  'Category (WHO GATHERS TOGETHER)',
  'Target | Gray Text (WHO SHOULD SIGN UP)',
  'Group Type (WHAT HAPPENS IN GROUP)',
  'Childcare\nCheckbox',
  'Online/Zoom Checkbox',
];

const keyMap = {
  'LifeGroup Name': 'name',
  'Name': 'leaders',
  'Display Email': 'email',
  'Display Phone': 'phone',
  'Demographic Filter': 'filterDemographic',
  'Category': 'filterCategory',
  'Target | Gray Text': 'target',
  'Type Filter': 'filterType',
  'Description': 'description',
  'Meeting Days': 'meetsOn',
  'Childcare\nCheckbox': 'childcareAvailable',
  'Filter Days': 'filterDays',
  'Location of LifeGroup': 'location',
  'Form Link': 'formLink',
  'Online/Zoom Checkbox': 'online',
  'Demographic (HOW OLD ARE THE PEOPLE?)': 'filterDemographic',
  'Category (WHO GATHERS TOGETHER)': 'filterCategory',
  'Target | Gray Text (WHO SHOULD SIGN UP)': 'target',
  'Group Type (WHAT HAPPENS IN GROUP)': 'filterType'
};

const keyMapValues = [...new Set(Object.values(keyMap))];

const writeFile = (jsonObj) => {
  try {
    return fs.writeFileSync('./life-groups.json', JSON.stringify(jsonObj))
    //file written successfully
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
};

const splitAndMapKeys = (field) => String(field).split(',').map((dem) => dem.trim());

const mapLifeGroups = (lifeGroups) => {
  const firstField = pickedFields[0];
  const secondField = pickedFields[1];
  return lifeGroups.reduce((acc, group) => {
    if (!group[firstField] || !group[secondField]) return acc;
    if (group['Hidden'] === 'Yes') return acc;
    const mappedGroup = Object.fromEntries(pickedFields.map(key => [keyMap[key], group[key]]));
    keyMapValues.forEach((key) => {
      if (typeof mappedGroup[key] !== 'string') return;
      mappedGroup[key] = mappedGroup[key].replace(/\n/g, '');
    });
    mappedGroup.filterDemographic = splitAndMapKeys(mappedGroup.filterDemographic);
    mappedGroup.filterCategory = splitAndMapKeys(mappedGroup.filterCategory);
    mappedGroup.filterDays = splitAndMapKeys(mappedGroup.filterDays);
    mappedGroup.filterType = splitAndMapKeys(mappedGroup.filterType);
    mappedGroup.email = mappedGroup.email.toLowerCase();
    
    acc.push(mappedGroup);
    return acc;
  }, [])
}


if (require.main === module) {
  csv()
    .fromFile(csvFilePath)
    .then((lifeGroups) => mapLifeGroups(lifeGroups))
    .then((lifeGroups) => writeFile(lifeGroups));
}

module.exports = { splitAndMapKeys, mapLifeGroups, writeFile };
