import type { BetterAuthPluginDBSchema } from "@better-auth/core/db";
import { describe, expect, it } from "vitest";
import { getSchema } from "./schema";
import type { StripeOptions } from "./types";

describe("getSchema", () => {
	it("includes user schema by default", () => {
		const schema = getSchema({
			stripeClient: {} as any,
			stripeWebhookSecret: "secret",
		} as StripeOptions);
		expect(schema).toHaveProperty("user");
		expect(schema.user.fields).toHaveProperty("stripeCustomerId");
	});

	it("does not include subscription schema when disabled", () => {
		const schema: BetterAuthPluginDBSchema = getSchema({
			stripeClient: {} as any,
			stripeWebhookSecret: "secret",
			subscription: { enabled: false },
		} as StripeOptions);
		expect(schema).toHaveProperty("user");
		expect(schema).not.toHaveProperty("subscription");
	});

	it("includes subscription schema when enabled", () => {
		const schema = getSchema({
			stripeClient: {} as any,
			stripeWebhookSecret: "secret",
			subscription: {
				enabled: true,
				plans: [],
			},
		} as unknown as StripeOptions & {
			subscription: { enabled: true };
		});
		expect(schema).toHaveProperty("subscription");
		expect(schema).toHaveProperty("user");
		expect(schema.subscription.fields).toHaveProperty("plan");
		expect(schema.subscription.fields).toHaveProperty("referenceId");
		expect(schema.subscription.fields).toHaveProperty("status");
		expect(schema.subscription.fields).toHaveProperty("stripeSubscriptionId");
	});

	it("includes organization schema when enabled", () => {
		const schema = getSchema({
			stripeClient: {} as any,
			stripeWebhookSecret: "secret",
			organization: { enabled: true },
		} as unknown as StripeOptions & {
			organization: { enabled: true };
		});
		expect(schema).toHaveProperty("organization");
		expect(schema.organization.fields).toHaveProperty("stripeCustomerId");
	});

	it("includes all schemas when both subscription and organization are enabled", () => {
		const schema: BetterAuthPluginDBSchema = getSchema({
			stripeClient: {} as any,
			stripeWebhookSecret: "secret",
			subscription: { enabled: true, plans: [] },
			organization: { enabled: true },
		} as StripeOptions);
		expect(schema).toHaveProperty("user");
		expect(schema).toHaveProperty("subscription");
		expect(schema).toHaveProperty("organization");
	});

	it("strips subscription from custom schema when subscriptions are disabled", () => {
		const schema: BetterAuthPluginDBSchema = getSchema({
			stripeClient: {} as any,
			stripeWebhookSecret: "secret",
			subscription: { enabled: false },
			schema: {
				subscription: {
					fields: {
						customField: { type: "string" },
					},
				},
			},
		} as unknown as StripeOptions);
		expect(schema).not.toHaveProperty("subscription");
	});
});
