import { spawnSync } from 'node:child_process';

const image = process.env.SIGNALHARVESTER_WEB_IMAGE ?? 'signalharvester-web:local';
const apiBaseUrl = process.env.SIGNALHARVESTER_WEB_API_BASE_URL ?? 'http://localhost:8080';
const containerName = `signalharvester-web-verify-${process.pid}`;

const dockerProbe = spawnSync('docker', ['version'], { encoding: 'utf8', stdio: 'ignore' });
if (dockerProbe.error?.code === 'ENOENT') {
  console.error('ERROR Docker is required for image verification but was not found on PATH.');
  process.exit(2);
}
if (dockerProbe.status !== 0) {
  console.error('ERROR Docker is required for image verification and its daemon must be reachable.');
  process.exit(2);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const details = options.capture ? `${result.stdout ?? ''}${result.stderr ?? ''}` : '';
    throw new Error(`${command} ${args.join(' ')} failed${details ? `:\n${details}` : ''}`);
  }
  return options.capture ? (result.stdout ?? '').trim() : '';
}

async function waitFor(url) {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

try {
  run('docker', [
    'build',
    '--build-arg',
    `VITE_API_BASE_URL=${apiBaseUrl}`,
    '-t',
    image,
    '.',
  ]);

  const imageUser = run('docker', ['image', 'inspect', image, '--format', '{{.Config.User}}'], { capture: true });
  if (!imageUser || imageUser === '0' || imageUser === 'root') {
    throw new Error(`Expected a non-root runtime image user, got ${imageUser || '<empty>'}`);
  }

  run('docker', ['run', '--rm', '-d', '--name', containerName, '-p', '127.0.0.1::8080', image]);
  const portOutput = run('docker', ['port', containerName, '8080/tcp'], { capture: true });
  const portMatch = portOutput.match(/:(\d+)$/);
  if (!portMatch) {
    throw new Error(`Could not parse mapped frontend port from: ${portOutput}`);
  }

  const baseUrl = `http://127.0.0.1:${portMatch[1]}`;
  const rootResponse = await waitFor(`${baseUrl}/`);
  const rootHtml = await rootResponse.text();
  if (!rootHtml.includes('<div id="root"></div>')) {
    throw new Error('Container root did not return the production application shell');
  }

  const deepLinkResponse = await fetch(`${baseUrl}/results`);
  const deepLinkHtml = await deepLinkResponse.text();
  if (!deepLinkResponse.ok || !deepLinkHtml.includes('<div id="root"></div>')) {
    throw new Error('Container did not return the SPA shell for /results deep links');
  }

  console.log(`Verified ${image}: non-root runtime, HTTP :8080, root shell, and SPA deep-link fallback.`);
} finally {
  spawnSync('docker', ['rm', '-f', containerName], { stdio: 'ignore' });
}
