import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const projectRoot = process.cwd();
      const files = [];

      // Function to recursively get files
      const getFiles = (dir) => {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Skip node_modules and other common directories
            if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
              getFiles(fullPath);
            }
          } else {
            // Only include code files
            const ext = path.extname(item).toLowerCase();
            const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.md'];
            if (codeExtensions.includes(ext)) {
              files.push({
                name: item,
                path: path.relative(projectRoot, fullPath),
                size: stat.size,
                modified: stat.mtime
              });
            }
          }
        }
      };

      getFiles(projectRoot);
      res.status(200).json({ files });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
