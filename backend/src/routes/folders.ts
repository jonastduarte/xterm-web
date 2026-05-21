import { Router, Response } from 'express';
import { dbQuery, dbRun } from '../db';
import { AuthenticatedRequest } from '../types';

export const foldersRouter = Router();

foldersRouter.get('/folders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await dbQuery('SELECT * FROM folders WHERE user_id = ?', [userId]);
    return res.json(rows);
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

foldersRouter.post('/folders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const parentId = req.body.parent_id || null;
    const result = await dbRun('INSERT INTO folders (name, parent_id, user_id) VALUES (?, ?, ?)', [req.body.name || 'New Folder', parentId, userId]);
    return res.json({ id: result.lastID, name: req.body.name, parent_id: parentId });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

foldersRouter.put('/folders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { parent_id } = req.body;
    if (parseInt(req.params.id) === parent_id) {
      return res.status(400).json({ error: 'Cannot move a folder into itself' });
    }
    await dbRun('UPDATE folders SET parent_id = ? WHERE id = ? AND user_id = ?', [parent_id !== undefined ? parent_id : null, req.params.id, userId]);
    return res.json({ success: true });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});

foldersRouter.delete('/folders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    await dbRun('DELETE FROM folders WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    await dbRun('UPDATE sessions SET folder_id = NULL WHERE folder_id = ? AND user_id = ?', [req.params.id, userId]);
    return res.json({ message: 'Folder deleted' });
  } catch (err: any) { 
    return res.status(500).json({ error: err.message }); 
  }
});
