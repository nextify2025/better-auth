import { describe, expect, it } from "vitest";
import type { StripeOptions, Subscription } from "./types";
import {
	escapeStripeSearchValue,
	getPlanByName,
	getPlans,
	isActiveOrTrialing,
	isPendingCancel,
	isStripePendingCancel,
	resolvePlanItem,
	resolveQuantity,
} from "./utils";

describe("isActiveOrTrialing", () => {
	it("returns true for active status", () => {
		expect(isActiveOrTrialing({ status: "active" } as Subscription)).toBe(true);
	});

	it("returns true for trialing status", () => {
		expect(isActiveOrTrialing({ status: "trialing" } as Subscription)).toBe(
			true,
		);
	});

	it("returns false for canceled status", () => {
		expect(isActiveOrTrialing({ status: "canceled" } as Subscription)).toBe(
			false,
		);
	});

	it("returns false for incomplete status", () => {
		expect(isActiveOrTrialing({ status: "incomplete" } as Subscription)).toBe(
			false,
		);
	});

	it("returns false for past_due status", () => {
		expect(isActiveOrTrialing({ status: "past_due" } as Subscription)).toBe(
			false,
		);
	});
});

describe("isPendingCancel", () => {
	it("returns true when cancelAtPeriodEnd is set", () => {
		expect(isPendingCancel({ cancelAtPeriodEnd: true } as Subscription)).toBe(
			true,
		);
	});

	it("returns true when cancelAt is set", () => {
		expect(isPendingCancel({ cancelAt: new Date() } as Subscription)).toBe(
			true,
		);
	});

	it("returns false when neither is set", () => {
		expect(
			isPendingCancel({
				cancelAtPeriodEnd: false,
				cancelAt: undefined,
			} as Subscription),
		).toBe(false);
	});

	it("returns false for empty subscription", () => {
		expect(isPendingCancel({} as Subscription)).toBe(false);
	});
});

describe("isStripePendingCancel", () => {
	it("returns true when cancel_at_period_end is true", () => {
		expect(
			isStripePendingCancel({
				cancel_at_period_end: true,
				cancel_at: null,
			} as any),
		).toBe(true);
	});

	it("returns true when cancel_at is set", () => {
		expect(
			isStripePendingCancel({
				cancel_at_period_end: false,
				cancel_at: 1234567890,
			} as any),
		).toBe(true);
	});

	it("returns false when neither is set", () => {
		expect(
			isStripePendingCancel({
				cancel_at_period_end: false,
				cancel_at: null,
			} as any),
		).toBe(false);
	});
});

describe("escapeStripeSearchValue", () => {
	it("escapes backslashes", () => {
		expect(escapeStripeSearchValue("foo\\bar")).toBe("foo\\\\bar");
	});

	it("escapes double quotes", () => {
		expect(escapeStripeSearchValue('foo"bar')).toBe('foo\\"bar');
	});

	it("escapes both backslashes and quotes", () => {
		expect(escapeStripeSearchValue('a\\b"c')).toBe('a\\\\b\\"c');
	});

	it("returns unchanged string when no special characters", () => {
		expect(escapeStripeSearchValue("test@example.com")).toBe(
			"test@example.com",
		);
	});

	it("handles empty string", () => {
		expect(escapeStripeSearchValue("")).toBe("");
	});
});

describe("resolveQuantity", () => {
	it("returns seat item quantity when seatPriceId matches", () => {
		const items = [
			{ price: { id: "price_plan" }, quantity: 1 },
			{ price: { id: "price_seat" }, quantity: 5 },
		] as any[];
		const planItem = items[0] as any;
		expect(resolveQuantity(items, planItem, "price_seat")).toBe(5);
	});

	it("falls back to plan item quantity when seatPriceId does not match", () => {
		const items = [{ price: { id: "price_plan" }, quantity: 3 }] as any[];
		const planItem = items[0] as any;
		expect(resolveQuantity(items, planItem, "price_other")).toBe(3);
	});

	it("returns plan item quantity when no seatPriceId provided", () => {
		const items = [{ price: { id: "price_plan" }, quantity: 7 }] as any[];
		const planItem = items[0] as any;
		expect(resolveQuantity(items, planItem)).toBe(7);
	});

	it("defaults to 1 when seat item has no quantity", () => {
		const items = [
			{ price: { id: "price_plan" }, quantity: 1 },
			{ price: { id: "price_seat" }, quantity: undefined },
		] as any[];
		const planItem = items[0] as any;
		expect(resolveQuantity(items, planItem, "price_seat")).toBe(1);
	});

	it("defaults to 1 when plan item has no quantity and no seatPriceId", () => {
		const items = [
			{ price: { id: "price_plan" }, quantity: undefined },
		] as any[];
		const planItem = items[0] as any;
		expect(resolveQuantity(items, planItem)).toBe(1);
	});
});

describe("getPlans", () => {
	it("returns static plans when subscription is enabled", async () => {
		const plans = [{ name: "pro", priceId: "price_1" }];
		const result = await getPlans({ enabled: true, plans } as any);
		expect(result).toEqual(plans);
	});

	it("returns plans from async function", async () => {
		const plans = [{ name: "enterprise", priceId: "price_2" }];
		const result = await getPlans({
			enabled: true,
			plans: async () => plans,
		} as any);
		expect(result).toEqual(plans);
	});

	it("throws when subscriptions are not enabled", async () => {
		await expect(getPlans({ enabled: false } as any)).rejects.toThrow(
			"Subscriptions are not enabled",
		);
	});

	it("throws when subscription options are undefined", async () => {
		await expect(getPlans(undefined)).rejects.toThrow(
			"Subscriptions are not enabled",
		);
	});
});

describe("getPlanByName", () => {
	const options = {
		subscription: {
			enabled: true,
			plans: [
				{ name: "Free", priceId: "price_free" },
				{ name: "Pro", priceId: "price_pro" },
			],
		},
	} as StripeOptions;

	it("finds plan by name case-insensitively", async () => {
		const plan = await getPlanByName(options, "pro");
		expect(plan).toEqual({ name: "Pro", priceId: "price_pro" });
	});

	it("finds plan with exact case", async () => {
		const plan = await getPlanByName(options, "Free");
		expect(plan).toEqual({ name: "Free", priceId: "price_free" });
	});

	it("returns undefined for non-existent plan", async () => {
		const plan = await getPlanByName(options, "enterprise");
		expect(plan).toBeUndefined();
	});
});

describe("resolvePlanItem", () => {
	const options = {
		subscription: {
			enabled: true,
			plans: [
				{ name: "Pro", priceId: "price_pro" },
				{
					name: "Enterprise",
					priceId: "price_ent",
					annualDiscountPriceId: "price_ent_annual",
				},
			],
		},
	} as StripeOptions;

	it("matches item by priceId", async () => {
		const items = [
			{
				price: { id: "price_pro", lookup_key: null },
				current_period_start: 0,
				current_period_end: 0,
			},
		] as any[];
		const result = await resolvePlanItem(options, items);
		expect(result?.plan?.name).toBe("Pro");
		expect(result?.item).toBe(items[0]);
	});

	it("matches item by annualDiscountPriceId", async () => {
		const items = [
			{
				price: { id: "price_ent_annual", lookup_key: null },
				current_period_start: 0,
				current_period_end: 0,
			},
		] as any[];
		const result = await resolvePlanItem(options, items);
		expect(result?.plan?.name).toBe("Enterprise");
	});

	it("returns item without plan for single unmatched item", async () => {
		const items = [
			{
				price: { id: "price_unknown", lookup_key: null },
				current_period_start: 0,
				current_period_end: 0,
			},
		] as any[];
		const result = await resolvePlanItem(options, items);
		expect(result?.item).toBe(items[0]);
		expect(result?.plan).toBeUndefined();
	});

	it("returns undefined for multiple unmatched items", async () => {
		const items = [
			{ price: { id: "price_a", lookup_key: null } },
			{ price: { id: "price_b", lookup_key: null } },
		] as any[];
		const result = await resolvePlanItem(options, items);
		expect(result).toBeUndefined();
	});

	it("returns undefined for empty items", async () => {
		const result = await resolvePlanItem(options, []);
		expect(result).toBeUndefined();
	});

	it("matches item by lookupKey", async () => {
		const optionsWithLookup = {
			subscription: {
				enabled: true,
				plans: [{ name: "Basic", lookupKey: "basic_monthly" }],
			},
		} as StripeOptions;
		const items = [
			{
				price: { id: "price_x", lookup_key: "basic_monthly" },
				current_period_start: 0,
				current_period_end: 0,
			},
		] as any[];
		const result = await resolvePlanItem(optionsWithLookup, items);
		expect(result?.plan?.name).toBe("Basic");
	});
});
