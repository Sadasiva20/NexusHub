import StoryblokClient from 'storyblok-js-client';

// Load encrypted environment variables
import loadEncryptedEnv from '../../utils/loadEnv';
loadEncryptedEnv();

const Storyblok = new StoryblokClient({
  accessToken: process.env.STORYBLOK_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Get all components or a specific component
      try {
        const { id } = req.query;
        if (id) {
          // Get specific component
          const response = await Storyblok.get(`spaces/${process.env.STORYBLOK_SPACE_ID}/components/${id}`);
          res.status(200).json(response.data);
        } else {
          // Get all components
          const response = await Storyblok.get(`spaces/${process.env.STORYBLOK_SPACE_ID}/components`);
          res.status(200).json(response.data);
        }
      } catch (error) {
        console.error('Error fetching components:', error);
        res.status(500).json({ error: 'Failed to fetch components' });
      }
      break;

    case 'POST':
      // Create a new component
      try {
        const { component } = req.body;
        if (!component) {
          return res.status(400).json({ error: 'Component data is required' });
        }

        const response = await Storyblok.post(`spaces/${process.env.STORYBLOK_SPACE_ID}/components`, {
          component,
        });
        res.status(201).json(response.data);
      } catch (error) {
        console.error('Error creating component:', error);
        res.status(500).json({ error: 'Failed to create component' });
      }
      break;

    case 'PUT':
      // Update an existing component
      try {
        const { id } = req.query;
        const { component } = req.body;

        if (!id || !component) {
          return res.status(400).json({ error: 'Component ID and data are required' });
        }

        const response = await Storyblok.put(`spaces/${process.env.STORYBLOK_SPACE_ID}/components/${id}`, {
          component,
        });
        res.status(200).json(response.data);
      } catch (error) {
        console.error('Error updating component:', error);
        res.status(500).json({ error: 'Failed to update component' });
      }
      break;

    case 'DELETE':
      // Delete a component
      try {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Component ID is required' });
        }

        await Storyblok.delete(`spaces/${process.env.STORYBLOK_SPACE_ID}/components/${id}`);
        res.status(204).end();
      } catch (error) {
        console.error('Error deleting component:', error);
        res.status(500).json({ error: 'Failed to delete component' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
