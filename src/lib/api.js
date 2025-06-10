// // src/lib/api.js
// export async function fetchCommentsBatch(postIds = []) {
//   if (postIds.length === 0) return {};
//   const params = new URLSearchParams();
//   // send as comma-list
//   params.set("ids", postIds.join(","));
//   const res = await fetch(`/api/fb_comments_batch?${params.toString()}`);
//   if (!res.ok) throw new Error("Batch comments fetch failed");
//   return await res.json(); // { [post_id]: [comments] }
// }


// File: src/lib/api.js
/**
 * Batch-fetch comments for multiple post_ids in one request.
 *
 * @param {string[]} postIds
 * @returns {Promise<Record<string, Array>>}
 */
export async function fetchCommentsBatch(postIds = []) {
  if (postIds.length === 0) return {};

  const params = new URLSearchParams();
  params.set("ids", postIds.join(","));

  const res = await fetch(`/api/fb_comments_batch?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Batch comments fetch failed: ${res.statusText}`);
  }
  return res.json(); // { [post_id]: [comments...] }
}
