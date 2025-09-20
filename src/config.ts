// Central API base configuration for GitHub Pages deployment
// Production: Points to your root server
// Development: Still uses localhost for local testing
const resolved = (() => {
	// @ts-ignore Vite env typing
	const envBase = import.meta.env.VITE_API_BASE as string | undefined;
	if (envBase) return envBase.replace(/\/$/, '');
	
	// For production (GitHub Pages), always use your server
	if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
		return 'http://136.243.110.98:4000';
	}
	
	// For local development
	if (typeof window === 'undefined') return 'http://localhost:4000';
	if (window.location.port === '5173') {
		return `${window.location.protocol}//${window.location.hostname}:4000`;
	}
	
	// Fallback to your server
	return 'http://136.243.110.98:4000';
})();

export const API_BASE = resolved;
