/* Centralized lightweight logger utility.
 * Usage: import logger from '../utils/logger';
 * logger.info('Something'); logger.debug('Details', data);
 * Control verbosity using environment variables at build time:
 *   REACT_APP_LOG_LEVEL=info|warn|error|debug (default: info in production, debug otherwise)
 *   REACT_APP_LOG_STRATEGY=minimal (hides info/debug; only errors & warns)
 */

const LEVELS = ["debug", "info", "warn", "error"];

function getEnv(name, fallback) {
  if (
    typeof process !== "undefined" &&
    process.env &&
    Object.prototype.hasOwnProperty.call(process.env, name)
  ) {
    return process.env[name];
  }
  return fallback;
}

const detectedNodeEnv = getEnv("NODE_ENV");
const defaultLevel = detectedNodeEnv === "production" ? "info" : "debug";
const configuredLevel = (
  getEnv("REACT_APP_LOG_LEVEL", defaultLevel) || ""
).toLowerCase();
const strategy = getEnv("REACT_APP_LOG_STRATEGY", "").toLowerCase();

const activeLevelIndex =
  LEVELS.indexOf(configuredLevel) === -1
    ? LEVELS.indexOf(defaultLevel)
    : LEVELS.indexOf(configuredLevel);

function shouldLog(level) {
  if (strategy === "minimal" && (level === "debug" || level === "info"))
    return false;
  return LEVELS.indexOf(level) >= activeLevelIndex;
}

function formatPrefix(level) {
  const ts = new Date().toISOString();
  switch (level) {
    case "debug":
      return `[DEBUG ${ts}]`;
    case "info":
      return `[INFO  ${ts}]`;
    case "warn":
      return `[WARN  ${ts}]`;
    case "error":
      return `[ERROR ${ts}]`;
    default:
      return `[LOG ${ts}]`;
  }
}

function output(method, level, args) {
  if (!shouldLog(level)) return;
  // eslint-disable-next-line no-console
  console[method](formatPrefix(level), ...args);
}

const logger = {
  debug: (...args) => output("log", "debug", args),
  info: (...args) => output("log", "info", args),
  warn: (...args) => output("warn", "warn", args),
  error: (...args) => output("error", "error", args),
  level: LEVELS[activeLevelIndex],
  strategy,
};

export default logger;
