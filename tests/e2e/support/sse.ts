import type { Page } from '@playwright/test';

export async function installMockEventSource(page: Page, autoReady = false) {
  await page.addInitScript(({ autoReady }) => {
    const sources: EventTarget[] = [];
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
      __signalHarvesterEmitSse(eventName: string, data: unknown) {
        const source = sources.at(-1);
        source?.dispatchEvent(new MessageEvent(eventName, { data: JSON.stringify(data) }));
      },
    });
  }, { autoReady });
}

export async function emitSse(page: Page, eventName: string, data: unknown) {
  await page.evaluate(({ eventName, data }) => {
    const emit = (
      window as typeof window & {
        __signalHarvesterEmitSse?: (name: string, value: unknown) => void;
      }
    ).__signalHarvesterEmitSse;
    if (!emit) {
      throw new Error('Mock EventSource is not installed');
    }
    emit(eventName, data);
  }, { eventName, data });
}
