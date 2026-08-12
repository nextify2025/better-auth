import { generateRandomString } from "../crypto/random";

/**
 * Generates a numeric OTP of the given length.
 */
export function generateNumericOTP(length: number) {
	return generateRandomString(length, "0-9");
}
