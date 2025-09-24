// utils/versionManager.js
// Functions for managing code versions
import { handleDownloadFile } from '../components/DownloadHandler';

export const saveVersion = (code, fileName, language, versions, setVersions) => {
  const version = {
    id: Date.now(),
    code,
    fileName,
    language,
    timestamp: new Date().toISOString()
  };
  const newVersions = [...versions, version];
  setVersions(newVersions);
  localStorage.setItem('codeVersions', JSON.stringify(newVersions));

  // Download the file using the proper MIME types
  handleDownloadFile(code, fileName, language);
};

export const rollbackToVersion = (versionId, versions, setCode, setFileName, setLanguage, socketRef) => {
  const version = versions.find(v => v.id === versionId);
  if (version) {
    setCode(version.code);
    setFileName(version.fileName);
    setLanguage(version.language);
    socketRef.current.emit('code:edit', { code: version.code });
  }
};
