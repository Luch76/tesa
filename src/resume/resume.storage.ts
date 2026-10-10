import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';

/** Key/value blob storage for resume files. Keys look like `<user hash>/<file name>`. */
export interface ResumeStorage {
  get(key: string): Promise<Buffer | null>;
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Stores files on the local disk (development and Docker Compose). */
export class FsResumeStorage implements ResumeStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.path(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async put(key: string, data: Buffer): Promise<void> {
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }

  private path(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return path;
  }
}

/**
 * Stores files through a plain HTTP object API (GET, PUT, DELETE on `<base>/<key>`).
 * On Cloudflare, the Worker answers these requests from the container with an R2 bucket.
 */
export class HttpResumeStorage implements ResumeStorage {
  constructor(private readonly baseUrl: string) {}

  async get(key: string): Promise<Buffer | null> {
    const res = await fetch(this.url(key));
    if (res.status === 404) return null;
    await assertOk(res, 'GET', key);
    return Buffer.from(await res.arrayBuffer());
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const res = await fetch(this.url(key), {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: new Uint8Array(data),
    });
    await assertOk(res, 'PUT', key);
  }

  async delete(key: string): Promise<void> {
    const res = await fetch(this.url(key), { method: 'DELETE' });
    if (res.status !== 404) await assertOk(res, 'DELETE', key);
  }

  private url(key: string): string {
    return `${this.baseUrl.replace(/\/+$/, '')}/${key}`;
  }
}

async function assertOk(res: Response, method: string, key: string) {
  if (!res.ok) {
    throw new Error(
      `Resume storage ${method} ${key} failed: ${res.status} ${await res.text()}`,
    );
  }
}

export const resumeStorageFor = (env: {
  storageUrl?: string;
  uploadDir?: string;
}): ResumeStorage =>
  env.storageUrl
    ? new HttpResumeStorage(env.storageUrl)
    : new FsResumeStorage(env.uploadDir ?? join('data', 'uploads'));
