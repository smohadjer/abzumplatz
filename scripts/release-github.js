import fs from 'node:fs/promises';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function runGitCommand(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
}

function printUsage() {
  console.log(`Usage: npm run release:github

Creates a GitHub release for the current package.json version.

Requirements:
  - Run from a clean git working tree
  - Current branch must be master
  - GITHUB_TOKEN must be set in .env or the environment
  - CHANGELOG.md must contain a matching section like: ## <version>
`);
}

function parseRemoteUrl(remoteUrl) {
  const sshMatch = remoteUrl.match(/^git@github\.com:([^/]+)\/(.+)\.git$/);

  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2],
    };
  }

  const httpsMatch = remoteUrl.match(/^https:\/\/github\.com\/([^/]+)\/(.+)\.git$/);

  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2],
    };
  }

  throw new Error(`Unsupported origin remote URL: ${remoteUrl}`);
}

function extractReleaseNotes(changelog, version) {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`## ${escapedVersion}\\n([\\s\\S]*?)(?:\\n## |$)`);
  const match = changelog.match(regex);

  if (!match) {
    throw new Error(`Could not find changelog section for version ${version}`);
  }

  return `## ${version}\n${match[1].trim()}`;
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'abzumplatz-release-script',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers ?? {}),
    },
    body: options.body,
  });

  if (response.status === 404 && options.allowNotFound) {
    return null;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${message}`);
  }

  return response.json();
}

async function main() {
  if (process.argv.includes('--help')) {
    printUsage();
    return;
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN. Add it to .env or your environment.');
  }

  const status = runGitCommand(['status', '--porcelain']);

  if (status) {
    throw new Error('Working tree is not clean. Commit or stash changes before releasing.');
  }

  const branch = runGitCommand(['branch', '--show-current']);

  if (branch !== 'master') {
    throw new Error(`Releases must be created from master. Current branch: ${branch}`);
  }

  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  const version = packageJson.version;

  if (!version) {
    throw new Error('package.json does not contain a version.');
  }

  const changelog = await fs.readFile('CHANGELOG.md', 'utf8');
  const releaseNotes = extractReleaseNotes(changelog, version);
  const remoteUrl = runGitCommand(['remote', 'get-url', 'origin']);
  const { owner, repo } = parseRemoteUrl(remoteUrl);
  const tagRef = `refs/tags/${version}`;

  try {
    runGitCommand(['rev-parse', '--verify', tagRef]);
    console.log(`Tag ${version} already exists locally.`);
  } catch {
    runGitCommand(['tag', version]);
    console.log(`Created local tag ${version}.`);
  }

  runGitCommand(['push', 'origin', version]);
  console.log(`Pushed tag ${version} to origin.`);

  const existingRelease = await githubRequest(`/repos/${owner}/${repo}/releases/tags/${version}`, token, {
    allowNotFound: true,
  });

  if (existingRelease) {
    throw new Error(`A GitHub release for tag ${version} already exists: ${existingRelease.html_url}`);
  }

  const release = await githubRequest(`/repos/${owner}/${repo}/releases`, token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tag_name: version,
      target_commitish: 'master',
      name: version,
      body: releaseNotes,
      draft: false,
      prerelease: false,
    }),
  });

  console.log(`Created GitHub release: ${release.html_url}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
