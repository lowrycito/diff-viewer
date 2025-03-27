import { Octokit } from '@octokit/rest';
import axios from 'axios';

// Create Octokit instance
let octokit: Octokit | null = null;

// Simple cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // TTL in milliseconds
}

interface Cache {
  commits: Record<string, CacheEntry<Commit[]>>;
  diffs: Record<string, CacheEntry<string>>;
}

const cache: Cache = {
  commits: {},
  diffs: {}
};

// Cache TTL in milliseconds
const CACHE_TTL = {
  commits: 5 * 60 * 1000, // 5 minutes
  diffs: 15 * 60 * 1000   // 15 minutes
};

export interface Commit {
  sha: string;
  url: string;
  html_url: string;
  author: {
    name: string;
    email: string;
    date: string;
  } | null;
  committer: {
    name: string;
    email: string;
    date: string;
  } | null;
  message?: string;
  tree?: {
    sha: string;
    url: string;
  };
  parents: {
    sha: string;
    url: string;
    html_url?: string;
  }[];
  commit?: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
  };
}

export interface GitHubRepo {
  owner: string;
  repo: string;
}

// Rate limit error handler
export interface RateLimitError extends Error {
  status?: number;
  isRateLimit: boolean;
  resetTime?: Date;
}

function isRateLimitError(error: any): error is RateLimitError {
  return (
    error &&
    typeof error === 'object' &&
    (error.status === 403 || error.status === 429) &&
    (error.message?.includes('rate limit') || error.message?.includes('API rate limit exceeded'))
  );
}

// Initialize Octokit with a token if available
export function initGitHub(token?: string): Octokit {
  octokit = new Octokit({
    auth: token,
  });
  return octokit;
}

// Get Octokit instance, initializing with no token if not yet initialized
export function getOctokit(): Octokit {
  if (!octokit) {
    octokit = new Octokit();
  }
  return octokit;
}

// Clear caches
export function clearCache(): void {
  cache.commits = {};
  cache.diffs = {};
  console.log('GitHub cache cleared');
}

// Get list of commits for a repository
export async function getCommits(owner: string, repo: string): Promise<Commit[]> {
  const cacheKey = `${owner}/${repo}`;
  
  // Check cache first
  const cachedCommits = cache.commits[cacheKey];
  if (cachedCommits && (Date.now() - cachedCommits.timestamp < cachedCommits.expiry)) {
    console.log(`Using cached commits for ${owner}/${repo} (${cachedCommits.data.length} commits)`);
    return cachedCommits.data;
  }

  const octokit = getOctokit();
  try {
    console.log(`Fetching commits for ${owner}/${repo}`);
    
    // Try with a smaller page size first to be faster for repos with few commits
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 30, // Start with a smaller page that loads faster
    });
    
    console.log(`Received ${data.length} commits`);
    
    // Store in cache
    cache.commits[cacheKey] = {
      data: data as unknown as Commit[],
      timestamp: Date.now(),
      expiry: CACHE_TTL.commits
    };
    
    return data as unknown as Commit[];
  } catch (error: any) {
    console.error('Error fetching commits:', error);

    // Handle rate limit errors
    if (isRateLimitError(error)) {
      // Extract reset time if available
      const resetTime = error.headers?.['x-ratelimit-reset'] 
        ? new Date(parseInt(error.headers['x-ratelimit-reset']) * 1000)
        : new Date(Date.now() + 60 * 60 * 1000); // Default to 1 hour from now
      
      const rateLimitError: RateLimitError = new Error(
        `GitHub API rate limit exceeded. Reset at ${resetTime.toLocaleTimeString()}.`
      );
      rateLimitError.isRateLimit = true;
      rateLimitError.resetTime = resetTime;
      
      throw rateLimitError;
    }
    
    throw error;
  }
}

// Get diff for a specific commit
export async function getCommitDiff(owner: string, repo: string, sha: string): Promise<string> {
  const cacheKey = `${owner}/${repo}/${sha}`;
  
  // Check cache first
  const cachedDiff = cache.diffs[cacheKey];
  if (cachedDiff && (Date.now() - cachedDiff.timestamp < cachedDiff.expiry)) {
    console.log(`Using cached diff for ${owner}/${repo} commit ${sha}`);
    return cachedDiff.data;
  }
  
  try {
    console.log(`Fetching diff for ${owner}/${repo} commit ${sha}`);
    
    // First try the Octokit way
    try {
      const octokit = getOctokit();
      const { data } = await octokit.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });
      
      if (data.files && data.files.length > 0) {
        console.log(`Got diff via Octokit API with ${data.files.length} files`);
        // Format the diff manually
        let diffText = '';
        for (const file of data.files) {
          diffText += `diff --git a/${file.filename} b/${file.filename}\n`;
          diffText += `index ${file.status === 'added' ? '0000000..${file.sha.substring(0, 7)}' : `${(file.previous_filename ? file.previous_filename : file.filename)}..${file.sha.substring(0, 7)}`}\n`;
          diffText += `--- a/${file.previous_filename || file.filename}\n`;
          diffText += `+++ b/${file.filename}\n`;
          if (file.patch) {
            diffText += `${file.patch}\n`;
          }
        }
        
        // Store in cache
        cache.diffs[cacheKey] = {
          data: diffText,
          timestamp: Date.now(),
          expiry: CACHE_TTL.diffs
        };
        
        return diffText;
      }
    } catch (error: any) {
      console.warn('Failed to get diff via Octokit API, falling back to direct URL:', error);
      
      // Handle rate limit errors
      if (isRateLimitError(error)) {
        const resetTime = error.headers?.['x-ratelimit-reset'] 
          ? new Date(parseInt(error.headers['x-ratelimit-reset']) * 1000)
          : new Date(Date.now() + 60 * 60 * 1000);
        
        console.warn(`Rate limit exceeded. Reset at ${resetTime.toLocaleTimeString()}. Trying alternative method.`);
      }
    }
    
    // Fall back to direct URL
    const url = `https://github.com/${owner}/${repo}/commit/${sha}.diff`;
    console.log(`Fetching diff from URL: ${url}`);
    const response = await axios.get(url);
    console.log(`Got diff via direct URL, length: ${response.data.length}`);
    
    // Store in cache
    cache.diffs[cacheKey] = {
      data: response.data,
      timestamp: Date.now(),
      expiry: CACHE_TTL.diffs
    };
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching diff:', error);
    
    // Handle rate limit errors specifically
    if (error.response && (error.response.status === 403 || error.response.status === 429) && 
        (error.response.data?.message?.includes('rate limit') || 
         error.response.headers['x-ratelimit-remaining'] === '0')) {
      
      const resetTime = error.response.headers['x-ratelimit-reset'] 
        ? new Date(parseInt(error.response.headers['x-ratelimit-reset']) * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);
      
      return `Error: GitHub API rate limit exceeded. Try again after ${resetTime.toLocaleTimeString()}.`;
    }
    
    return `Error fetching diff: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Get diff between two commits
export async function getComparisonDiff(owner: string, repo: string, base: string, head: string): Promise<string> {
  const cacheKey = `${owner}/${repo}/${base}...${head}`;
  
  // Check cache first
  const cachedDiff = cache.diffs[cacheKey];
  if (cachedDiff && (Date.now() - cachedDiff.timestamp < cachedDiff.expiry)) {
    console.log(`Using cached comparison diff for ${owner}/${repo} between ${base} and ${head}`);
    return cachedDiff.data;
  }
  
  try {
    console.log(`Fetching comparison diff for ${owner}/${repo} between ${base} and ${head}`);
    const url = `https://github.com/${owner}/${repo}/compare/${base}...${head}.diff`;
    const response = await axios.get(url);
    console.log(`Got comparison diff, length: ${response.data.length}`);
    
    // Store in cache
    cache.diffs[cacheKey] = {
      data: response.data,
      timestamp: Date.now(),
      expiry: CACHE_TTL.diffs
    };
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching comparison diff:', error);
    
    // Handle rate limit errors specifically
    if (error.response && (error.response.status === 403 || error.response.status === 429) && 
        (error.response.data?.message?.includes('rate limit') || 
         error.response.headers['x-ratelimit-remaining'] === '0')) {
      
      const resetTime = error.response.headers['x-ratelimit-reset'] 
        ? new Date(parseInt(error.response.headers['x-ratelimit-reset']) * 1000)
        : new Date(Date.now() + 60 * 60 * 1000);
      
      return `Error: GitHub API rate limit exceeded. Try again after ${resetTime.toLocaleTimeString()}.`;
    }
    
    return `Error fetching comparison diff: ${error instanceof Error ? error.message : String(error)}`;
  }
}