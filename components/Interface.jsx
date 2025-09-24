'use client';
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001'; // Socket.IO server URL

export default function Interface() {
  const [schema, setSchema] = useState(
    JSON.stringify({
      "component": "teaser",
      "display_name": "Teaser",
      "schema": {
        "headline": {
          "type": "text"
        }
      }
    }, null, 2)
  );
  const [theme, setTheme] = useState('default');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [history, setHistory] = useState([schema]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [versions, setVersions] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [components, setComponents] = useState([
    {
      name: 'teaser',
      display_name: 'Teaser',
      schema: {
        "component": "teaser",
        "display_name": "Teaser",
        "schema": {
          "headline": { "type": "text", "default": "Welcome to our site" },
          "subheadline": { "type": "text", "default": "This is a teaser component" },
          "image": { "type": "image", "default": "/placeholder.jpg" },
          "link": { "type": "text", "default": "Read more" }
        }
      }
    },
    {
      name: 'feature',
      display_name: 'Feature',
      schema: {
        "component": "feature",
        "display_name": "Feature",
        "schema": {
          "title": { "type": "text", "default": "Feature Title" },
          "description": { "type": "textarea", "default": "Feature description" },
          "icon": { "type": "text", "default": "⭐" }
        }
      }
    },
    {
      name: 'grid',
      display_name: 'Grid',
      schema: {
        "component": "grid",
        "display_name": "Grid",
        "schema": {
          "columns": { "type": "option", "options": ["1", "2", "3", "4"], "default": "2" }
        }
      }
    }
  ]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('schema:update', (data) => {
      setSchema(data.schema);
    });
    // Load versions from localStorage
    const savedVersions = localStorage.getItem('schemaVersions');
    if (savedVersions) {
      setVersions(JSON.parse(savedVersions));
    }
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Validate schema
  const validateSchema = (schemaStr) => {
    try {
      const parsed = JSON.parse(schemaStr);
      let errors = [];

      // Check required fields
      if (!parsed.component) {
        errors.push('Missing required field: "component"');
      }
      if (!parsed.display_name) {
        errors.push('Missing required field: "display_name"');
      }
      if (!parsed.schema || typeof parsed.schema !== 'object') {
        errors.push('Missing or invalid "schema" object');
      } else {
        // Validate schema fields
        Object.keys(parsed.schema).forEach(fieldKey => {
          const field = parsed.schema[fieldKey];
          if (!field.type) {
            errors.push(`Field "${fieldKey}" missing required "type"`);
          }
          if (field.type === 'option' && (!field.options || !Array.isArray(field.options))) {
            errors.push(`Field "${fieldKey}" of type "option" must have an "options" array`);
          }
        });
      }

      if (errors.length > 0) {
        setValidationError(errors.join('\n'));
        return false;
      } else {
        setValidationError('');
        return true;
      }
    } catch (error) {
      setValidationError('Invalid JSON: ' + error.message);
      return false;
    }
  };

  // Handle local edits and broadcast
  const handleSchemaChange = (e) => {
    const newSchema = e.target.value;
    if (validateSchema(newSchema)) {
      setSchema(newSchema);
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newSchema);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      socketRef.current.emit('schema:edit', { schema: newSchema });
    }
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSchema(history[newIndex]);
      socketRef.current.emit('schema:edit', { schema: history[newIndex] });
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSchema(history[newIndex]);
      socketRef.current.emit('schema:edit', { schema: history[newIndex] });
    }
  };

  // Save version
  const saveVersion = () => {
    const version = {
      id: Date.now(),
      schema,
      timestamp: new Date().toISOString()
    };
    const newVersions = [...versions, version];
    setVersions(newVersions);
    localStorage.setItem('schemaVersions', JSON.stringify(newVersions));
  };

  // Rollback to version
  const rollbackToVersion = (versionId) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setSchema(version.schema);
      socketRef.current.emit('schema:edit', { schema: version.schema });
    }
  };

  // Select component
  const selectComponent = (component) => {
    setSelectedComponent(component.name);
    const schemaStr = JSON.stringify(component.schema, null, 2);
    setSchema(schemaStr);
    // Reset history for new component
    setHistory([schemaStr]);
    setHistoryIndex(0);
    socketRef.current.emit('schema:edit', { schema: schemaStr });
  };

  // Add new component
  const addNewComponent = () => {
    const newComponent = {
      name: `component_${Date.now()}`,
      display_name: 'New Component',
      schema: {
        "component": "new_component",
        "display_name": "New Component",
        "schema": {
          "title": { "type": "text", "default": "New Component" }
        }
      }
    };
    setComponents([...components, newComponent]);
  };

  // Get AI suggestion
  const getAiSuggestion = async () => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema }),
      });
      const data = await response.json();
      if (response.ok) {
        setAiSuggestion(data.suggestion);
        setShowSuggestion(true);
      } else {
        alert('Failed to get AI suggestion: ' + data.error);
      }
    } catch (error) {
      alert('Error fetching AI suggestion: ' + error.message);
    }
  };

  // Render live preview
  const renderPreview = () => {
    try {
      const parsed = JSON.parse(schema);
      if (parsed.component && parsed.schema) {
        const componentName = parsed.component;
        const fields = parsed.schema;

        // Dynamic rendering based on component type
        if (componentName === 'teaser') {
          return (
            <div className="border rounded p-4 bg-white shadow">
              <h2 className="text-xl font-bold mb-2">{fields.headline ? fields.headline.default || 'Headline' : 'Headline'}</h2>
              {fields.subheadline && <p className="text-gray-600">{fields.subheadline.default || 'Subheadline'}</p>}
              {fields.image && <img src={fields.image.default || '/placeholder.jpg'} alt="Teaser" className="w-full h-32 object-cover mt-2 rounded" />}
              {fields.link && <a href="#" className="text-blue-500 mt-2 inline-block">{fields.link.default || 'Read more'}</a>}
            </div>
          );
        } else if (componentName === 'feature') {
          return (
            <div className="border rounded p-4 bg-white shadow">
              <h3 className="text-lg font-semibold mb-2">{fields.title ? fields.title.default || 'Feature Title' : 'Feature Title'}</h3>
              <p className="text-gray-700">{fields.description ? fields.description.default || 'Feature description' : 'Feature description'}</p>
              {fields.icon && <div className="mt-2 text-2xl">{fields.icon.default || '⭐'}</div>}
            </div>
          );
        } else if (componentName === 'grid') {
          return (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: fields.columns ? fields.columns.default || 2 : 2 }, (_, i) => (
                <div key={i} className="border rounded p-2 bg-white shadow">
                  <p>Grid Item {i + 1}</p>
                </div>
              ))}
            </div>
          );
        } else {
          // Generic rendering for unknown components
          return (
            <div className="border rounded p-4 bg-white shadow">
              <h3 className="text-lg font-semibold mb-2">{parsed.display_name || componentName}</h3>
              {Object.keys(fields).map(key => {
                const field = fields[key];
                if (field.type === 'text') {
                  return (
                    <div key={key} className="mb-2">
                      <label className="block text-sm font-medium">{key}</label>
                      <input type="text" placeholder={field.placeholder || `Enter ${key}`} className="w-full p-2 border rounded" defaultValue={field.default || ''} />
                    </div>
                  );
                } else if (field.type === 'textarea') {
                  return (
                    <div key={key} className="mb-2">
                      <label className="block text-sm font-medium">{key}</label>
                      <textarea placeholder={field.placeholder || `Enter ${key}`} className="w-full p-2 border rounded" defaultValue={field.default || ''} />
                    </div>
                  );
                } else if (field.type === 'image') {
                  return (
                    <div key={key} className="mb-2">
                      <label className="block text-sm font-medium">{key}</label>
                      <img src={field.default || '/placeholder.jpg'} alt={key} className="w-full h-24 object-cover border rounded" />
                    </div>
                  );
                } else if (field.type === 'boolean') {
                  return (
                    <div key={key} className="mb-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked={field.default || false} className="mr-2" />
                        {key}
                      </label>
                    </div>
                  );
                } else if (field.type === 'option') {
                  return (
                    <div key={key} className="mb-2">
                      <label className="block text-sm font-medium">{key}</label>
                      <select className="w-full p-2 border rounded" defaultValue={field.default || ''}>
                        {field.options && field.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return <div key={key}>{key}: {field.type}</div>;
              })}
            </div>
          );
        }
      }
      return <span>Invalid schema structure</span>;
    } catch {
      return <span>Invalid JSON</span>;
    }
  };



  return (
    <>
    <div
      className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900'}`}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 shadow-lg animate-fade-in">
        <div className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          NexusHub
        </div>
        <div className="flex items-center gap-4">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 rounded bg-gray-200 dark:bg-gray-700 hover:scale-110 transition-transform disabled:opacity-50"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 rounded bg-gray-200 dark:bg-gray-700 hover:scale-110 transition-transform disabled:opacity-50"
          >
            ↷ Redo
          </button>
          {/* User avatars with animation */}
          <div className="flex -space-x-2">
            <img
              src="/user1.png"
              className="w-8 h-8 rounded-full border-2 border-white animate-pulse"
              alt="User1"
            />
            <img
              src="/user2.png"
              className="w-8 h-8 rounded-full border-2 border-white animate-pulse"
              alt="User2"
            />
          </div>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
            className="p-2 rounded bg-gray-200 dark:bg-gray-700 hover:scale-110 transition-transform"
          >
            🎨
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 p-4 border-r shadow-inner">
          <div className="font-semibold mb-4 text-lg">Components</div>
          <ul className="space-y-2">
            {components.map(component => (
              <li
                key={component.name}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  selectedComponent === component.name
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-blue-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => selectComponent(component)}
              >
                {component.display_name}
              </li>
            ))}
          </ul>
          <button
            onClick={addNewComponent}
            className="mt-6 w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded hover:scale-105 transition-transform"
          >
            + New Component
          </button>
        </aside>

        {/* Main Editor */}
        <main className="flex-1 flex flex-col p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold">
              Schema Editor
            </div>
            <button
              onClick={getAiSuggestion}
              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors animate-bounce"
            >
              🤖 AI Assist
            </button>
          </div>
          <textarea
            className={`w-full h-64 p-4 rounded border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-mono resize-none shadow-inner focus:ring-2 transition-shadow ${
              validationError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
            }`}
            value={schema}
            onChange={handleSchemaChange}
            placeholder="Edit your Storyblok component schema here..."
          />
          {validationError && (
            <div className="mt-2 text-red-500 text-sm">{validationError}</div>
          )}
          {/* AI suggestions, validation, etc. */}
        </main>

        {/* Preview Panel */}
        <section className="w-96 bg-white dark:bg-gray-900 p-6 border-l flex flex-col shadow-inner">
          <div className="text-lg font-semibold mb-2">Live Preview</div>
          <div className={`flex-1 bg-gray-100 dark:bg-gray-800 rounded p-4 shadow-inner overflow-auto ${validationError ? 'border-2 border-red-500' : ''}`}>
            {validationError ? (
              <div className="text-red-500">
                <h3 className="font-semibold mb-2">Validation Errors:</h3>
                <pre className="whitespace-pre-wrap text-sm">{validationError}</pre>
              </div>
            ) : (
              renderPreview()
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Schema changes update preview in real-time.
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="px-6 py-2 bg-gray-200 dark:bg-gray-800 flex items-center justify-between text-xs shadow">
        <div>
          Session: <span className="font-bold">Active</span>
        </div>
        <div>
          Commit: <span className="font-mono">#a1b2c3</span> |{' '}
          <button className="underline hover:text-blue-500 transition-colors">
            Rollback
          </button>
        </div>
        <div>
          Status: <span className="text-green-600">Connected</span> | Voice:{' '}
          <button className="underline hover:text-blue-500 transition-colors">
            🎤 On
          </button>
        </div>
      </footer>
    </div>

    {showSuggestion && (
      <div className="fixed bottom-4 right-4 max-w-md p-4 bg-white dark:bg-gray-800 border rounded shadow-lg z-50">
        <h3 className="font-semibold mb-2">AI Suggestion</h3>
        <pre className="whitespace-pre-wrap text-sm">{aiSuggestion}</pre>
        <button
          onClick={() => setShowSuggestion(false)}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Close
        </button>
      </div>
    )}
    </>
  );
}
