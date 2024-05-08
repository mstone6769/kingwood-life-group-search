const csv = require('csvtojson');
const fs = require('fs');
const pick = require('lodash.pick');
const mapkeys = require('lodash.mapkeys');

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
  'Demographic Filter',
  'Type Filter',
  'Filter Days',
  'Childcare\nCheckbox',
  'Online/Zoom Checkbox',
];

const keyMap = {
  'LifeGroup Name': 'name',
  'Name': 'leaders',
  'Display Email': 'email',
  'Display Phone': 'phone',
  'Demographic Filter': 'filterDemographic',
  'Target | Gray Text': 'target',
  'Type Filter': 'filterType',
  'Description': 'description',
  'Meeting Days': 'meetsOn',
  'Childcare\nCheckbox': 'childcareAvailable',
  'Filter Days': 'filterDays',
  'Location of LifeGroup': 'location',
  'Form Link': 'formLink',
  'Online/Zoom Checkbox': 'online'
};

const writeFile = (jsonObj) => {
  try {
    return fs.writeFileSync('./life-groups.json', JSON.stringify(jsonObj))
    //file written successfully
  } catch (err) {
    console.error(err)
  }
};

const splitAndMapKeys = (field) => field.split(',').map((dem) => dem.trim());

const mapLifeGroups = (lifeGroups) => {
  const firstField = pickedFields[0];
  const secondField = pickedFields[1];
  const keyMapValues = Object.values(keyMap);
  return lifeGroups.reduce((acc, group) => {
    if (!group[firstField] || !group[secondField]) return acc;
    if (group['Hidden'] === 'Yes') return acc;
    const mappedGroup = mapkeys(pick(group, pickedFields), (val, key) => keyMap[key]);
    keyMapValues.forEach((key) => {
      if (typeof mappedGroup[key] !== 'string') return;
      mappedGroup[key] = mappedGroup[key].replace(/\n/g, '');
    });
    mappedGroup.filterDemographic = splitAndMapKeys(mappedGroup.filterDemographic);
    mappedGroup.filterDays = splitAndMapKeys(mappedGroup.filterDays);
    mappedGroup.filterType = splitAndMapKeys(mappedGroup.filterType);
    mappedGroup.email = mappedGroup.email.toLowerCase();
    
    acc.push(mappedGroup);
    return acc;
  }, [])
}


csv()
  .fromFile(csvFilePath)
  .then((lifeGroups) => {
    const mappedData = mapLifeGroups(lifeGroups);
    console.log(mappedData);
    return mappedData;
  })
  .then((lifeGroups)=>writeFile(lifeGroups));
