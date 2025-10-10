# airtable-ts-formula

⚗️📝 Type-safe, securely-escaped and rename-robust formulae for Airtable

These can be used as `filterByFormula` expressions on the API.

Designed to work well with [airtable-ts](https://github.com/domdomegg/airtable-ts) (recommended) and [Airtable.js](https://github.com/Airtable/airtable.js), or can be called manually.

## Usage

With [airtable-ts](https://github.com/domdomegg/airtable-ts) (recommended)

```ts
import { AirtableTs, Table } from 'airtable-ts';
import { formula } from 'airtable-ts-formula';

const db = new AirtableTs({
  // Create your own at https://airtable.com/create/tokens
  // Recommended scopes: schema.bases:read, data.records:read, data.records:write
  apiKey: 'pat1234.abcdef',
});

// Tip: use airtable-ts-codegen to autogenerate these from your Airtable base
const studentTable: Table<{id: string; firstName: string; enrollmentYear: number}> = {
  name: 'student',
  baseId: 'app1234',
  tableId: 'tbl1234',
  schema: {firstName: 'string', enrollmentYear: 'number'},
  // optional: use mappings with field ids to prevent renamings breaking your app,
  //           or with field names to make handling renamings easy
  mappings: {firstName: 'fld1234', enrollmentYear: 'Enrollment year'},
};

// Get students named Robert, who enrolled in the last 10 years
const students = await db.scan(studentTable, {
  filterByFormula: formula(await db.table(studentTable), [
    'AND',
    // You'll get type checking on the field name (but not value)
    // If you've specified a fieldId in mappings, your formula will be rename-robust
    // And any values will be escaped - so no injection attacks!
    ['=', {field: 'firstName'}, 'Robert'],
    ['>=', {field: 'enrollmentYear'}, new Date().getFullYear() - 10],
  ]),
});
```

With [Airtable.js](https://github.com/Airtable/airtable.js)

```ts
import Airtable from 'airtable';
import { formula, AirtableTsTable } from 'airtable-ts-formula';

// Configure Airtable
const airtable = new Airtable({
  // Create your own at https://airtable.com/create/tokens
  apiKey: 'pat1234.abcdef',
});

// Define your table structure with field names or ids
const studentTable: AirtableTsTable<{id: string; 'First name': string; fld789: number}> = {
  // Ideally get the fields live from Airtable, e.g. using the schema endpoints
  // Unfortunately not supported natively in Airtable.js: https://github.com/Airtable/airtable.js/issues/12
  fields: [
    {id: 'fld123', name: 'id'},
    {id: 'fld456', name: 'First name'},
    {id: 'fld789', name: 'Age'},
  ],
};

// Get students named Robert who are older than 35
airtable.base('app1234')('tbl1234').select({
  filterByFormula: formula(studentTable, [
    'AND',
    // You'll get type checking on the field name (but not value)
    // If you've used a fieldId, your formula will be rename-robust
    // And any values will be escaped - so no injection attacks!
    ['=', {field: 'First name'}, 'Robert'],
    ['>', {field: 'fld789'}, 35],
  ]),
}).eachPage((records, fetchNextPage) => {
  // Do something with records
  fetchNextPage();
}, (err) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('All students retrieved');
});
```

Manually

```ts
import { formula, AirtableTsTable } from 'airtable-ts-formula';

// Define your table structure with field names or ids
const studentTable: AirtableTsTable<{id: string; 'First name': string; fld789: number}> = {
  // Ideally get the fields live from Airtable, e.g. using the schema endpoints
  // You can do this with the base schema API: https://airtable.com/developers/web/api/get-base-schema
  fields: [
    {id: 'fld123', name: 'id'},
    {id: 'fld456', name: 'First name'},
    {id: 'fld789', name: 'Age'},
  ],
};

// Create a formula string
// Result: AND({First name}="Robert",{Age}>35)
const filterFormula = formula(studentTable, [
  'AND',
  // You'll get type checking on the field name (but not value)
  // If you've used a fieldId, your formula will be rename-robust
  // And any values will be escaped - so no injection attacks!
  ['=', {field: 'First name'}, 'Robert'],
  ['>', {field: 'fld789'}, 35],
]);

// Example with fetch API
const res = await fetch(`https://api.airtable.com/v0/app1234/tbl1234?filterByFormula=${encodeURIComponent(filterFormula)}`, {
  headers: {
    // Create your own at https://airtable.com/create/tokens
    Authorization: 'Bearer pat1234.abcdef',
  },
});
const data = await res.json();
console.log(data);
```

## Contributing

Pull requests are welcomed on GitHub! To get started:

1. Install Git and Node.js
2. Clone the repository
3. Install dependencies with `npm install`
4. Run `npm run test` to run tests
5. Build with `npm run build`

## Releases

Versions follow the [semantic versioning spec](https://semver.org/).

To release:

1. Use `npm version <major | minor | patch>` to bump the version
2. Run `git push --follow-tags` to push with tags
3. Wait for GitHub Actions to publish to the NPM registry.
