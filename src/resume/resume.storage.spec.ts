import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  FsResumeStorage,
  HttpResumeStorage,
  ResumeStorage,
} from './resume.storage.js';

/** A stand-in for the Cloudflare Worker's R2-backed object API. */
function fakeObjectServer(): Promise<{ server: Server; url: string }> {
  const objects = new Map<string, Buffer>();
  const server = createServer((req, res) => {
    const key = req.url!.slice(1);
    if (req.method === 'GET') {
      const body = objects.get(key);
      res.writeHead(body ? 200 : 404).end(body);
    } else if (req.method === 'PUT') {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        objects.set(key, Buffer.concat(chunks));
        res.writeHead(204).end();
      });
    } else if (req.method === 'DELETE') {
      objects.delete(key);
      res.writeHead(204).end();
    } else {
      res.writeHead(405).end();
    }
  });
  return new Promise((done) =>
    server.listen(0, '127.0.0.1', () =>
      done({
        server,
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/`,
      }),
    ),
  );
}

const backends: [string, () => Promise<[ResumeStorage, () => void]>][] = [
  [
    'FsResumeStorage',
    () => {
      const dir = mkdtempSync(join(tmpdir(), 'tesa-storage-'));
      return Promise.resolve([
        new FsResumeStorage(dir),
        () => rmSync(dir, { recursive: true, force: true }),
      ]);
    },
  ],
  [
    'HttpResumeStorage',
    async () => {
      const { server, url } = await fakeObjectServer();
      return [new HttpResumeStorage(url), () => server.close()];
    },
  ],
];

describe.each(backends)('%s', (_name, create) => {
  let storage: ResumeStorage;
  let cleanup: () => void;

  beforeEach(async () => {
    [storage, cleanup] = await create();
  });

  afterEach(() => cleanup());

  it('round-trips, overwrites and deletes a file', async () => {
    const key = 'abc123/resume.pdf';
    expect(await storage.get(key)).toBeNull();

    await storage.put(key, Buffer.from('%PDF-1'), 'application/pdf');
    expect((await storage.get(key))?.toString()).toBe('%PDF-1');

    await storage.put(key, Buffer.from('%PDF-2'), 'application/pdf');
    expect((await storage.get(key))?.toString()).toBe('%PDF-2');

    await storage.delete(key);
    expect(await storage.get(key)).toBeNull();
  });

  it('treats deleting a missing file as a no-op', async () => {
    await expect(storage.delete('abc123/missing.pdf')).resolves.toBeUndefined();
  });
});

it('FsResumeStorage refuses keys that escape its folder', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tesa-storage-'));
  try {
    await expect(
      new FsResumeStorage(dir).get('../outside.txt'),
    ).rejects.toThrow('Invalid storage key');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
