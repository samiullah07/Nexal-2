// src/pages/api/facebookSearch.js
export default async function handler(req, res) {
  const { username } = req.query;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST =
    process.env.RAPIDAPI_HOST || "facebook-scraper3.p.rapidapi.com";

  // 1) Validate inputs
  if (!username) {
    // console.log("[facebookSearch] ❌ Missing `username` in query.");
    return res.status(400).json({ error: "Username is required." });
  }
  if (!RAPIDAPI_KEY) {
    // console.log("[facebookSearch] ❌ Missing `RAPIDAPI_KEY` in env.");
    return res
      .status(500)
      .json({ error: "RapidAPI key not configured in .env.local." });
  }

  // 2) Build URL & log it
  const profileUrl = `https://www.facebook.com/${encodeURIComponent(username)}`;
  const endpoint = `https://${RAPIDAPI_HOST}/profile/details_url?url=${encodeURIComponent(
    profileUrl
  )}`;

  // console.log("[facebookSearch] 🔎 Searching Facebook profile for:", username);
  // console.log("[facebookSearch] 🌐 RapidAPI host:", RAPIDAPI_HOST);
  // console.log("[facebookSearch] 🔗 Endpoint:", endpoint);

  try {
    // 3) Fire the request and log status/headers
    const apiRes = await fetch(endpoint, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    });

    // console.log("[facebookSearch] 📤 RapidAPI responded with status:", apiRes.status);

//     console.log(
//   "[facebookSearch] 🏷️ RapidAPI headers:",
//   JSON.stringify(Object.fromEntries(apiRes.headers.entries()), null, 2)
// );


    // If you want raw header logging, uncomment next line:
    // console.log("[facebookSearch] 🏷️ RapidAPI headers:", JSON.stringify(apiRes.headers.raw()));

    // 4) Parse JSON and log it
    let raw;
    try {
      raw = await apiRes.json();
    } catch (parseErr) {
      // console.error("[facebookSearch] ❌ Failed to parse JSON from RapidAPI:", parseErr);
      return res.status(500).json({ error: "Invalid JSON from RapidAPI." });
    }

    // 5) If status not OK, log error payload and return
    if (!apiRes.ok) {
      console.error("Facebook API returned error payload:", raw);
      return res
        .status(apiRes.status)
        .json({ error: raw.message || "Error fetching Facebook profile." });
    }

    // 6) Unwrap nested `profile` object (if present) and log
    let prof = raw.profile || raw;
    prof = prof.profile || prof;
    // console.log("🔍 Unwrapped `prof` object:", prof);

    // 7) Build your output
    const output = {
      username,                             // echo back the username you searched for
      name: prof.name || null,
      profile_id: prof.profile_id || null,
      url: prof.url || null,
      image: prof.image || null,
      intro: prof.intro || null,
      cover_image: prof.cover_image || null,
      gender: prof.gender || null,
      about: prof.about || {},             // could be an object (empty or with fields)
      about_public: prof.about_public || [], // array of { icon, text }
    };

    // console.log("[facebookSearch] ✅ Success—sending output:", output);
    return res.status(200).json(output);
  } catch (e) {
    // console.error("Facebook API fetch error (network/exception):", e);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
}
