const isDevelopment = process.env.NODE_ENV === 'development';

export const debug = {
  log: (...args: unknown[]) => {
    if (!isDevelopment) return;
    console.log(`[DEBUG ${new Date().toISOString()}]`, ...args);
  },
  warn: (...args: unknown[]) => {
    if (!isDevelopment) return;
    console.warn(`[DEBUG ${new Date().toISOString()}]`, ...args);
  },
  error: (...args: unknown[]) => {
    if (!isDevelopment) return;
    console.error(`[DEBUG ${new Date().toISOString()}]`, ...args);
  },
  time: (label: string) => {
    if (!isDevelopment) return;
    console.time(`[PERF] ${label}`);
  },
  timeEnd: (label: string) => {
    if (!isDevelopment) return;
    console.timeEnd(`[PERF] ${label}`);
  },
};