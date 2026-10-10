import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

/** Accepted resume formats, identified by their file signature rather than the extension. */
const FORMATS = [
  {
    ext: 'pdf',
    mimeType: 'application/pdf',
    magic: Buffer.from('%PDF-'),
  },
  {
    ext: 'docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    magic: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  },
  {
    ext: 'doc',
    mimeType: 'application/msword',
    magic: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
] as const;

export const RESUME_ACCEPT = FORMATS.flatMap((f) => [
  `.${f.ext}`,
  f.mimeType,
]).join(',');

export interface ResumeInfo {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface StoredResume extends ResumeInfo {
  storedName: string;
}

@Injectable()
export class ResumeService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(
      config.get<string>('UPLOAD_DIR') ?? join('data', 'uploads'),
    );
  }

  async save(userId: string, file: Express.Multer.File): Promise<ResumeInfo> {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const format = FORMATS.find(
      (f) =>
        f.ext === ext &&
        file.buffer.subarray(0, f.magic.length).equals(f.magic),
    );
    if (!format) {
      throw new UnsupportedMediaTypeException(
        'Upload a PDF or Word document (.pdf, .doc, .docx)',
      );
    }

    const dir = this.userDir(userId);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const stored: StoredResume = {
      originalName: cleanFileName(file.originalname),
      mimeType: format.mimeType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      storedName: `resume.${format.ext}`,
    };
    await writeFile(join(dir, stored.storedName), file.buffer);
    await writeFile(join(dir, 'meta.json'), JSON.stringify(stored));
    return toInfo(stored);
  }

  async find(userId: string): Promise<ResumeInfo | null> {
    const stored = await this.readMeta(userId);
    return stored && toInfo(stored);
  }

  async read(
    userId: string,
  ): Promise<{ info: ResumeInfo; data: Buffer } | null> {
    const stored = await this.readMeta(userId);
    if (!stored) return null;
    const data = await readFile(join(this.userDir(userId), stored.storedName));
    return { info: toInfo(stored), data };
  }

  async remove(userId: string): Promise<void> {
    await rm(this.userDir(userId), { recursive: true, force: true });
  }

  private async readMeta(userId: string): Promise<StoredResume | null> {
    try {
      const json = await readFile(
        join(this.userDir(userId), 'meta.json'),
        'utf8',
      );
      return JSON.parse(json) as StoredResume;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  /** Hashing the Google user id keeps the path safe and free of personal data. */
  private userDir(userId: string): string {
    const key = createHash('sha256').update(userId).digest('hex');
    return join(this.root, key);
  }
}

const toInfo = ({ storedName: _storedName, ...info }: StoredResume) => info;

// oxlint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** Keeps only the base name, without control characters, for display and downloads. */
const cleanFileName = (name: string) =>
  basename(name.replace(/\\/g, '/')).replace(CONTROL_CHARS, '').slice(0, 200) ||
  'resume';
