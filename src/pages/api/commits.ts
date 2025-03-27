import type { APIRoute } from 'astro';
import { getCommits } from '../../utils/github';

export const GET: APIRoute = async ({ request, params, url }) => {
  // Try different ways to get the parameters
  let owner = url.searchParams.get('owner');
  let repo = url.searchParams.get('repo');
  
  // Backup - try from request URL
  if (!owner || !repo) {
    try {
      const requestUrl = new URL(request.url);
      owner = owner || requestUrl.searchParams.get('owner');
      repo = repo || requestUrl.searchParams.get('repo');
    } catch (e) {
      console.error("Error parsing request URL:", e);
    }
  }

  console.log(`API commits request: owner=${owner}, repo=${repo}`);
  console.log(`Request URL: ${request.url}`);

  if (!owner || !repo) {
    console.error('Missing required parameters');
    console.error(`URL params: ${JSON.stringify(Array.from(url.searchParams.entries()))}`);
    console.error(`Request URL: ${request.url}`);
    
    return new Response(JSON.stringify({ 
      error: 'Missing required parameters',
      providedParams: {
        owner,
        repo
      }
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    console.log(`Fetching commits for ${owner}/${repo}`);
    const commits = await getCommits(owner, repo);
    console.log(`Retrieved ${commits.length} commits`);
    
    return new Response(JSON.stringify(commits), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching commits:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch commits',
        details: error instanceof Error ? error.message : String(error)
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}