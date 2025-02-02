import fetch from 'node-fetch';
import base64 from 'base-64';

interface WordPressCredentials {
  apiUrl: string;
  username: string;
  password: string;
}

export async function createWordPressDraft(
  title: string,
  content: string,
  metaDescription: string,
  tags: string[]
) {
  const credentials = {
    apiUrl: process.env.WORDPRESS_API_URL,
    username: process.env.WORDPRESS_USERNAME,
    password: process.env.WORDPRESS_APP_PASSWORD
  };

  if (!credentials.apiUrl || !credentials.username || !credentials.password) {
    throw new Error('WordPress credentials are not configured');
  }

  // Ensure API URL ends with /wp-json/wp/v2
  const baseUrl = credentials.apiUrl.endsWith('/wp-json/wp/v2')
    ? credentials.apiUrl
    : `${credentials.apiUrl}/wp-json/wp/v2`;

  // Create authentication header
  const authHeader = 'Basic ' + base64.encode(`${credentials.username}:${credentials.password}`);

  try {
    // Convert tags to WordPress format
    const tagPromises = tags.map(async (tagName) => {
      // First try to find if tag exists
      const tagSearchResponse = await fetch(
        `${baseUrl}/tags?search=${encodeURIComponent(tagName)}`,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          }
        }
      );

      const existingTags = await tagSearchResponse.json();

      if (existingTags && existingTags.length > 0) {
        return existingTags[0].id;
      }

      // If tag doesn't exist, create it
      const createTagResponse = await fetch(`${baseUrl}/tags`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-')
        })
      });

      const newTag = await createTagResponse.json();
      return newTag.id;
    });

    const tagIds = await Promise.all(tagPromises);

    // Create the post
    const response = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        status: 'draft',
        meta: {
          description: metaDescription
        },
        tags: tagIds,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create WordPress draft');
    }

    const post = await response.json();
    return {
      id: post.id,
      url: post.link,
      status: post.status
    };
  } catch (error) {
    console.error('WordPress API Error:', error);
    throw error;
  }
}