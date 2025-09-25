import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language, request = 'suggest_improvements' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    let systemPrompt = '';
    let userPrompt = '';

    switch (request) {
      case 'suggest_improvements':
        systemPrompt = `You are an expert code reviewer and developer. Provide suggestions to improve the given ${language} code. Focus on best practices, performance, readability, and potential bugs.`;
        userPrompt = `Suggest improvements for this ${language} code:\n\n${code}`;
        break;

      case 'explain_code':
        systemPrompt = `You are an expert developer and technical educator. Explain the given ${language} code in detail, including what it does, how it works, and any important concepts.`;
        userPrompt = `Explain this ${language} code:\n\n${code}`;
        break;

      case 'add_comments':
        systemPrompt = `You are an expert developer. Add helpful comments to the given ${language} code to make it more readable and maintainable.`;
        userPrompt = `Add comments to this ${language} code:\n\n${code}`;
        break;

      case 'optimize_performance':
        systemPrompt = `You are an expert in performance optimization. Suggest performance improvements for the given ${language} code.`;
        userPrompt = `Suggest performance optimizations for this ${language} code:\n\n${code}`;
        break;

      case 'fix_bugs':
        systemPrompt = `You are an expert debugger. Identify and suggest fixes for any bugs or issues in the given ${language} code.`;
        userPrompt = `Find and suggest fixes for bugs in this ${language} code:\n\n${code}`;
        break;

      default:
        systemPrompt = `You are an expert developer. Provide helpful suggestions for the given ${language} code.`;
        userPrompt = `Provide suggestions for this ${language} code:\n\n${code}`;
    }

    // Use Google Gemini SDK
    const model = google('gemini-2.5-pro');
    const result = await generateText({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 1000,
      temperature: 0.7,
    });

    const suggestion = result.text || 'No response from Google Gemini';

    return res.status(200).json({ suggestion });
  } catch (error) {
    console.error('Google Gemini API error:', error);

    // Handle specific API errors
    if (error.message && error.message.includes('api')) {
      return res.status(401).json({ error: 'Invalid Google Gemini API configuration' });
    }

    return res.status(500).json({ error: 'Failed to get AI suggestion' });
  }
}
