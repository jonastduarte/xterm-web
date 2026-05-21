import { Client, SFTPWrapper } from 'ssh2';
import { Writable } from 'stream';

export interface SftpConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  auth_type?: 'password' | 'key';
  private_key?: string | null;
}

export class SftpService {
  private static connectSsh(config: SftpConfig): Promise<Client> {
    return new Promise((resolve, reject) => {
      const ssh = new Client();
      ssh.on('ready', () => resolve(ssh))
         .on('error', (err) => reject(err))
         .connect({
           host: config.host,
           port: Number(config.port) || 22,
           username: config.username,
           password: config.auth_type === 'password' ? config.password : undefined,
           privateKey: config.auth_type === 'key' ? (config.private_key || undefined) : undefined,
           passphrase: config.auth_type === 'key' ? config.password : undefined
         });
    });
  }

  private static getSftp(ssh: Client): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
      ssh.sftp((err, sftp) => {
        if (err) reject(err); else resolve(sftp);
      });
    });
  }

  public static async upload(config: SftpConfig, localPath: string, remotePath: string): Promise<void> {
    const ssh = await this.connectSsh(config);
    try {
      const sftp = await this.getSftp(ssh);
      await new Promise<void>((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) reject(err); else resolve();
        });
      });
    } finally {
      ssh.end();
    }
  }

  public static async download(config: SftpConfig, remotePath: string, destinationStream: Writable): Promise<void> {
    const ssh = await this.connectSsh(config);
    return new Promise<void>(async (resolve, reject) => {
      try {
        const sftp = await this.getSftp(ssh);
        const readStream = sftp.createReadStream(remotePath);
        
        readStream.on('error', (err: any) => {
          ssh.end();
          reject(err);
        });

        readStream.pipe(destinationStream).on('finish', () => {
          ssh.end();
          resolve();
        }).on('error', (err: any) => {
          ssh.end();
          reject(err);
        });
      } catch (err: any) {
        ssh.end();
        reject(err);
      }
    });
  }
}
