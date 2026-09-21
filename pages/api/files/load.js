import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      const projectRoot = path.resolve(process.cwd());
      const fullPath = path.resolve(projectRoot, filePath);

      // Security check - ensure file is within project directory
      if (fullPath !== projectRoot && !fullPath.startsWith(`${projectRoot}${path.sep}`)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      res.status(200).json({ content });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
