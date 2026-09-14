import { createServer, type Server } from 'node:http';

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>SignalHarvester browser fixture</title>
  <item><guid>browser-fixture-entry-1</guid><title>Java browser fixture</title>
    <link>/items/1</link><description>Java backend Kafka browser integration</description>
    <pubDate>Mon, 14 Sep 2026 08:00:00 GMT</pubDate></item>
  <item><guid>browser-fixture-entry-2</guid><title>PostgreSQL browser fixture</title>
    <link>/items/2</link><description>PostgreSQL browser result fixture</description>
    <pubDate>Mon, 14 Sep 2026 08:01:00 GMT</pubDate></item>
</channel></rss>`;

export interface RssFixtureServer {
  location: string;
  close(): Promise<void>;
}

export async function startRssFixtureServer(): Promise<RssFixtureServer> {
  const server = createServer((request, response) => {
    if (request.url !== '/feed.xml') {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=UTF-8',
      'Content-Length': Buffer.byteLength(feed),
    });
    response.end(feed);
  });

  await listen(server);
  const address = server.address();
  if (!address || typeof address === 'string') {
    await close(server);
    throw new Error('Failed to resolve local RSS fixture address.');
  }

  const advertisedHost = process.env.SIGNALHARVESTER_LIVE_FIXTURE_HOST || '127.0.0.1';
  return {
    location: `http://${advertisedHost}:${address.port}/feed.xml`,
    close: () => close(server),
  };
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '0.0.0.0', () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
