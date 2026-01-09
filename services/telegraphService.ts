
import { Comment } from '../types';

const BASE_URL = 'https://api.telegra.ph';

// Telegraph Node Type
interface TGNode {
  tag: string;
  attrs?: any;
  children?: (TGNode | string)[];
}

/**
 * Creates a new Telegraph Account to manage the post's comments.
 * We create one account per post (conceptually) or reuse if we stored it, 
 * but for simplicity and anonymity, we generate a fresh token for the post's lifecycle.
 */
export const createTelegraphAccount = async (shortName: string) => {
  try {
    const response = await fetch(`${BASE_URL}/createAccount?short_name=${shortName}&author_name=RaqqaApp`);
    const data = await response.json();
    if (data.ok) {
      return data.result.access_token;
    }
    throw new Error(data.error);
  } catch (error) {
    console.error("Telegraph Account Error:", error);
    return null;
  }
};

/**
 * Creates a new Page on Telegraph to store comments.
 */
export const createCommentsPage = async (accessToken: string, title: string, initialComments: Comment[]) => {
  try {
    const content = serializeComments(initialComments);
    const response = await fetch(`${BASE_URL}/createPage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        title: title,
        content: JSON.stringify(content), // Telegraph expects JSON string of nodes
        return_content: true
      })
    });
    const data = await response.json();
    if (data.ok) {
      return data.result.path;
    }
    throw new Error(data.error);
  } catch (error) {
    console.error("Telegraph Create Page Error:", error);
    return null;
  }
};

/**
 * Fetches the page content and parses it back into Comment objects.
 */
export const fetchCommentsFromPage = async (path: string): Promise<Comment[]> => {
  try {
    // We append a random param to avoid heavy caching if needed, though Telegraph handles it reasonably.
    const response = await fetch(`${BASE_URL}/getPage/${path}?return_content=true`);
    const data = await response.json();
    
    if (data.ok && data.result.content) {
      return deserializeComments(data.result.content);
    }
    return [];
  } catch (error) {
    console.error("Telegraph Fetch Error:", error);
    return [];
  }
};

/**
 * Edits the page to append a new comment.
 * Note: Telegraph doesn't support "append", so we fetch (handled by caller usually to sync) -> append -> update.
 * In this implementation, we assume the caller provides the FULL new list of comments.
 */
export const updateCommentsPage = async (accessToken: string, path: string, title: string, allComments: Comment[]) => {
  try {
    const content = serializeComments(allComments);
    const response = await fetch(`${BASE_URL}/editPage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        path: path,
        title: title,
        content: JSON.stringify(content),
        return_content: false
      })
    });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Telegraph Update Error:", error);
    return false;
  }
};

// --- Helpers ---

/**
 * Converts Comment[] to Telegraph Node Structure.
 * We store the JSON data of the comment inside a code block or paragraph for safe keeping.
 * Structure: <p>{JSON_STRING}</p>
 */
const serializeComments = (comments: Comment[]): TGNode[] => {
  return comments.map(c => ({
    tag: 'p',
    children: [JSON.stringify(c)]
  }));
};

/**
 * Converts Telegraph Node Structure back to Comment[].
 */
const deserializeComments = (nodes: TGNode[]): Comment[] => {
  const comments: Comment[] = [];
  
  nodes.forEach(node => {
    if (node.tag === 'p' && node.children && node.children.length > 0) {
      try {
        const jsonStr = node.children[0] as string;
        const comment = JSON.parse(jsonStr);
        comments.push(comment);
      } catch (e) {
        // Ignore parsing errors (e.g. if someone manually edited the page or empty lines)
      }
    }
  });
  
  return comments;
};
