// components/DownloadHandler.jsx
// Utility for handling file downloads

export const handleDownloadFile = (code, fileName, language) => {
  const mimeTypes = {
    'javascript': 'text/javascript',
    'typescript': 'text/typescript',
    'html': 'text/html',
    'css': 'text/css',
    'scss': 'text/scss',
    'json': 'application/json',
    'python': 'text/x-python',
    'java': 'text/x-java-source',
    'cpp': 'text/x-c++src',
    'c': 'text/x-csrc',
    'php': 'application/x-php',
    'ruby': 'text/x-ruby',
    'go': 'text/x-go',
    'rust': 'text/x-rust',
    'markdown': 'text/markdown',
    'plaintext': 'text/plain'
  };
  const mimeType = mimeTypes[language] || 'text/plain';
  const blob = new Blob([code], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
