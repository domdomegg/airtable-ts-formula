import {test, expect} from 'vitest';
import {formula, type Item, type AirtableTsTable} from './index';
import {AirtableTs, type Table} from 'airtable-ts';

type Student = {
	id: string;
	firstName: string;
	age: number;
} & Item;

const studentTable: AirtableTsTable<Student> = {
	fields: [
		{id: 'fld123', name: 'id'},
		{id: 'fld456', name: 'firstName'},
		{id: 'fld789', name: 'age'},
	],
	tsDefinition: {
		schema: {
			firstName: 'string',
			age: 'number',
		},
	},
};

test('formula compiles a simple formula', () => {
	const result = formula(studentTable, [
		'AND',
		['=', {field: 'firstName'}, 'Robert'],
		['>', {field: 'age'}, 35],
	]);

	expect(result).toBe('AND({firstName}="Robert",{age}>35)');
});

test('formula escapes values', () => {
	const result = formula(studentTable, [
		'AND',
		['=', {field: 'firstName'}, 'Robert",{email}>m'],
		['>', {field: 'age'}, 35],
	]);

	expect(result).toBe('AND({firstName}="Robert\\",{email}>m",{age}>35)');
});

test('formula compiles a simple formula without tsDefinitions', () => {
	const result1 = formula<{id: string; firstName: string; fld789: number}>({fields: studentTable.fields}, [
		'AND',
		['=', {field: 'firstName'}, 'Robert'],
		['>', {field: 'fld789'}, 35],
	]);
	expect(result1).toBe('AND({firstName}="Robert",{age}>35)');

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const justForTypeChecking = () => {
		// TypeScript: with inline types
		formula<{id: string; firstName: string; age: number}>({fields: studentTable.fields}, [
			'AND',
			// @ts-expect-error: field should be firstName, not lastName
			['=', {field: 'lastName'}, 'Robert'],
			['>', {field: 'age'}, 35],
		]);

		// TypeScript: with inline any
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
		formula<any>({fields: studentTable.fields}, [
			'AND',
			// No ts error: any removes this
			['=', {field: 'lastName'}, 'Robert'],
			['>', {field: 'age'}, 35],
		]);

		// TypeScript: with cast types
		formula({fields: studentTable.fields} as AirtableTsTable<{id: string; firstName: string; age: number}>, [
			'AND',
			// @ts-expect-error: field should be firstName, not lastName
			['=', {field: 'lastName'}, 'Robert'],
			['>', {field: 'age'}, 35],
		]);

		// TypeScript: with cast any
		formula({fields: studentTable.fields} as AirtableTsTable<any>, [
			'AND',
			// No ts error: any removes this
			['=', {field: 'lastName'}, 'Robert'],
			['>', {field: 'age'}, 35],
		]);
	};
});

test('formula uses field IDs from mappings when available', () => {
	// Create a table definition with mappings
	const studentTable: AirtableTsTable<Student> = {
		fields: [
			{id: 'fld123', name: 'id'},
			{id: 'fld456', name: 'First name'},
			{id: 'fld789', name: 'Age'},
		],
		tsDefinition: {
			schema: {
				firstName: 'string',
				age: 'number',
			},
			mappings: {
				firstName: 'fld456',
				age: 'fld789',
			},
		},
	};

	// Create a simple formula
	const result = formula(studentTable, [
		'AND',
		['=', {field: 'firstName'}, 'Robert'],
		['>', {field: 'age'}, 35],
	]);

	// Check that field IDs are used instead of field names
	expect(result).toBe('AND({First name}="Robert",{Age}>35)');
});

test('throws error if field not in fields', () => {
	const studentTableWithMissingFirstNameField: AirtableTsTable<Student> = {
		fields: [
			{id: 'fld123', name: 'id'},
			{id: 'fld789', name: 'age'},
		],
		tsDefinition: {
			schema: {
				firstName: 'string',
				age: 'number',
			},
		},
	};

	expect(() =>
		formula(studentTableWithMissingFirstNameField, [
			'AND',
			['=', {field: 'firstName'}, 'Robert'],
			['>', {field: 'age'}, 35],
		])).toThrowError('Field not found in table: firstName');
});

test('has type error if field not in tsDefinition', () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const studentTableWithMissingFirstNameField: AirtableTsTable<Student> = {
		fields: [
			{id: 'fld123', name: 'id'},
			{id: 'fld456', name: 'firstName'},
			{id: 'fld789', name: 'age'},
		],
		tsDefinition: {
			// @ts-expect-error: missing firstName, intentionally
			schema: {
				age: 'number',
			},
		},
	};
});

test('types work with airtable-ts table (README example)', async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const justForTypeChecking = async () => {
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
			// required: use mappings with field ids to prevent renamings breaking your app,
			//           or with field names to make handling renamings easy
			mappings: {firstName: 'fld1234', enrollmentYear: 'Enrollment year'},
		};

		// Get students named Robert, who enrolled in the last 10 years
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
	};
});

test('types work with airtable-ts table (error example)', async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const justForTypeChecking = async () => {
		const db = new AirtableTs({
			apiKey: 'pat1234.abcdef',
		});

		const studentTable: Table<{id: string; firstName: string; enrollmentYear: number}> = {
			name: 'student',
			baseId: 'app1234',
			tableId: 'tbl1234',
			schema: {firstName: 'string', enrollmentYear: 'number'},
		};

		await db.scan(studentTable, {
			filterByFormula: formula(await db.table(studentTable), [
				'AND',
				// @ts-expect-error: field should be firstName, not lastName
				['=', {field: 'lastName'}, 'Robert'],
				// @ts-expect-error: operator should be !=, not <>
				['<>', {field: 'firstName'}, 'Robert'],
			]),
		});
	};
});
