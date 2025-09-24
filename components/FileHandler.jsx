// components/FileHandler.jsx
// Utility for handling file opening via dialog

export const handleOpenFile = (callback) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js,.jsx,.ts,.tsx,.html,.css,.scss,.json,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.md,.txt';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const fileName = file.name;
        const language = getLanguageFromFileName(fileName);
        callback({ content, fileName, language });
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

const getLanguageFromFileName = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'md': 'markdown',
    'txt': 'plaintext'
  };
  return languageMap[ext] || 'plaintext';
};
