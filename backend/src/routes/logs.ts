import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { sessionLogsDir } from '../config';
import { AuthenticatedRequest } from '../types';

export const logsRouter = Router();

logsRouter.get('/logs', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const logDir = path.join(sessionLogsDir, String(userId));
  if (!fs.existsSync(logDir)) return res.json([]);
  
  try {
    const files = fs.readdirSync(logDir);
    const logs = files.map(f => {
      const stats = fs.statSync(path.join(logDir, f));
      return { name: f, size: stats.size, mtime: stats.mtimeMs };
    }).sort((a, b) => b.mtime - a.mtime);
    return res.json(logs);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

logsRouter.get('/logs/download/:filename', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(sessionLogsDir, String(userId), safeFilename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Log not found' });
  
  return res.download(filePath);
});

logsRouter.get('/logs/view/:filename', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(sessionLogsDir, String(userId), safeFilename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Log not found' });
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 500;
  
  let lineCount = 0;
  const lines: string[] = [];
  
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  const startLine = (page - 1) * limit;
  const endLine = page * limit;

  try {
    for await (const line of rl) {
      if (lineCount >= startLine && lineCount < endLine) {
        lines.push(line);
      }
      lineCount++;
    }
    
    const totalPages = Math.ceil(lineCount / limit);
    const hasMore = page < totalPages;
    const isTruncated = hasMore;

    return res.json({ 
      content: lines.join('\n'), 
      page, 
      limit, 
      totalLines: lineCount, 
      totalPages,
      hasMore,
      isTruncated
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
