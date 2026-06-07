# Kingwood Life Group Search — Data Pipeline

Converts the life groups Google Sheet export into the JSON file consumed by the [Kingwood Church life groups search](https://www.kingwoodchurch.com/next-steps/groups/).

## How it works

1. A CSV is exported from the life groups Google Sheet (`life-groups.csv`)
2. `index.js` reads the CSV, filters out hidden/incomplete rows, maps the column names to short camelCase keys, splits filter columns into arrays, and writes `life-groups.json`
3. `life-groups.json` is deployed to the website

### Field mapping

| CSV column | JSON key |
|---|---|
| LifeGroup Name | `name` |
| Name | `leaders` |
| Display Email | `email` (lowercased) |
| Display Phone | `phone` |
| Target \| Gray Text (WHO SHOULD SIGN UP) | `target` |
| Description | `description` |
| Meeting Days | `meetsOn` |
| Location of LifeGroup | `location` |
| Form Link | `formLink` |
| Childcare Checkbox | `childcareAvailable` |
| Online/Zoom Checkbox | `online` |
| Filter Days | `filterDays` (array) |
| Demographic (HOW OLD ARE THE PEOPLE?) | `filterDemographic` (array) |
| Category (WHO GATHERS TOGETHER) | `filterCategory` (array) |
| Group Type (WHAT HAPPENS IN GROUP) | `filterType` (array) |

Rows where `Hidden` is `"Yes"`, or where the group name or leader name is blank, are excluded from the output.

## Setup

```bash
pnpm install
```

## Usage

1. Export the life groups Google Sheet as CSV and save it as `life-groups.csv` in the project root
2. Run the script:

```bash
pnpm update
```

This writes `life-groups.json` to the project root.

## Development

```bash
pnpm test   # run unit tests
pnpm lint   # lint with ESLint
```
