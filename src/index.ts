import {
	type Formula as FormulatorFormula, compile,
} from '@qualifyze/airtable-formulator';
import {type reference} from './formulaReference';

export type Item = {id: string};

// We define this here separately from airtable-ts so:
// - users can use provide a smaller set of arguments
// - users don't have to install airtable-ts
export type AirtableTsTable<T extends Item> = {
	fields: {
		id: string;
		name: string;
	}[];
	tsDefinition?: {
		schema: {
			[k in keyof Omit<T, 'id'>]: string;
		};
		mappings?: {
			[k in keyof Omit<T, 'id'>]: string | string[];
		};
	};
	__brand?: T;
};

export type FunctionCall<T extends Item> = ArrayNotation<keyof typeof reference.functions, T>;
export type Operation<T extends Item> = ArrayNotation<keyof typeof reference.operators, T>;
export type Literal = string | number | boolean;
export type FieldReference<T extends Item> = {
	field: keyof T & string;
};
type ArrayNotation<F extends string, T extends Item> = [F, ...Formula<T>[]];
export type Formula<T extends Item> = FunctionCall<T> | Operation<T> | Literal | FieldReference<T>;

/**
 * Creates a type-safe, securely-escaped and rename-robust formula for Airtable
 *
 * @param table - The Airtable table object or table definition
 * @param formula - The formula to compile
 * @returns A compiled formula string ready to use with Airtable API
 */
export function formula<T extends Item = any>(
	table: AirtableTsTable<T>,
	formula: Formula<T>,
): string {
	// Replace field references with field names
	const processedFormula = processFormula(table, formula);

	// Compile the formula to a string using airtable-formulator
	return compile(processedFormula);
}

/**
 * Processes a formula to replace field references (e.g. IDs, tsNames, names) with field names when available
 */
function processFormula<T extends Item>(
	table: AirtableTsTable<T>,
	formula: Formula<T>,
): FormulatorFormula {
	// Handle arrays (formula operations)
	if (Array.isArray(formula)) {
		return formula.map((item) => processFormula(table, item)) as FormulatorFormula;
	}

	// Handle field references
	if (formula && typeof formula === 'object' && 'field' in formula) {
		return convertFieldReferenceToFieldName(table, formula);
	}

	// Return primitive values as is
	return formula;
}

const convertFieldReferenceToFieldName = <T extends Item>(
	table: AirtableTsTable<T>,
	fieldReference: FieldReference<T>,
): {field: string} => {
	// Could be:
	// - field id
	// - field tsName
	// - field name
	let fieldValue: string = fieldReference.field;

	// Handle field tsName -> field name or field id
	const mappings = table.tsDefinition?.mappings;
	if (mappings && fieldValue in mappings) {
		const mapping = mappings[fieldValue as keyof typeof mappings];
		if (Array.isArray(mapping)) {
			throw new Error('Array mappings not supported');
		}

		fieldValue = mapping;
	}

	// Field name or id
	const field = table.fields.find((field) => field.id === fieldValue || field.name === fieldValue);
	if (!field) {
		throw new Error(`Field not found in table: ${fieldValue}`);
	}

	return {field: field.name};
};
