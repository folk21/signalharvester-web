import { readFile } from 'node:fs/promises';

const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
const nginxConfig = await readFile(new URL('../infra/nginx/default.conf', import.meta.url), 'utf8');

const checks = [
  ['Docker build uses npm ci', dockerfile.includes('RUN npm ci')],
  ['Docker build regenerates OpenAPI types', dockerfile.includes('npm run api:generate')],
  ['Docker build creates the production bundle', dockerfile.includes('npm run build')],
  ['Docker build accepts VITE_API_BASE_URL', dockerfile.includes('ARG VITE_API_BASE_URL=')],
  ['Runtime serves only the built dist output', dockerfile.includes('COPY --from=build /workspace/dist /usr/share/nginx/html')],
  ['Runtime exposes port 8080', dockerfile.includes('EXPOSE 8080')],
  ['Runtime declares a non-root user', /\nUSER\s+(?!0\b|root\b)\S+/.test(`\n${dockerfile}`)],
  ['Static server listens on port 8080', /listen\s+8080\s*;/.test(nginxConfig)],
  ['Static server supports SPA deep links', nginxConfig.includes('try_files $uri $uri/ /index.html;')],
  ['Hashed assets are cacheable as immutable', nginxConfig.includes('max-age=31536000, immutable')],
  ['HTML navigation remains revalidation-safe', nginxConfig.includes('Cache-Control "no-cache"')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
