// src/pages/api/fetch_fb_comments.js
import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { post_id, after } = req.query;
    if (!post_id) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: post_id" });
    }

    // 1) Fetch comments from RapidAPI
    const url = new URL("https://facebook-scraper3.p.rapidapi.com/post/comments");
    url.searchParams.append("post_id", post_id);
    if (after) {
      url.searchParams.append("cursor", after);
    }

    const RAPIDAPI_KEY = "JCencKsLCumshFl94505UMz3fVOjp1GA57EjsnaTRyaHjVY8Z7";
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-host": "facebook-scraper3.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      // console.error("Non-OK response from RapidAPI:", text);
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    const comments = Array.isArray(data.results) ? data.results : [];

    // 2) For each comment, try to scrape the author.url → <meta property="og:image">  
    //    and attach it as author.picture. If it fails, author.picture stays null.
    const enriched = await Promise.all(
      comments.map(async (comment) => {
        const author = { ...comment.author, picture: null };

        if (author.url) {
          try {
            const profileRes = await fetch(author.url);
            if (profileRes.ok) {
              const html = await profileRes.text();
              const $ = cheerio.load(html);
              const ogImg = $('meta[property="og:image"]').attr("content");
              if (ogImg) {
                author.picture = ogImg;
              }
            }
          } catch (err) {
            console.warn(
              `Failed to scrape profile page for ${author.name}:`,
              err.message
            );
            // leave author.picture = null
          }
        }

        return {
          ...comment,
          author,
        };
      })
    );

    // 3) Return the same cursor but with each comment’s author.picture attached
    return res.status(200).json({
      results: enriched,
      cursor: data.cursor || null,
    });
  } catch (err) {
    console.error("Error in /api/fetch_fb_comments:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
