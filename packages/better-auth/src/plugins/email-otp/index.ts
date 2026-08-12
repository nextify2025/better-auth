import type { BetterAuthPlugin } from "@better-auth/core";
import { createAuthMiddleware } from "@better-auth/core/api";
import { getDate } from "../../utils/date";
import { getEndpointResponse } from "../../utils/plugin-helper";
import { createRateLimitRules } from "../../utils/rate-limit";
import { PACKAGE_VERSION } from "../../version";
import { EMAIL_OTP_ERROR_CODES } from "./error-codes";
import { storeOTP } from "./otp-token";
import {
	changeEmailEmailOTP,
	checkVerificationOTP,
	createVerificationOTP,
	forgetPasswordEmailOTP,
	getVerificationOTP,
	requestEmailChangeEmailOTP,
	requestPasswordResetEmailOTP,
	resetPasswordEmailOTP,
	sendVerificationOTP,
	signInEmailOTP,
	verifyEmailOTP,
} from "./routes";
import type { EmailOTPOptions } from "./types";
import { defaultOTPGenerator, toOTPIdentifier } from "./utils";

declare module "@better-auth/core" {
	interface BetterAuthPluginRegistry<AuthOptions, Options> {
		"email-otp": {
			creator: typeof emailOTP;
		};
	}
}

export type { EmailOTPOptions } from "./types";

export const emailOTP = (options: EmailOTPOptions) => {
	const opts = {
		expiresIn: 5 * 60,
		generateOTP: () => defaultOTPGenerator(options),
		storeOTP: "plain",
		...options,
	} satisfies EmailOTPOptions;

	const sendVerificationOTPAction = sendVerificationOTP(opts);

	return {
		id: "email-otp",
		version: PACKAGE_VERSION,
		init(ctx) {
			if (!opts.overrideDefaultEmailVerification) {
				return;
			}
			return {
				options: {
					emailVerification: {
						async sendVerificationEmail(data, request) {
							await ctx.runInBackgroundOrAwait(
								sendVerificationOTPAction({
									context: ctx,
									request: request,
									body: {
										email: data.user.email,
										type: "email-verification",
									},
									//@ts-expect-error
									ctx,
								}),
							);
						},
					},
				},
			};
		},
		endpoints: {
			sendVerificationOTP: sendVerificationOTPAction,
			createVerificationOTP: createVerificationOTP(opts),
			getVerificationOTP: getVerificationOTP(opts),
			checkVerificationOTP: checkVerificationOTP(opts),
			verifyEmailOTP: verifyEmailOTP(opts),
			signInEmailOTP: signInEmailOTP(opts),
			requestPasswordResetEmailOTP: requestPasswordResetEmailOTP(opts),
			forgetPasswordEmailOTP: forgetPasswordEmailOTP(opts),
			resetPasswordEmailOTP: resetPasswordEmailOTP(opts),
			requestEmailChangeEmailOTP: requestEmailChangeEmailOTP(opts),
			changeEmailEmailOTP: changeEmailEmailOTP(opts),
		},
		hooks: {
			after: [
				{
					matcher(context) {
						return !!(
							context.path?.startsWith("/sign-up") &&
							opts.sendVerificationOnSignUp &&
							!opts.overrideDefaultEmailVerification
						);
					},
					handler: createAuthMiddleware(async (ctx) => {
						const response = await getEndpointResponse<{
							user: { email: string };
						}>(ctx);
						const email = response?.user.email;
						if (email) {
							const otp =
								opts.generateOTP({ email, type: "email-verification" }, ctx) ||
								defaultOTPGenerator(opts);
							const storedOTP = await storeOTP(ctx, opts, otp);
							await ctx.context.internalAdapter.createVerificationValue({
								value: `${storedOTP}:0`,
								identifier: toOTPIdentifier("email-verification", email),
								expiresAt: getDate(opts.expiresIn, "sec"),
							});
							await ctx.context.runInBackgroundOrAwait(
								options.sendVerificationOTP(
									{
										email,
										otp,
										type: "email-verification",
									},
									ctx,
								),
							);
						}
					}),
				},
			],
		},

		rateLimit: createRateLimitRules(
			[
				"/email-otp/send-verification-otp",
				"/email-otp/check-verification-otp",
				"/email-otp/verify-email",
				"/sign-in/email-otp",
				"/email-otp/request-password-reset",
				"/email-otp/reset-password",
				"/forget-password/email-otp",
				"/email-otp/request-email-change",
				"/email-otp/change-email",
			],
			opts.rateLimit?.window || 60,
			opts.rateLimit?.max || 3,
		),
		options,
		$ERROR_CODES: EMAIL_OTP_ERROR_CODES,
	} satisfies BetterAuthPlugin;
};
