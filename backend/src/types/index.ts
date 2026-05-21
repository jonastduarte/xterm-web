import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  master_password_hash?: string;
}

export interface Session {
  id?: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  folder_id?: number | null;
  protocol: 'ssh' | 'telnet' | 'ftp';
  auth_type: 'password' | 'key';
  private_key?: string | null;
  use_sftp?: number | boolean;
  user_id?: number;
}

export interface Folder {
  id?: number;
  name: string;
  parent_id?: number | null;
  user_id?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: 'admin' | 'user';
  };
  file?: Express.Multer.File;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: 'admin' | 'user';
      };
    }
  }
}
