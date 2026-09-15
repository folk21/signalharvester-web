import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const distDir = path.resolve('dist');
const manifestPath = path.join(distDir, '.vite', 'manifest.json');
const expectedRouteEntries = [
  'src/features/dashboard/DashboardPage.tsx',
  'src/features/sources/SourcesPage.tsx',
  'src/features/profiles/MonitoringProfilesPage.tsx',
  'src/features/runs/CollectionRunsPage.tsx',
  'src/features/analysis/AnalysisItemsPage.tsx',
  'src/features/results/ResultsPage.tsx',
  'src/features/events/EventExplorerPage.tsx',
  'src/features/flows/ProcessingFlowPage.tsx',
];

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const missingDynamicRoutes = expectedRouteEntries.filter((entry) => !manifest[entry]?.isDynamicEntry);
if (missingDynamicRoutes.length > 0) {
  throw new Error(`Expected route-level dynamic build entries are missing: ${missingDynamicRoutes.join(', ')}`);
}

const assetFiles = (await walk(path.join(distDir, 'assets')))
  .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
  .sort();

let totalRaw = 0;
let totalGzip = 0;
const rows = [];
for (const file of assetFiles) {
  const bytes = await readFile(file);
  const raw = bytes.byteLength;
  const gzip = gzipSync(bytes).byteLength;
  totalRaw += raw;
  totalGzip += gzip;
  rows.push({ file: path.relative(distDir, file), raw, gzip });
}

console.log(`Verified ${expectedRouteEntries.length} route-level dynamic build entries.`);
console.log('Production JS/CSS asset baseline:');
for (const row of rows) {
  console.log(`  ${row.file}: ${formatKiB(row.raw)} raw / ${formatKiB(row.gzip)} gzip`);
}
console.log(`  TOTAL: ${formatKiB(totalRaw)} raw / ${formatKiB(totalGzip)} gzip`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(target));
    } else if (entry.isFile()) {
      files.push(target);
    }
  }
  return files;
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
