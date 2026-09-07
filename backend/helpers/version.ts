import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface VersionInfo {
  version: string;
  commit: string;
  branch: string;
  buildTime: string;
}

const SERVER_START_TIME = new Date();

export function formatTimeAgo(date: Date | string | number): string {
  const then = new Date(date).getTime();
  if (isNaN(then)) return 'unknown';

  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSeconds < 5) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

export function formatUptime(uptimeSeconds: number): string {
  const s = Math.floor(uptimeSeconds % 60);
  const m = Math.floor((uptimeSeconds / 60) % 60);
  const h = Math.floor((uptimeSeconds / 3600) % 24);
  const d = Math.floor(uptimeSeconds / 86400);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

let cachedVersion: VersionInfo | null = null;

function loadVersionInfo(): VersionInfo {
  if (cachedVersion) return cachedVersion;

  // Search candidate paths for version.json
  const candidatePaths = [
    path.join(process.cwd(), 'version.json'),
    path.join(process.cwd(), 'dist', 'version.json'),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const data = JSON.parse(fs.readFileSync(candidate, 'utf8'));
        if (data.commit) {
          cachedVersion = data;
          return data;
        }
      }
    } catch {}
  }

  // Fallback to git CLI if running locally or in development
  let commit = process.env.GIT_COMMIT || process.env.GIT_COMMIT_SHA || '';
  let branch = process.env.GIT_BRANCH || '';

  if (!commit) {
    try {
      commit = execSync('git rev-parse --short HEAD', { timeout: 1000 }).toString().trim();
    } catch {
      commit = 'unknown';
    }
  }

  if (!branch) {
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { timeout: 1000 }).toString().trim();
    } catch {
      branch = process.env.NODE_ENV || 'unknown';
    }
  }

  let pkgVersion = '1.0.0';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    pkgVersion = pkg.version || '1.0.0';
  } catch {}

  cachedVersion = {
    version: pkgVersion,
    commit,
    branch,
    buildTime: SERVER_START_TIME.toISOString(),
  };

  return cachedVersion;
}

export function getHealthInfo() {
  const versionInfo = loadVersionInfo();
  const uptimeSec = process.uptime();
  const mem = process.memoryUsage();

  return {
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    version: versionInfo.version,
    git: {
      commit: versionInfo.commit,
      branch: versionInfo.branch,
    },
    build: {
      time: versionInfo.buildTime,
      timeAgo: formatTimeAgo(versionInfo.buildTime),
    },
    uptime: {
      seconds: Math.floor(uptimeSec),
      human: formatUptime(uptimeSec),
    },
    system: {
      node: process.version,
      platform: process.platform,
      memory: {
        heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      },
    },
  };
}
