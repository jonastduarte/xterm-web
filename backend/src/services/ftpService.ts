import * as ftp from 'basic-ftp';
import { Writable } from 'stream';

export interface FtpConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
}

export class FtpService {
  private static async getClient(config: FtpConfig): Promise<ftp.Client> {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    await client.access({
      host: config.host,
      port: Number(config.port) || 21,
      user: config.username,
      password: config.password || '',
      secure: false
    });
    return client;
  }

  public static async list(config: FtpConfig, targetPath: string) {
    const client = await this.getClient(config);
    try {
      const list = await client.list(targetPath || '/');
      return list.map((item) => ({
        filename: item.name,
        longname: `${item.type === ftp.FileType.Directory ? 'd' : '-'}${item.permissions?.toString() || 'rwxr-xr-x'} ${item.user || '-'} ${item.group || '-'} ${item.size} ${item.rawModifiedAt || ''} ${item.name}`,
        isDirectory: item.type === ftp.FileType.Directory,
        size: item.size,
        mtime: item.modifiedAt ? Math.floor(item.modifiedAt.getTime() / 1000) : 0
      }));
    } finally {
      client.close();
    }
  }

  public static async upload(config: FtpConfig, localPath: string, remotePath: string) {
    const client = await this.getClient(config);
    try {
      await client.uploadFrom(localPath, remotePath);
    } finally {
      client.close();
    }
  }

  public static async download(config: FtpConfig, remotePath: string, destinationStream: Writable) {
    const client = await this.getClient(config);
    try {
      await client.downloadTo(destinationStream, remotePath);
    } finally {
      client.close();
    }
  }

  public static async delete(config: FtpConfig, targetPath: string, isDirectory: boolean) {
    const client = await this.getClient(config);
    try {
      if (isDirectory) {
        await client.removeDir(targetPath);
      } else {
        await client.remove(targetPath);
      }
    } finally {
      client.close();
    }
  }

  public static async mkdir(config: FtpConfig, targetPath: string) {
    const client = await this.getClient(config);
    try {
      await client.ensureDir(targetPath);
    } finally {
      client.close();
    }
  }

  public static async rename(config: FtpConfig, oldPath: string, newPath: string) {
    const client = await this.getClient(config);
    try {
      await client.rename(oldPath, newPath);
    } finally {
      client.close();
    }
  }
}
