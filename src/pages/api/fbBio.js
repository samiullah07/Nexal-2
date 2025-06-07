// src/pages/api/fbBio.js

export default async function handler(req, res) {
  // Expect a query string like: /api/fbBio?url=https://www.facebook.com/username
  const { url } = req.query;

  if (!url) {
    return res
      .status(400)
      .json({ error: "Please provide a `url` query parameter (e.g. ?url=https://www.facebook.com/username)" });
  }

  const API_HOST = "facebook-scraper3.p.rapidapi.com";
  const API_KEY = process.env.RAPIDAPI_KEY; // set this in .env.local

  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "RAPIDAPI_KEY is not defined in environment variables." });
  }

  try {
    const endpoint = `https://${API_HOST}/profile/details_url?url=${encodeURIComponent(url)}`;
    const apiResponse = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": API_HOST,
      },
    });

    if (!apiResponse.ok) {
      const text = await apiResponse.text();
      throw new Error(`RapidAPI responded with ${apiResponse.status}: ${text}`);
    }

    const data = await apiResponse.json();
    // The returned JSON typically contains fields like “bio”, “fullName”, etc.
    // If you only want to return the bio, you could do: res.status(200).json({ bio: data.bio })
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching from facebook-scraper3:", err);
    return res.status(500).json({ error: err.message });
  }
}
