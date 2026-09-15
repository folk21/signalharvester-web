import type { Page } from '@playwright/test';

export async function installMockEventSource(page: Page, autoReady = false) {
  await page.addInitScript(({ autoReady }) => {
    const sources: MockEventSource[] = [];
    class MockEventSource extends EventTarget {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSED = 2;
      readonly url: string;
      readonly withCredentials = false;
      readyState = MockEventSource.OPEN;
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;

      constructor(url: string | URL) {
        super();
        this.url = String(url);
        sources.push(this);
        if (autoReady) {
          queueMicrotask(() =>
            this.dispatchEvent(new MessageEvent('ready', { data: JSON.stringify({ cursor: 0 }) })),
          );
        }
      }

      close() {
        this.readyState = MockEventSource.CLOSED;
      }
    }

    Object.assign(window, {
      EventSource: MockEventSource,
      __signalHarvesterHasSseSource(urlIncludes: string) {
        return sources.some((source) =>
          source.readyState !== MockEventSource.CLOSED && source.url.includes(urlIncludes),
        );
      },
      __signalHarvesterEmitSse(eventName: string, data: unknown, urlIncludes?: string) {
        const source = [...sources].reverse().find((candidate) =>
          candidate.readyState !== MockEventSource.CLOSED
          && (!urlIncludes || candidate.url.includes(urlIncludes)),
        );
        if (!source) {
          return false;
        }
        source.dispatchEvent(new MessageEvent(eventName, { data: JSON.stringify(data) }));
        return true;
      },
    });
  }, { autoReady });
}

export async function waitForSseSource(page: Page, urlIncludes: string) {
  await page.waitForFunction((expectedUrl) => {
    const hasSource = (
      window as typeof window & {
        __signalHarvesterHasSseSource?: (urlPart: string) => boolean;
      }
    ).__signalHarvesterHasSseSource;
    return hasSource?.(expectedUrl) ?? false;
  }, urlIncludes);
}

export async function emitSse(
  page: Page,
  eventName: string,
  data: unknown,
  urlIncludes?: string,
) {
  const emitted = await page.evaluate(({ eventName, data, urlIncludes }) => {
    const emit = (
      window as typeof window & {
        __signalHarvesterEmitSse?: (name: string, value: unknown, urlPart?: string) => boolean;
      }
    ).__signalHarvesterEmitSse;
    if (!emit) {
      throw new Error('Mock EventSource is not installed');
    }
    return emit(eventName, data, urlIncludes);
  }, { eventName, data, urlIncludes });
  if (!emitted) {
    throw new Error(`No open mock EventSource matched ${urlIncludes ?? 'the current stream'}`);
  }
}
