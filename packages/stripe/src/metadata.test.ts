import { describe, expect, it } from "vitest";
import { customerMetadata, subscriptionMetadata } from "./metadata";

describe("customerMetadata", () => {
	describe("set", () => {
		it("creates metadata with user customer type", () => {
			const result = customerMetadata.set({
				customerType: "user",
				userId: "user_123",
			});
			expect(result).toEqual({
				customerType: "user",
				userId: "user_123",
			});
		});

		it("creates metadata with organization customer type", () => {
			const result = customerMetadata.set({
				customerType: "organization",
				organizationId: "org_456",
			});
			expect(result).toEqual({
				customerType: "organization",
				organizationId: "org_456",
			});
		});

		it("merges user metadata with internal fields taking priority", () => {
			const result = customerMetadata.set(
				{ customerType: "user", userId: "user_123" },
				{ customField: "hello", userId: "should_be_overridden" },
			);
			expect(result.userId).toBe("user_123");
			expect(result.customField).toBe("hello");
		});

		it("merges multiple user metadata sources", () => {
			const result = customerMetadata.set(
				{ customerType: "user", userId: "user_123" },
				{ field1: "a" },
				{ field2: "b" },
			);
			expect(result.field1).toBe("a");
			expect(result.field2).toBe("b");
			expect(result.userId).toBe("user_123");
		});

		it("skips undefined user metadata", () => {
			const result = customerMetadata.set(
				{ customerType: "user", userId: "user_123" },
				undefined,
			);
			expect(result).toEqual({
				customerType: "user",
				userId: "user_123",
			});
		});

		it("filters out prototype-polluting keys", () => {
			const malicious = Object.create(null);
			malicious.prototype = "evil";
			malicious.safe = "ok";
			const result = customerMetadata.set(
				{ customerType: "user", userId: "user_123" },
				malicious,
			);
			expect(Object.prototype.hasOwnProperty.call(result, "prototype")).toBe(
				false,
			);
			expect(result.safe).toBe("ok");
		});
	});

	describe("get", () => {
		it("extracts user metadata", () => {
			const result = customerMetadata.get({
				userId: "user_123",
				customerType: "user",
			});
			expect(result.userId).toBe("user_123");
			expect(result.customerType).toBe("user");
		});

		it("extracts organization metadata", () => {
			const result = customerMetadata.get({
				organizationId: "org_456",
				customerType: "organization",
			});
			expect(result.organizationId).toBe("org_456");
			expect(result.customerType).toBe("organization");
		});

		it("returns undefined fields for null metadata", () => {
			const result = customerMetadata.get(null);
			expect(result.userId).toBeUndefined();
			expect(result.organizationId).toBeUndefined();
			expect(result.customerType).toBeUndefined();
		});

		it("returns undefined fields for undefined metadata", () => {
			const result = customerMetadata.get(undefined);
			expect(result.userId).toBeUndefined();
		});
	});
});

describe("subscriptionMetadata", () => {
	describe("set", () => {
		it("creates metadata with subscription fields", () => {
			const result = subscriptionMetadata.set({
				userId: "user_1",
				subscriptionId: "sub_1",
				referenceId: "ref_1",
			});
			expect(result).toEqual({
				userId: "user_1",
				subscriptionId: "sub_1",
				referenceId: "ref_1",
			});
		});

		it("internal fields override user metadata", () => {
			const result = subscriptionMetadata.set(
				{ userId: "user_1", subscriptionId: "sub_1", referenceId: "ref_1" },
				{ subscriptionId: "override_attempt", extra: "data" },
			);
			expect(result.subscriptionId).toBe("sub_1");
			expect(result.extra).toBe("data");
		});
	});

	describe("get", () => {
		it("extracts subscription metadata", () => {
			const result = subscriptionMetadata.get({
				userId: "user_1",
				subscriptionId: "sub_1",
				referenceId: "ref_1",
			});
			expect(result.userId).toBe("user_1");
			expect(result.subscriptionId).toBe("sub_1");
			expect(result.referenceId).toBe("ref_1");
		});

		it("returns undefined for null metadata", () => {
			const result = subscriptionMetadata.get(null);
			expect(result.userId).toBeUndefined();
			expect(result.subscriptionId).toBeUndefined();
			expect(result.referenceId).toBeUndefined();
		});
	});
});
