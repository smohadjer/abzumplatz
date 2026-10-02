import type { VercelRequest } from './_apiTypes.js';

const deploymentHostname = (value?: string) => {
  if (!value) return null;

  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const trustedDeploymentHostnames = new Set([
  deploymentHostname(process.env.VERCEL_URL),
  deploymentHostname(process.env.VERCEL_BRANCH_URL),
  deploymentHostname(process.env.VERCEL_PROJECT_PRODUCTION_URL),
].filter((hostname): hostname is string => Boolean(hostname)));

export const getAppOrigin = (req: VercelRequest) => {
  const host = req.headers.host?.trim();
  if (!host) {
    throw new Error('Application host is unavailable');
  }

  let hostname: string;
  try {
    hostname = new URL(`http://${host}`).hostname.toLowerCase();
  } catch {
    throw new Error('Application host is invalid');
  }

  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const isAbzumplatzDomain = hostname === 'abzumplatz.de' || hostname.endsWith('.abzumplatz.de');
  const isCurrentDeployment = trustedDeploymentHostnames.has(hostname);

  if (!isLocal && !isAbzumplatzDomain && !isCurrentDeployment) {
    throw new Error('Application host is not trusted');
  }

  if (isLocal) {
    const forwardedProtocol = req.headers['x-forwarded-proto'];
    const protocolHeader = Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol;
    const protocol = protocolHeader?.split(',')[0].trim() === 'https' ? 'https' : 'http';
    return new URL(`${protocol}://${host}`).origin;
  }

  return `https://${hostname}`;
};
