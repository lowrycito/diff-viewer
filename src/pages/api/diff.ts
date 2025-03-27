import type { APIRoute } from 'astro';
import { getCommitDiff } from '../../utils/github';

export const GET: APIRoute = async ({ request, params, url }) => {
  // Try different ways to get the parameters
  let owner = url.searchParams.get('owner');
  let repo = url.searchParams.get('repo');
  let sha = url.searchParams.get('sha');
  
  // Backup - try from request URL
  if (!owner || !repo || !sha) {
    try {
      const requestUrl = new URL(request.url);
      owner = owner || requestUrl.searchParams.get('owner');
      repo = repo || requestUrl.searchParams.get('repo');
      sha = sha || requestUrl.searchParams.get('sha');
    } catch (e) {
      console.error("Error parsing request URL:", e);
    }
  }

  console.log(`API diff request: owner=${owner}, repo=${repo}, sha=${sha}`);
  console.log(`Request URL: ${request.url}`);

  if (!owner || !repo || !sha) {
    console.error('Missing required parameters');
    console.error(`URL params: ${JSON.stringify(Array.from(url.searchParams.entries()))}`);
    console.error(`Request URL: ${request.url}`);
    
    return new Response(JSON.stringify({ 
      error: 'Missing required parameters',
      providedParams: {
        owner,
        repo,
        sha
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
    console.log(`Fetching diff for ${owner}/${repo} commit ${sha}`);
    const diff = await getCommitDiff(owner, repo, sha);
    console.log(`Retrieved diff of length: ${diff.length}`);
    
    // Check if the result contains an error message
    if (diff.startsWith('Error fetching diff:')) {
      console.error(diff);
      return new Response(JSON.stringify({ error: diff }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(diff, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error in diff API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch diff',
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