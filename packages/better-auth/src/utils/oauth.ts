/**
 * Formats an OAuth error redirect URL by appending `error` and
 * `error_description` query parameters.
 */
export function formatOAuthErrorURL(
	url: string,
	error: string,
	description: string,
) {
	return `${url}${
		url.includes("?") ? "&" : "?"
	}error=${error}&error_description=${description}`;
}
