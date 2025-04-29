# airtable-ts-formula

⚗️📝 Type-safe, securely-escaped and rename-robust formulae for Airtable

These can be used as `filterByFormula` expressions on the API.

Designed to work particularly well with [airtable-ts](https://github.com/domdomegg/airtable-ts).

## Usage

With [airtable-ts](https://github.com/domdomegg/airtable-ts) (recommended)

```ts
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
    // And finally any values will be escaped - so no injection attacks!
    ['=', {field: 'firstName'}, 'Robert'],
    ['>=', {field: 'enrollmentYear'}, new Date().getFullYear() - 10],
  ]),
});
```

Manually

```ts
TODO
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
