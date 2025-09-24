'use client';
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { undo, redo } from '../utils/undoRedo';
import { saveVersion, rollbackToVersion } from '../utils/versionManager';

const SOCKET_URL = 'http://localhost:3001'; // Socket.IO server URL

export default function CodeEditor() {
  const [code, setCode] = useState(`// Welcome to NexusHub Code Editor
// Start editing your code here...

function exampleFunction() {
  console.log("Hello, World!");
  return "This is a sample function";
}

// You can write JavaScript, React components, HTML, CSS, or any other code
const component = () => {
  return (
    <div>
      <h1>Welcome to Code Editor</h1>
      <p>Edit your code and see live preview</p>
    </div>
  );
};

export default component;`);
  const [theme, setTheme] = useState('default');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [history, setHistory] = useState([code]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [versions, setVersions] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [fileName, setFileName] = useState('untitled.js');
  const [showFileLoader, setShowFileLoader] = useState(false);
  const [fileList, setFileList] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('code:update', (data) => {
      setCode(data.code);
    });

    // Load versions from localStorage
    const savedVersions = localStorage.getItem('codeVersions');
    if (savedVersions) {
      setVersions(JSON.parse(savedVersions));
    }

    // Load available files
    loadAvailableFiles();

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Load available files from the project
  const loadAvailableFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      if (response.ok) {
        setFileList(data.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Load code from a specific file
  const loadFile = async (filePath) => {
    try {
      const response = await fetch('/api/files/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });
      const data = await response.json();
      if (response.ok) {
        setCode(data.content);
        setFileName(filePath.split('/').pop());
        setLanguage(getLanguageFromFileName(filePath));
        // Reset history for new file
        setHistory([data.content]);
        setHistoryIndex(0);
        socketRef.current.emit('code:edit', { code: data.content });
        setShowFileLoader(false);
      } else {
        alert('Failed to load file: ' + data.error);
      }
    } catch (error) {
      alert('Error loading file: ' + error.message);
    }
  };

  // Get language from file extension
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
      'md': 'markdown'
    };
    return languageMap[ext] || 'plaintext';
  };

  // Basic code validation
  const validateCode = (codeStr) => {
    try {
      // Basic syntax check for JavaScript/TypeScript
      if (language === 'javascript' || language === 'typescript') {
        new Function(codeStr);
      }
      setValidationError('');
      return true;
    } catch (error) {
      setValidationError('Syntax Error: ' + error.message);
      return false;
    }
  };

  // Handle code changes and broadcast
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    if (validateCode(newCode)) {
      setCode(newCode);
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newCode);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      socketRef.current.emit('code:edit', { code: newCode });
    }
  };



  // Get AI suggestion using OpenAI API
  const getAiSuggestion = async () => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          request: 'suggest_improvements'
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiSuggestion(data.suggestion);
        setShowSuggestion(true);
      } else {
        alert('Failed to get AI suggestion: ' + data.error);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      alert('Error fetching AI suggestion: ' + error.message);
    }
  };

  // Apply AI suggestion
  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      const newCode = code + '\n\n// AI Suggestion Applied:\n' + aiSuggestion;
      setCode(newCode);
      socketRef.current.emit('code:edit', { code: newCode });
      setShowSuggestion(false);
    }
  };



  // Render live preview for web technologies
  const renderPreview = () => {
    if (language === 'html' || language === 'javascript' || language === 'css') {
      try {
        if (language === 'html') {
          return (
            <div className="border rounded p-4 bg-white dark:bg-gray-700 shadow">
              <div className="text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: code }} />
            </div>
          );
        } else if (language === 'javascript') {
          return (
            <div className="border rounded p-4 bg-white dark:bg-gray-700 shadow">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">JavaScript Output</h3>
              <div id="js-preview" className="p-2 bg-gray-100 dark:bg-gray-600 rounded">
                {/* JavaScript execution would go here */}
                <p className="text-gray-900 dark:text-gray-100">JavaScript preview functionality</p>
              </div>
            </div>
          );
        } else if (language === 'css') {
          return (
            <div className="border rounded p-4 bg-white dark:bg-gray-700 shadow">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">CSS Preview</h3>
              <div style={{ padding: '20px', border: '1px solid #ccc' }} className="text-gray-900 dark:text-gray-100">
                <div style={{ ...JSON.parse(code.replace(/(\w+):/g, '"$1":').replace(/;/g, ',')) }}>
                  CSS Preview Element
                </div>
              </div>
            </div>
          );
        }
      } catch (error) {
        return (
          <div className="border rounded p-4 bg-white dark:bg-gray-700 shadow">
            <div className="text-red-500">
              <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">Preview Error:</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">{error.message}</pre>
            </div>
          </div>
        );
      }
    }
    return (
      <div className="border rounded p-4 bg-white dark:bg-gray-700 shadow">
        <div className="text-gray-900 dark:text-gray-100">
          <h3 className="font-semibold mb-2">Code Preview</h3>
          <p>Preview not available for {language} files.</p>
          <p>Language: {language}</p>
          <p>File: {fileName}</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-white to-blue-100 text-gray-900'}`}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 shadow-lg animate-fade-in">
        <div className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          NexusHub Code Editor
        </div>
        <div className="flex items-center gap-4">
          {/* File operations */}
          <button
            onClick={() => setShowFileLoader(!showFileLoader)}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-transform"
          >
            📁 Load File
          </button>
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-transform disabled:opacity-50"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-transform disabled:opacity-50"
          >
            ↷ Redo
          </button>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-transform"
          >
            🎨
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* File Loader Sidebar */}
        {showFileLoader && (
          <aside className="w-64 bg-white dark:bg-gray-800 p-4 border-r shadow-inner">
            <div className="font-semibold mb-4 text-lg">Load File</div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fileList.map((file, index) => (
                <div
                  key={index}
                  className="p-2 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-700"
                  onClick={() => loadFile(file.path)}
                >
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">{file.path}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowFileLoader(false)}
              className="mt-4 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </aside>
        )}

        {/* Main Editor */}
        <main className="flex-1 flex flex-col p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-xl font-semibold">Code Editor</div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="p-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="markdown">Markdown</option>
                <option value="plaintext">Plain Text</option>
              </select>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="p-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="filename.ext"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveVersion(code, fileName, language, versions, setVersions)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                💾 Save Version
              </button>
              <button
                onClick={getAiSuggestion}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors animate-bounce"
              >
                🤖 AI Assist
              </button>
            </div>
          </div>
          <textarea
            className={`w-full h-64 p-4 rounded border font-mono resize-none shadow-inner focus:ring-2 transition-shadow ${
              theme === 'dark' ? 'bg-gray-900 text-gray-100 border-gray-700 focus:ring-gray-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-500'
            } ${validationError ? 'border-red-500 focus:ring-red-500' : ''}`}
            value={code}
            onChange={handleCodeChange}
            placeholder="Start editing your code here..."
          />
          {validationError && (
            <div className="mt-2 text-red-500 text-sm">{validationError}</div>
          )}
        </main>

        {/* Preview Panel */}
        <section className="w-96 bg-white dark:bg-gray-900 p-6 border-l flex flex-col shadow-inner">
          <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Live Preview</div>
          <div className={`flex-1 bg-gray-50 dark:bg-gray-800 rounded p-4 shadow-inner overflow-auto ${validationError ? 'border-2 border-red-500' : ''}`}>
            {validationError ? (
              <div className="text-red-500">
                <h3 className="font-semibold mb-2">Validation Errors:</h3>
                <pre className="whitespace-pre-wrap text-sm">{validationError}</pre>
              </div>
            ) : (
              renderPreview()
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Code changes update preview in real-time.
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="px-6 py-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-between text-xs shadow">
        <div>
          Session: <span className="font-bold">Active</span>
        </div>
        <div>
          File: <span className="font-mono">{fileName}</span> | Language: {language}
        </div>
        <div>
          Status: <span className="text-green-600">Connected</span> | Voice:{' '}
          <button className="underline hover:text-blue-500 transition-colors">
            🎤 On
          </button>
        </div>
      </footer>

      {/* AI Suggestion Modal */}
      {showSuggestion && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-white dark:bg-gray-800 border rounded shadow-lg z-50">
          <h3 className="font-semibold mb-2">AI Code Suggestion</h3>
          <pre className="whitespace-pre-wrap text-sm mb-3">{aiSuggestion}</pre>
          <div className="flex gap-2">
            <button
              onClick={applyAiSuggestion}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Apply
            </button>
            <button
              onClick={() => setShowSuggestion(false)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
