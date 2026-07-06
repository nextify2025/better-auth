/**
 * Creates an array of rate-limit rules that share the same window and max,
 * each matching a single exact path.
 */
export function createRateLimitRules(
	paths: string[],
	window: number,
	max: number,
) {
	return paths.map((p) => ({
		pathMatcher(path: string) {
			return path === p;
		},
		window,
		max,
	}));
}
