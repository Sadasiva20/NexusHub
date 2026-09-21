import { useState } from 'react';

const initialSchema = {
  component: 'teaser',
  display_name: 'Teaser',
  schema: {
    headline: { type: 'text', default: 'Welcome to NexusHub' },
    body: { type: 'textarea', default: 'Build and preview your component schema.' },
  },
};

export default function SchemaEditor() {
  const [value, setValue] = useState(JSON.stringify(initialSchema, null, 2));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validate = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed.component || !parsed.display_name || !parsed.schema || typeof parsed.schema !== 'object') {
        throw new Error('Schema requires component, display_name, and schema fields.');
      }
      for (const [name, field] of Object.entries(parsed.schema)) {
        if (!field || typeof field !== 'object' || !field.type) {
          throw new Error(`Field "${name}" must define a type.`);
        }
        if (field.type === 'option' && !Array.isArray(field.options)) {
          throw new Error(`Field "${name}" of type option must define options.`);
        }
      }
      return parsed;
    } catch (validationError) {
      setError(validationError.message);
      return null;
    }
  };

  const handleChange = (event) => {
    setValue(event.target.value);
    setMessage('');
    if (validate(event.target.value)) setError('');
  };

  const formatSchema = () => {
    const parsed = validate(value);
    if (parsed) {
      setValue(JSON.stringify(parsed, null, 2));
      setError('');
      setMessage('Schema is valid.');
    }
  };

  const downloadSchema = () => {
    const parsed = validate(value);
    if (!parsed) return;
    const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${parsed.component}.storyblok.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Schema downloaded.');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-gray-900">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <div>
          <a href="/" className="text-sm text-blue-600 hover:underline">← Code Editor</a>
          <h1 className="text-3xl font-bold">Storyblok Schema Builder</h1>
          <p className="text-gray-600">Edit, validate, preview, and download a component schema.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={formatSchema} className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
            Format & Validate
          </button>
          <button onClick={downloadSchema} className="rounded bg-purple-600 px-3 py-2 text-white hover:bg-purple-700">
            Download JSON
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow">
          <label htmlFor="schema-input" className="mb-2 block font-semibold">Component JSON</label>
          <textarea
            id="schema-input"
            value={value}
            onChange={handleChange}
            className="h-[32rem] min-h-[30rem] w-full rounded border p-4 font-mono text-sm focus:border-blue-500 focus:outline-none"
            spellCheck="false"
          />
          {error && <pre className="mt-3 whitespace-pre-wrap text-sm text-red-600">{error}</pre>}
          {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
        </section>
        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-xl font-semibold">Live Preview</h2>
          {(() => {
            const parsed = (() => {
              try { return JSON.parse(value); } catch { return null; }
            })();
            if (!parsed?.schema) return <p className="text-red-600">Enter valid JSON to preview.</p>;
            return (
              <article className="rounded border p-4">
                <h3 className="mb-3 text-xl font-bold">{parsed.display_name || parsed.component}</h3>
                {Object.entries(parsed.schema).map(([name, field]) => (
                  <div key={name} className="mb-3">
                    <label className="mb-1 block text-sm font-medium">{name}</label>
                    {field.type === 'textarea' ? (
                      <textarea className="w-full rounded border p-2" defaultValue={field.default || ''} />
                    ) : field.type === 'option' ? (
                      <select className="w-full rounded border p-2" defaultValue={field.default || ''}>
                        {(field.options || []).map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input className="w-full rounded border p-2" defaultValue={field.default || ''} />
                    )}
                  </div>
                ))}
              </article>
            );
          })()}
        </section>
      </div>
    </main>
  );
}
