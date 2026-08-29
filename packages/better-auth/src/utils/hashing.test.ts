import { describe, expect, it } from "vitest";
import { toChecksumAddress } from "./hashing";

describe("toChecksumAddress", () => {
	it("converts a lowercase address to checksum format", () => {
		expect(
			toChecksumAddress("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"),
		).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
	});

	it("handles already-checksummed address", () => {
		const checksummed = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
		expect(toChecksumAddress(checksummed)).toBe(checksummed);
	});

	it("handles uppercase address", () => {
		expect(
			toChecksumAddress("0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED"),
		).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
	});

	it("handles well-known addresses (ERC-55 test vectors)", () => {
		expect(
			toChecksumAddress("0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359"),
		).toBe("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359");

		expect(
			toChecksumAddress("0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb"),
		).toBe("0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB");

		expect(
			toChecksumAddress("0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb"),
		).toBe("0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb");
	});

	it("handles address without 0x prefix", () => {
		const result = toChecksumAddress(
			"5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
		);
		expect(result).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
	});
});
