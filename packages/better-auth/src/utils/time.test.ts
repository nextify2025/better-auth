import { describe, expect, it } from "vitest";
import { ms, sec } from "./time";

describe("ms", () => {
	it("parses seconds", () => {
		expect(ms("30s")).toBe(30_000);
		expect(ms("1sec")).toBe(1_000);
		expect(ms("2 seconds")).toBe(2_000);
	});

	it("parses minutes", () => {
		expect(ms("5m")).toBe(300_000);
		expect(ms("1min")).toBe(60_000);
		expect(ms("2 minutes")).toBe(120_000);
	});

	it("parses hours", () => {
		expect(ms("1h")).toBe(3_600_000);
		expect(ms("2 hours")).toBe(7_200_000);
		expect(ms("1hr")).toBe(3_600_000);
	});

	it("parses days", () => {
		expect(ms("1d")).toBe(86_400_000);
		expect(ms("7 days")).toBe(604_800_000);
	});

	it("parses weeks", () => {
		expect(ms("1w")).toBe(604_800_000);
		expect(ms("2 weeks")).toBe(1_209_600_000);
	});

	it("parses months", () => {
		expect(ms("1mo")).toBe(2_592_000_000);
		expect(ms("2 months")).toBe(5_184_000_000);
	});

	it("parses years", () => {
		expect(ms("1y")).toBe(365.25 * 86_400_000);
		expect(ms("1 year")).toBe(365.25 * 86_400_000);
	});

	it("handles negative prefix", () => {
		expect(ms("-5m")).toBe(-300_000);
		expect(ms("- 30s")).toBe(-30_000);
	});

	it("handles positive prefix", () => {
		expect(ms("+5m")).toBe(300_000);
		expect(ms("+ 30s")).toBe(30_000);
	});

	it("handles 'ago' suffix", () => {
		expect(ms("2 hours ago")).toBe(-7_200_000);
		expect(ms("1d ago")).toBe(-86_400_000);
	});

	it("handles 'from now' suffix", () => {
		expect(ms("5m from now")).toBe(300_000);
	});

	it("handles decimal values", () => {
		expect(ms("1.5h")).toBe(5_400_000);
		expect(ms("0.5d")).toBe(43_200_000);
	});

	it("handles case-insensitive units", () => {
		expect(ms("1H")).toBe(3_600_000);
		expect(ms("1 Hour")).toBe(3_600_000);
		expect(ms("1 HOURS")).toBe(3_600_000);
	});

	it("throws on invalid format", () => {
		expect(() => ms("invalid" as any)).toThrow(TypeError);
		expect(() => ms("" as any)).toThrow(TypeError);
	});

	it("throws when both prefix and suffix are used", () => {
		expect(() => ms("-5m ago" as any)).toThrow(TypeError);
	});
});

describe("sec", () => {
	it("returns value in seconds", () => {
		expect(sec("1d")).toBe(86_400);
		expect(sec("2 hours")).toBe(7_200);
	});

	it("handles negative values", () => {
		expect(sec("-30s")).toBe(-30);
		expect(sec("2 hours ago")).toBe(-7_200);
	});

	it("rounds to nearest second", () => {
		expect(sec("1.5s")).toBe(2);
	});
});
