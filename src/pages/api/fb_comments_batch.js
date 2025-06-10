// // src/pages/api/fb_comments_batch.js
// import fetch from "node-fetch";

// // helper from your existing code (you can also import it)
// async function fetchCommentsForPost(post_id, max = 20) { 
//   let all = [], cursor = null;
//   do {
//     const url = new URL("https://facebook-scraper3.p.rapidapi.com/post/comments");
//     url.searchParams.set("post_id", post_id);
//     if (cursor) url.searchParams.set("cursor", cursor);
//     const res = await fetch(url.toString(), {
//       method: "GET",
//       headers: {
//         "x-rapidapi-host": "facebook-scraper3.p.rapidapi.com",
//         "x-rapidapi-key": process.env.RAPIDAPI_KEY,
//       },
//     });
//     const { results, cursor: next } = await res.json();
//     all.push(...results);
//     cursor = next;
//   } while (cursor && all.length < max);
//   return all.slice(0, max);
// }

// export default async function handler(req, res) {
//   const { ids } = req.method === "GET" ? req.query : req.body;
//   if (!ids) {
//     return res.status(400).json({ error: "Must supply `ids` (array of post_id)" });
//   }
//   // ids can come as comma-list or JSON array
//   const postIds = Array.isArray(ids) ? ids : ids.split(",");
//   const out = {};
//   await Promise.all(
//     postIds.map(async (pid) => {
//       try {
//         out[pid] = await fetchCommentsForPost(pid, 20);
//       } catch (e) {
//         out[pid] = [];
//       }
//     })
//   );
//   res.status(200).json(out);
// }


// // src/pages/api/fb_comments_batch.js

// import fetch from "node-fetch";

// // Fetch up to `maxComments` comments for a single post (handles pagination under the hood)
// async function fetchCommentsForPost(post_id, maxComments = 20) {
//   const RAPIDAPI_HOST = "facebook-scraper3.p.rapidapi.com";
//   const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
//   let all = [];
//   let cursor = null;

//   do {
//     const url = new URL(`https://${RAPIDAPI_HOST}/post/comments`);
//     url.searchParams.set("post_id", post_id);
//     if (cursor) url.searchParams.set("cursor", cursor);

//     const res = await fetch(url.toString(), {
//       method: "GET",
//       headers: {
//         "x-rapidapi-host": RAPIDAPI_HOST,
//         "x-rapidapi-key": RAPIDAPI_KEY,
//       },
//     });
//     if (!res.ok) {
//       console.warn(`Failed to fetch comments for ${post_id}: ${res.status}`);
//       break;
//     }

//     const { results = [], cursor: nextCursor } = await res.json();
//     all.push(...results);
//     cursor = nextCursor;
//   } while (cursor && all.length < maxComments);

//   return all.slice(0, maxComments);
// }

// export default async function handler(req, res) {
//   try {
//     // accept GET or POST
//     const idsParam =
//       req.method === "GET" ? req.query.ids : req.body.ids;
//     if (!idsParam) {
//       return res
//         .status(400)
//         .json({ error: "Missing required `ids` parameter" });
//     }

//     // parse comma-separated or JSON array
//     const postIds = Array.isArray(idsParam)
//       ? idsParam
//       : idsParam.split(",").map((i) => i.trim());

//     const out = {};
//     await Promise.all(
//       postIds.map(async (pid) => {
//         out[pid] = await fetchCommentsForPost(pid, 20);
//       })
//     );

//     res.status(200).json(out);
//   } catch (err) {
//     console.error("Error in fb_comments_batch:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// src/pages/api/fb_comments_batch.js

import fetch from "node-fetch";

// Fetch up to `maxComments` comments for a single post (handles pagination under the hood)
async function fetchCommentsForPost(post_id, maxComments = 20) {
  const RAPIDAPI_HOST = "facebook-scraper3.p.rapidapi.com";
  const RAPIDAPI_KEY = "86eaa87b18msh873ad9145a1ae09p109462jsn70dd00bae5e8";
  let all = [];
  let cursor = null;

  do {
    const url = new URL(`https://${RAPIDAPI_HOST}/post/comments`);
    url.searchParams.set("post_id", post_id);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });
    if (!res.ok) {
      console.warn(`Failed to fetch comments for ${post_id}: ${res.status}`);
      break;
    }

    const { results = [], cursor: nextCursor } = await res.json();
    all.push(...results);
    cursor = nextCursor;
  } while (cursor && all.length < maxComments);

  return all.slice(0, maxComments);
}

export default async function handler(req, res) {
  try {
    // accept GET or POST
    const idsParam =
      req.method === "GET" ? req.query.ids : req.body.ids;
    if (!idsParam) {
      return res
        .status(400)
        .json({ error: "Missing required `ids` parameter" });
    }

    // parse comma-separated or JSON array
    const postIds = Array.isArray(idsParam)
      ? idsParam
      : idsParam.split(",").map((i) => i.trim());

    const out = {};
    await Promise.all(
      postIds.map(async (pid) => {
        out[pid] = await fetchCommentsForPost(pid, 20);
      })
    );

    res.status(200).json(out);
  } catch (err) {
    console.error("Error in fb_comments_batch:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

