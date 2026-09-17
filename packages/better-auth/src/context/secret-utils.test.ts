import { describe, expect, it, vi } from "vitest";
import {
	buildSecretConfig,
	parseSecretsEnv,
	validateSecretsArray,
} from "./secret-utils";

const createMockLogger = () => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
	success: vi.fn(),
	log: vi.fn(),
});

describe("parseSecretsEnv", () => {
	it("returns null for undefined input", () => {
		expect(parseSecretsEnv(undefined)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(parseSecretsEnv("")).toBeNull();
	});

	it("parses a single secret entry", () => {
		const result = parseSecretsEnv("0:my-secret-value");
		expect(result).toEqual([{ version: 0, value: "my-secret-value" }]);
	});

	it("parses multiple comma-separated entries", () => {
		const result = parseSecretsEnv("0:current-secret,1:old-secret");
		expect(result).toEqual([
			{ version: 0, value: "current-secret" },
			{ version: 1, value: "old-secret" },
		]);
	});

	it("trims whitespace from entries", () => {
		const result = parseSecretsEnv(" 0:secret1 , 1:secret2 ");
		expect(result).toEqual([
			{ version: 0, value: "secret1" },
			{ version: 1, value: "secret2" },
		]);
	});

	it("handles secrets containing colons", () => {
		const result = parseSecretsEnv("0:secret:with:colons");
		expect(result).toEqual([{ version: 0, value: "secret:with:colons" }]);
	});

	it("throws for entry without colon separator", () => {
		expect(() => parseSecretsEnv("noseparator")).toThrow(
			"Invalid BETTER_AUTH_SECRETS entry",
		);
	});

	it("throws for negative version", () => {
		expect(() => parseSecretsEnv("-1:secret")).toThrow(
			"Invalid version in BETTER_AUTH_SECRETS",
		);
	});

	it("throws for non-numeric version", () => {
		expect(() => parseSecretsEnv("abc:secret")).toThrow(
			"Invalid version in BETTER_AUTH_SECRETS",
		);
	});

	it("throws for empty secret value", () => {
		expect(() => parseSecretsEnv("0:")).toThrow(
			"Empty secret value for version 0",
		);
	});
});

describe("validateSecretsArray", () => {
	it("passes for valid secrets", () => {
		const logger = createMockLogger();
		expect(() =>
			validateSecretsArray(
				[{ version: 0, value: "a".repeat(32) + "!@#$%^&*()_+12345678" }],
				logger as any,
			),
		).not.toThrow();
	});

	it("throws for empty array", () => {
		const logger = createMockLogger();
		expect(() => validateSecretsArray([], logger as any)).toThrow(
			"at least one entry",
		);
	});

	it("throws for duplicate versions", () => {
		const logger = createMockLogger();
		expect(() =>
			validateSecretsArray(
				[
					{ version: 0, value: "a".repeat(40) },
					{ version: 0, value: "b".repeat(40) },
				],
				logger as any,
			),
		).toThrow("Duplicate version 0");
	});

	it("throws for empty secret value", () => {
		const logger = createMockLogger();
		expect(() =>
			validateSecretsArray([{ version: 0, value: "" }], logger as any),
		).toThrow("Empty secret value");
	});

	it("warns for short secrets", () => {
		const logger = createMockLogger();
		validateSecretsArray([{ version: 0, value: "short" }], logger as any);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("at least 32 characters"),
		);
	});

	it("warns for low-entropy secrets", () => {
		const logger = createMockLogger();
		validateSecretsArray(
			[{ version: 0, value: "a".repeat(40) }],
			logger as any,
		);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("low-entropy"),
		);
	});
});

describe("buildSecretConfig", () => {
	it("builds config from secrets array", () => {
		const config = buildSecretConfig(
			[
				{ version: 0, value: "current" },
				{ version: 1, value: "old" },
			],
			"legacy",
		);
		expect(config.currentVersion).toBe(0);
		expect(config.keys.get(0)).toBe("current");
		expect(config.keys.get(1)).toBe("old");
		expect(config.legacySecret).toBe("legacy");
	});

	it("omits legacySecret when it matches DEFAULT_SECRET", () => {
		const config = buildSecretConfig(
			[{ version: 0, value: "current" }],
			"better-auth-secret-12345678901234567890",
		);
		expect(config.legacySecret).toBeUndefined();
	});

	it("omits legacySecret when empty", () => {
		const config = buildSecretConfig([{ version: 0, value: "current" }], "");
		expect(config.legacySecret).toBeUndefined();
	});
});
