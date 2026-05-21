import { Router, Response } from 'express';
import { dbQuery, dbRun } from '../db';
import { AuthenticatedRequest } from '../types';

export const settingsRouter = Router();

settingsRouter.get('/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await dbQuery('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => { settings[r.key] = r.value; });
    return res.json(settings);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

settingsRouter.put('/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value as string]);
    }
    return res.json({ message: 'Settings saved' });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});
