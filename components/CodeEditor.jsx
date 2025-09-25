'use client';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { undo, redo } from '../utils/undoRedo';
import { saveVersion, rollbackToVersion } from '../utils/versionManager';

export default function CodeEditor() {
  const [code, setCode] = useState(`// Welcome to NexusHub Code Editor
// Start editing your code here...

function exampleFunction() {
  console.log("Hello, World!");
  return "This is a sample function";
}

console.log(exampleFunction());`);
  const [theme, setTheme] = useState('default');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [history, setHistory] = useState([code]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [versions, setVersions] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [fileName, setFileName] = useState('untitled.js');
  const [room, setRoom] = useState('default-room'); // Can be derived from fileName or URL
  const [username, setUsername] = useState('Anonymous');
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const userId = useRef(Date.now().toString());
  const channelRef = useRef(null);

  useEffect(() => {
    // Prompt for username if not set
    if (username === 'Anonymous') {
      const name = prompt('Enter your username for collaboration:') || 'Anonymous';
      setUsername(name);
    }

    // Derive room from fileName or set manually
    if (fileName !== 'untitled.js') {
      setRoom(`room-${fileName.replace(/\./g, '-')}`);
    }

    // Set up Supabase channel
    const channel = supabase.channel(`editor:${room}`);

    channel
      .on('broadcast', { event: 'user_join' }, ({ payload }) => {
        setUsers(prev => {
          if (!prev.find(u => u.id === payload.user.id)) {
            return [...prev, payload.user];
          }
          return prev;
        });
      })
      .on('broadcast', { event: 'user_leave' }, ({ payload }) => {
        setUsers(prev => prev.filter(u => u.id !== payload.userId));
        setCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[payload.userId];
          return newCursors;
        });
      })
      .on('broadcast', { event: 'code_update' }, ({ payload }) => {
        if (payload.userId !== userId.current) {
          setCode(payload.code);
          // Update history if needed
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(payload.code);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      })
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        if (payload.userId !== userId.current) {
          setCursors(prev => ({ ...prev, [payload.userId]: payload.position }));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Supabase channel');
          // Send join event
          channel.send({
            type: 'broadcast',
            event: 'user_join',
            payload: { user: { id: userId.current, name: username } }
          });
        }
      });

    channelRef.current = channel;

    // Load versions from localStorage
    const savedVersions = localStorage.getItem('codeVersions');
    if (savedVersions) {
      setVersions(JSON.parse(savedVersions));
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'user_leave',
          payload: { userId: userId.current }
        });
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [room, username, fileName]);

  // Load code from a file selected by user
  const loadFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file input change event
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setCode(content);
      setFileName(file.name);
      setLanguage(getLanguageFromFileName(file.name));
      // Reset history for new file
      setHistory([content]);
      setHistoryIndex(0);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'code_update',
          payload: { code: content, userId: userId.current }
        });
      }
    };
    reader.readAsText(file);
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
    setCode(newCode);
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'code_update',
        payload: { code: newCode, userId: userId.current }
      });
    }
  };

  // Handle cursor and selection changes
  const handleCursorChange = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const pos = textarea.selectionStart;
    const text = textarea.value;

    // Calculate line and column
    let line = 0;
    let col = 0;
    let i = 0;
    while (i < pos) {
      if (text[i] === '\n') {
        line++;
        col = 0;
      } else {
        col++;
      }
      i++;
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: { userId: userId.current, position: { line: line + 1, col: col + 1 } }
      });
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
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'code_update',
          payload: { code: newCode, userId: userId.current }
        });
      }
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
          try {
            let output = '';
            const originalLog = console.log;
            console.log = (...args) => {
              output += args.join(' ') + '\n';
            };
            eval(code);
            console.log = originalLog;
            return (
              <div className="border rounded p-4 bg-white dark:bg-gray-700 shadow">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">JavaScript Output</h3>
                <pre className="p-2 bg-gray-100 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{output || 'No output'}</pre>
              </div>
            );
          } catch (error) {
            return (
              <div className="border rounded p-4 bg-white dark:bg-gray-700 shadow">
                <div className="text-red-500">
                  <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">Execution Error:</h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">{error.message}</pre>
                </div>
              </div>
            );
          }
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
            onClick={loadFile}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-transform"
          >
            📁 Load File
          </button>
          {/* Undo/Redo */}
          <button
            onClick={() => undo(history, historyIndex, setHistoryIndex, setCode, channelRef, userId.current)}
            disabled={historyIndex === 0}
            className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-transform disabled:opacity-50"
          >
            ↶ Undo
          </button>
          <button
            onClick={() => redo(history, historyIndex, setHistoryIndex, setCode, channelRef, userId.current)}
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
            ref={textareaRef}
            className={`w-full h-64 p-4 rounded border font-mono resize-none shadow-inner focus:ring-2 transition-shadow ${
              theme === 'dark' ? 'bg-gray-900 text-gray-100 border-gray-700 focus:ring-gray-500' : 'bg-white text-gray-800 border-gray-300 focus:ring-blue-500'
            } ${validationError ? 'border-red-500 focus:ring-red-500' : ''}`}
            value={code}
            onChange={handleCodeChange}
            onKeyUp={handleCursorChange}
            onSelect={handleCursorChange}
            placeholder="Start editing your code here..."
          />
          {validationError && (
            <div className="mt-2 text-red-500 text-sm">{validationError}</div>
          )}
        </main>

        {/* Preview Panel with Users and Cursors */}
        <section className="w-96 bg-white dark:bg-gray-900 p-6 border-l flex flex-col shadow-inner">
          <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Live Preview & Collaboration</div>
          
          {/* Users List */}
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Collaborators ({users.length + 1})</h4>
            <ul className="space-y-1">
              {users.map(user => (
                <li key={user.id} className="text-sm text-gray-600 dark:text-gray-400">
                  👤 {user.name}
                </li>
              ))}
              <li className="text-sm text-blue-600 dark:text-blue-400">👤 {username} (you)</li>
            </ul>
          </div>

          {/* Cursors Info */}
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Cursor Positions</h4>
            <ul className="space-y-1 text-sm">
              {Object.entries(cursors).map(([uid, pos]) => {
                const user = users.find(u => u.id === uid) || { name: 'Unknown' };
                return (
                  <li key={uid} className="text-gray-600 dark:text-gray-400">
                    {user.name}: Line {pos.line}, Col {pos.col}
                  </li>
                );
              })}
            </ul>
          </div>

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
            Code changes update in real-time across collaborators. Room: {room}
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
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border rounded shadow-lg z-50">
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
