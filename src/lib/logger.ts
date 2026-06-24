const isServer = typeof window === 'undefined';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const levelOrder = ['debug', 'info', 'warn', 'error'];

// Expose setLogLevel to browser console
if (typeof window !== 'undefined') {
  window.setLogLevel = setLogLevel;
}

function resolveLogLevel(): LogLevel {
	// Try to get from Vite env (works only in browser/client or statically at build)
	const viteEnv = import.meta?.env?.VITE_LOG_LEVEL;

	// Then check runtime environment variables (server only)
	const runtimeEnv = isServer ? process.env.VITE_LOG_LEVEL : undefined;

	const level = viteEnv || runtimeEnv || 'info';

	if (!levelOrder.includes(level)) return 'info';
	return level as LogLevel;
}

let currentLevel = levelOrder.indexOf(resolveLogLevel());


function log(level: LogLevel, ...args: unknown[]) {
	if (levelOrder.indexOf(level) >= currentLevel) {
		const label = isServer ? '[server]' : '[client]';
		console[level](`${new Date().toISOString()} ${label}`, ...args);
	}
}

export const logger = {
	debug: (...args: unknown[]) => log('debug', ...args),
	info: (...args: unknown[]) => log('info', ...args),
	warn: (...args: unknown[]) => log('warn', ...args),
	error: (...args: unknown[]) => log('error', ...args),
};

// Dynamically set log level at runtime (browser only)
export function setLogLevel(level: LogLevel) {
	if (!isServer && levelOrder.includes(level)) {
		localStorage.setItem('logLevel', level);
		currentLevel = levelOrder.indexOf(level); // Update immediately
		logger.info(`Log level set to '${level}'`);
	}
}