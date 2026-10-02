import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants as fsConstants } from 'fs';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

import { sanitizeLogValue } from '../../common/utils/log-sanitize.utils';

@Injectable()
export class DashboardFeaturedShelfImageStorage {
  private readonly logger = new Logger(DashboardFeaturedShelfImageStorage.name);
  private readonly appDataPath: string;

  constructor(private readonly config: ConfigService) {
    this.appDataPath = this.config.get<string>('storage.appDataPath')!;
  }

  async save(shelfId: number, bytes: Buffer): Promise<void> {
    await mkdir(this.dir(), { recursive: true });
    await writeFile(this.filePath(shelfId), bytes);
  }

  async delete(shelfId: number): Promise<void> {
    await unlink(this.filePath(shelfId)).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') {
        this.logger.warn(
          `[dashboard.featured_shelf_image_delete] [fail] shelfId=${shelfId} errorClass=${err.name} error="${sanitizeLogValue(err.message)}" - shelf image cleanup failed`,
        );
      }
    });
  }

  async getPathIfExists(shelfId: number): Promise<string | null> {
    const path = this.filePath(shelfId);
    try {
      await access(path, fsConstants.R_OK);
      return path;
    } catch {
      return null;
    }
  }

  private filePath(shelfId: number): string {
    return join(this.dir(), `${shelfId}.jpg`);
  }

  private dir(): string {
    return join(this.appDataPath, 'dashboard-shelves');
  }
}
