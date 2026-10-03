import { describe, expect, it } from "vitest";
import { convertFromDB, convertToDB } from "./field-converter";

describe("convertToDB", () => {
	it("converts values using field mappings", () => {
		const fields = {
			firstName: { fieldName: "first_name" },
			lastName: { fieldName: "last_name" },
		} as any;
		const values = { id: "1", firstName: "John", lastName: "Doe" };
		const result = convertToDB(fields, values);
		expect(result).toEqual({
			id: "1",
			first_name: "John",
			last_name: "Doe",
		});
	});

	it("uses key name when fieldName is not provided", () => {
		const fields = {
			email: {},
			name: {},
		} as any;
		const values = { id: "1", email: "test@test.com", name: "Test" };
		const result = convertToDB(fields, values);
		expect(result).toEqual({
			id: "1",
			email: "test@test.com",
			name: "Test",
		});
	});

	it("skips undefined values", () => {
		const fields = {
			name: { fieldName: "name" },
			email: { fieldName: "email" },
		} as any;
		const values = { id: "1", name: "Test", email: undefined };
		const result = convertToDB(fields, values);
		expect(result).toEqual({ id: "1", name: "Test" });
	});

	it("handles values without id", () => {
		const fields = {
			name: { fieldName: "name" },
		} as any;
		const values = { name: "Test" };
		const result = convertToDB(fields, values);
		expect(result).toEqual({ name: "Test" });
	});

	it("preserves null values", () => {
		const fields = {
			avatar: { fieldName: "avatar_url" },
		} as any;
		const values = { id: "1", avatar: null };
		const result = convertToDB(fields, values);
		expect(result).toEqual({ id: "1", avatar_url: null });
	});
});

describe("convertFromDB", () => {
	it("converts DB values back using field mappings", () => {
		const fields = {
			firstName: { fieldName: "first_name" },
			lastName: { fieldName: "last_name" },
		} as any;
		const values = { id: "1", first_name: "John", last_name: "Doe" };
		const result = convertFromDB(fields, values);
		expect(result).toEqual({
			id: "1",
			firstName: "John",
			lastName: "Doe",
		});
	});

	it("uses key name when fieldName is not provided", () => {
		const fields = {
			email: {},
			name: {},
		} as any;
		const values = { id: "1", email: "test@test.com", name: "Test" };
		const result = convertFromDB(fields, values);
		expect(result).toEqual({
			id: "1",
			email: "test@test.com",
			name: "Test",
		});
	});

	it("returns null for null input", () => {
		const fields = { name: { fieldName: "name" } } as any;
		expect(convertFromDB(fields, null)).toBeNull();
	});

	it("handles missing DB columns gracefully", () => {
		const fields = {
			name: { fieldName: "name" },
			avatar: { fieldName: "avatar_url" },
		} as any;
		const values = { id: "1", name: "Test" };
		const result = convertFromDB(fields, values);
		expect(result).toEqual({
			id: "1",
			name: "Test",
			avatar: undefined,
		});
	});
});
