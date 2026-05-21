import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { uploadDir } from '../config';
import { decrypt } from '../crypto';
import { FtpService } from '../services/ftpService';
import { SftpService } from '../services/sftpService';
import { AuthenticatedRequest } from '../types';

export const filesRouter = Router();
const upload = multer({ dest: uploadDir });

// ===== SFTP File Upload =====
filesRouter.post('/sftp/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const { host, port, username, password, targetPath, auth_type, private_key, masterPassword } = req.body;
  
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  let finalPass = password;
  if (password && masterPassword && password !== '***') {
    const dec = decrypt(password, masterPassword);
    if (dec) finalPass = dec;
  }

  try {
    const remoteFile = targetPath.endsWith('/') ? `${targetPath}${file.originalname}` : `${targetPath}/${file.originalname}`;
    await SftpService.upload({
      host,
      port: Number(port) || 22,
      username,
      password: auth_type === 'password' ? finalPass : undefined,
      auth_type,
      private_key: auth_type === 'key' ? private_key : undefined
    }, file.path, remoteFile);

    return res.json({ message: 'File uploaded successfully', path: remoteFile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
  }
});

// ===== SFTP File Download =====
filesRouter.get('/sftp/download', async (req: AuthenticatedRequest, res: Response) => {
  const { host, port, username, password, targetPath, auth_type, private_key, masterPassword } = req.query as any;
  if (!targetPath) return res.status(400).json({ error: 'targetPath required' });

  let finalPass = password;
  if (password && masterPassword && password !== '***') {
    const dec = decrypt(password, masterPassword);
    if (dec) finalPass = dec;
  }

  try {
    const fileName = targetPath.split('/').pop() || 'download';
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/octet-stream');

    await SftpService.download({
      host,
      port: Number(port) || 22,
      username,
      password: auth_type === 'password' ? finalPass : undefined,
      auth_type,
      private_key: auth_type === 'key' ? private_key : undefined
    }, targetPath, res);
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
});

// ===== FTP Operations =====

// FTP List Directory
filesRouter.post('/ftp/list', async (req: AuthenticatedRequest, res: Response) => {
  const { host, port, username, password, targetPath } = req.body;
  try {
    const list = await FtpService.list({ host, port, username, password }, targetPath);
    return res.json({ path: targetPath || '/', list });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// FTP Upload
filesRouter.post('/ftp/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const { host, port, username, password, targetPath } = req.body;
  
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const remotePath = targetPath.endsWith('/') ? `${targetPath}${file.originalname}` : `${targetPath}/${file.originalname}`;
    await FtpService.upload({ host, port, username, password }, file.path, remotePath);
    return res.json({ message: 'File uploaded successfully', path: remotePath });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
  }
});

// FTP Download
filesRouter.get('/ftp/download', async (req: AuthenticatedRequest, res: Response) => {
  const { host, port, username, password, targetPath } = req.query as any;
  if (!targetPath) return res.status(400).json({ error: 'targetPath required' });

  try {
    const fileName = targetPath.split('/').pop() || 'download';
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/octet-stream');
    
    await FtpService.download({ host, port, username, password }, targetPath, res);
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
});

// FTP Delete
filesRouter.post('/ftp/delete', async (req: AuthenticatedRequest, res: Response) => {
  const { host, port, username, password, targetPath, isDirectory } = req.body;
  try {
    await FtpService.delete({ host, port, username, password }, targetPath, !!isDirectory);
    return res.json({ message: 'Deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// FTP Mkdir
filesRouter.post('/ftp/mkdir', async (req: AuthenticatedRequest, res: Response) => {
  const { host, port, username, password, targetPath } = req.body;
  try {
    await FtpService.mkdir({ host, port, username, password }, targetPath);
    return res.json({ message: 'Directory created' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// FTP Rename
filesRouter.post('/ftp/rename', async (req: AuthenticatedRequest, res: Response) => {
  const { host, port, username, password, oldPath, newPath } = req.body;
  try {
    await FtpService.rename({ host, port, username, password }, oldPath, newPath);
    return res.json({ message: 'Renamed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
