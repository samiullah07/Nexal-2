// src/pages/api/fb_riskscore.js 
import fetch from "node-fetch";

const profileCache = new Map();

async function fetchWithRetries(url, options = {}, maxAttempts = 3) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        return res;
      }
      if (res.status === 429 && attempt < maxAttempts) {
        // exponential back‐off: 200ms, 400ms, 600ms…
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
      } else {
        throw err;
      }
    }
  }
  // fallback
  return fetch(url, options);
}

async function fetchProfileDetailsCached(username) {
  if (profileCache.has(username)) {
    return profileCache.get(username);
  }
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/facebookSearch`);
  url.searchParams.set("username", username);

  try {
    const res = await fetchWithRetries(url.toString());
    if (!res.ok) {
    //   console.warn(`[facebookSearch] ${res.status} for ${username}`);
      profileCache.set(username, {});
      return {};
    }
    const json = await res.json();
    profileCache.set(username, json);
    return json;
  } catch (err) {
    // console.error("[facebookSearch] Error:", err);
    profileCache.set(username, {});
    return {};
  }
}

// ---------------------
// Data Simplification & Aggregation
// ---------------------
function simplifyData(items, type) {
  return items.map((item) => {
    const username =
      item.username && item.username.trim() !== ""
        ? item.username
        : item.fullName && item.fullName.trim() !== ""
        ? item.fullName
        : `unknown_${item.id}`;

    if (type === "post") {
      return {
        id: item.post_id || item.id,
        caption: typeof item.message === "string" ? item.message.slice(0, 500) : "",
        likeCount: item.reactions_count || item.like_count || 0,
        username,
        tags:
          item.tags?.map((tag) => {
            const tagUsername =
              tag.username && tag.username.trim() !== ""
                ? tag.username
                : tag.fullName && tag.fullName.trim() !== ""
                ? tag.fullName
                : `unknown_${tag.id || "tag"}`;
            return {
              username: tagUsername,
              fullName: tag.fullName || "",
              profileImage: tag.profileImage || "",
              gender: tag.gender || "",
            };
          }) || [],
        taggedUsers:
          item.tagged_users?.length > 0
            ? item.tagged_users.map((tagged) => ({
                username: tagged.user.username || "",
                fullName: tagged.user.full_name || "",
                profileImage: tagged.user.profile_pic_url || "",
              }))
            : [],
        imageUrl:
          item.imageUrl ||
          item.full_picture ||
          (item.album_preview && item.album_preview[0]?.image_file_uri) ||
          (item.image_versions && item.image_versions.items?.[0]?.url) ||
          null,
        labels: item.labels || [],
        scores: item.scores || {},
      };
    } else if (type === "comment") {
      return {
        id: item.comment_id || item.id,
        text: typeof item.message === "string" ? item.message.slice(0, 500) : "",
        username,
        likeCount: item.like_count || 0,
        author: item.author || {},
      };
    }
    return item;
  });
}

function aggregateEngagement(posts, comments) {
  const engagement = {};

  posts.forEach((post) => {
    const user = post.username;
    if (user) {
      engagement[user] = engagement[user] || { likes: 0, comments: 0 };
      engagement[user].likes += post.likeCount;
    }
    post.tags.forEach((tag) => {
      const tagUser = tag.username;
      if (tagUser) {
        engagement[tagUser] = engagement[tagUser] || { likes: 0, comments: 0 };
        engagement[tagUser].likes += Math.floor(post.likeCount / 2);
      }
    });
  });

  comments.forEach((comment) => {
    const user = comment.username;
    if (user) {
      engagement[user] = engagement[user] || { likes: 0, comments: 0 };
      engagement[user].comments += 1;
      engagement[user].likes += comment.likeCount;
    }
  });

  return engagement;
}

function chunkArray(arr, chunkSize = 20) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

function isValidRiskScore(score) {
  const num = Number(score);
  return !isNaN(num) && num >= 0 && num <= 100;
}

function extractValidJSON(text) {
  const startIndex = text.indexOf("{");
  if (startIndex === -1) return null;
  let openBraces = 0;
  let endIndex = startIndex;
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === "{") openBraces++;
    if (text[i] === "}") openBraces--;
    if (openBraces === 0) {
      endIndex = i;
      break;
    }
  }
  return text.substring(startIndex, endIndex + 1);
}

// ---------------------
// OpenAI & Sightengine Helpers
// ---------------------
async function callOpenAIModeration(text) {
  if (!process.env.OPENAI_API_KEY) {
    return { flagged: false, categories: {}, category_scores: {} };
  }
  try {
    const resp = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });
    const json = await resp.json();
    const result = Array.isArray(json.results) ? json.results[0] : null;
    if (!result) {
      return { flagged: false, categories: {}, category_scores: {} };
    }
    return {
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
    };
  } catch (err) {
    console.error("OpenAI moderation failed:", err);
    return { flagged: false, categories: {}, category_scores: {} };
  }
}

async function analyzeImageWithSightengine(imageUrl, postId) {
  const { SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET } = process.env;
  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    return { labels: ["no_analysis"], scores: {} };
  }
  const params = {
    api_user: SIGHTENGINE_API_USER,
    api_secret: SIGHTENGINE_API_SECRET,
    models: "nudity,wad,offensive",
    url: imageUrl,
  };
  const query = new URLSearchParams(params).toString();
  const sightUrl = `https://api.sightengine.com/1.0/check.json?${query}`;

  try {
    const resp = await fetchWithRetries(sightUrl);
    if (!resp.ok) {
    //   console.error(`Sightengine returned ${resp.status} for post ${postId}`);
      return { labels: ["analysis_error"], scores: {} };
    }
    const result = await resp.json();
    const scores = {
      nudity_raw: result.nudity?.raw ?? 0,
      nudity_partial: result.nudity?.partial ?? 0,
      nudity_safe: result.nudity?.safe ?? 0,
      weapon: result.weapon ?? 0,
      alcohol: result.alcohol ?? 0,
      drugs: result.drugs ?? 0,
      offensive_prob: result.offensive?.prob ?? 0,
    };
    const THRESHOLD = 0.99;
    const labels = [];
    if (scores.nudity_raw >= THRESHOLD) labels.push("nudity-explicit");
    if (scores.weapon >= THRESHOLD) labels.push("weapon");
    if (scores.alcohol >= THRESHOLD) labels.push("alcohol");
    if (scores.drugs >= THRESHOLD) labels.push("drugs");
    if (scores.offensive_prob >= THRESHOLD) labels.push("offensive");
    if (labels.length === 0) labels.push("safe");
    return { labels, scores };
  } catch (err) {
    // console.error(`Sightengine request for post ${postId} failed:`, err);
    return { labels: ["analysis_error"], scores: {} };
  }
}

async function getRiskForChunk(chunk, aggregatedData, profileDetails) {
  const jsonData = JSON.stringify({
    data: chunk,
    engagementMetrics: aggregatedData,
    profileDetails,
  });
  const prompt = 
`You are a seasoned intelligence analyst evaluating the risk level of a social media profile.
Based on the JSON data below, calculate a risk score between 0 (minimal risk) and 100 (very high risk).
Instructions:
1. If the profile is normal with little or no concerning activity, assign a risk score ≤ 30.
2. If the data indicates significant signs of concerning activity, assign > 60.
Return only the risk score as a single number (no extra text).

Data: ${jsonData}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-2024-08-06",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0.2,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI API error (risk chunk): ${responseText}`);
  }
  const dataResp = JSON.parse(responseText);
  const score = dataResp.choices[0].message.content.trim();
  if (!isValidRiskScore(score)) {
    // console.warn("Invalid risk score received:", score);
  }
  return score;
}

async function getFinalRiskScore(partialScores) {
  const combinedScores = partialScores.join("\n");
  const prompt = 
`You are a seasoned intelligence analyst. Given these partial risk scores, consolidate into one final risk score between 0 and 100. Return only the number.

Partial Risk Scores:
${combinedScores}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-2024-08-06",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0.2,
    }),
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI Aggregation API error (risk): ${responseText}`);
  }
  const dataResp = JSON.parse(responseText);
  const finalScore = dataResp.choices[0].message.content.trim();
  if (!isValidRiskScore(finalScore)) {
    // console.warn("Invalid final risk score received:", finalScore);
  }
  return finalScore;
}

async function getInterestsForChunk(chunk, aggregatedData, profileDetails) {
  const jsonData = JSON.stringify({
    data: chunk,
    engagementMetrics: aggregatedData,
    profileDetails,
  });
  const prompt =
`You are a social media analyst identifying core interests of a user from activity data. For each interest, assign a weight 1–10 indicating prominence. Return a JSON array of {"interest": "<string>", "weight": <number>}. No extra text.

Data: ${jsonData}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-2024-08-06",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.2,
    }),
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI API error (interests chunk): ${responseText}`);
  }
  const dataResp = JSON.parse(responseText);
  try {
    let content = dataResp.choices[0].message.content.trim();
    content = content.replace(/^```(?:json\s*)?/, "").replace(/```$/, "").trim();
    return JSON.parse(content);
  } catch (error) {
    console.warn("Error parsing interests:", error);
    return [];
  }
}

async function getRelationshipsForChunk(chunk, aggregatedData, profileDetails) {
  const jsonData = JSON.stringify({
    data: chunk,
    engagementMetrics: aggregatedData,
    profileDetails,
    note:
      "For any user with username 'unknown_', data is incomplete. Use fullName or gender if available.",
  });

//   const prompt =
// `Analyze the target user's social media connections and classify each connected username as one of: "Family", "Friend", "Associate", "Girlfriend/Wife", "Boyfriend/Husband". Use heuristics:
// - Same last name in likes/comments → "Family"
// - > 2 likes/comments with slang phrases → "Friend"
// - Business‐like comments → "Associate"
// - Multiple tags/likes from opposite‐gender → romantic partner.

// Return only a valid JSON object: { "<username>": "<relationshipType>", … }. If none, return {}. No extra text.

// Data: ${jsonData}`;


  const prompt = 
`Analyze the target user's social media connections and classify relationships as Friend, Associate, Relative, or Girlfriend/Boyfriend based on:

Same Last Name from likes or comments : → Relative

More than 2 Likes/Comments from same profile and slang like comments like bro you livin I see my man let’s go etc… : → Friend/Associate (if there are business like comments like looking forward to release or great work on the post likely to be associate)

Multiple Tags with Opposite Gender same profile:
  If male target: Female with 1 or more tags → Girlfriend/Wife
  If female target: Male with 1 or more tags → Boyfriend/Husband

If male profile had 3 likes from female same profile classify her as girlfriend
If female profile has 5 or more likes from male profile classify them as boyfriend

IMPORTANT:
• Output only a valid JSON object without any markdown formatting or extra text.
• Map each username to one of these exact strings: "Family", "Associate", "Friend", "Girlfriend/Wife", or "Boyfriend/Husband".
• If no relationships can be determined, output {}.

Data: ${jsonData}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-2024-08-06",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.2,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI API error (relationships chunk): ${responseText}`);
  }

  const dataResp = JSON.parse(responseText);
  let content = dataResp.choices[0].message.content.trim();
  content = content.replace(/^```(?:json)?\n?/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn("Error parsing relationships:", error);
    const extracted = extractValidJSON(content);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch (err) {
        console.warn("Fallback JSON parsing failed:", err);
      }
    }
    return {};
  }
}

// ---------------------
// Data Fetching (Posts / Comments)
// ---------------------
async function fetchUserData(username) {
  let allPosts = [];
  let allComments = [];
  let nextCursor = null;
  const MAX_POSTS = 40;

  while (allPosts.length < MAX_POSTS) {
    const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/fb_posts`);
    url.searchParams.set("username", username);
    if (nextCursor) url.searchParams.set("cursor", nextCursor);

    const postsRes = await fetchWithRetries(url.toString());
    if (!postsRes.ok) {
      console.warn("Failed to fetch fb_posts:", await postsRes.text());
      break;
    }
    const postsJson = await postsRes.json();
    const rawPosts = Array.isArray(postsJson.results) ? postsJson.results : [];
    if (rawPosts.length === 0) break;

    const simplifiedPosts = simplifyData(rawPosts, "post");
    for (let p of simplifiedPosts) {
      if (allPosts.length >= MAX_POSTS) break;
      allPosts.push(p);
    }
    nextCursor = postsJson.cursor || null;
    if (!nextCursor) break;
  }

  // Fetch comments for each post in parallel
  const commentFetches = allPosts.map(async (post) => {
    if (!post.id) return [];
    const cUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/fetch_fb_comments`);
    cUrl.searchParams.set("post_id", post.id);

    const cRes = await fetchWithRetries(cUrl.toString());
    if (!cRes.ok) {
      console.warn(`Failed to fetch fb comments for post ${post.id}`);
      return [];
    }
    const cJson = await cRes.json();
    const rawComments = Array.isArray(cJson.results) ? cJson.results : [];
    return simplifyData(rawComments, "comment");
  });

  const commentsArrays = await Promise.all(commentFetches);
  commentsArrays.forEach((arr) => allComments.push(...arr));

  return { posts: allPosts, comments: allComments };
}

// ---------------------
// Main Handler
// ---------------------
export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // 1) Fetch ~40 posts & their comments
    const { posts, comments } = await fetchUserData(username);

    // 2) Fetch main profile details (cached)
    const profileDetails = await fetchProfileDetailsCached(username);

    // 3) Build engagement metrics
    const engagementMetrics = aggregateEngagement(posts, comments);

    // 4) Combine posts + comments for chunking
    const combinedData = [...posts, ...comments];

    // 5) Break into larger chunks (20 items per chunk)
    const chunks = chunkArray(combinedData, 20);

    // 6) GPT partial risk scores (fewer chunks → fewer calls)
    const riskPromises = chunks.map((chunk) =>
      getRiskForChunk(chunk, engagementMetrics, profileDetails)
    );
    const partialRiskScores = await Promise.all(riskPromises);

    // 7) Final risk score
    const finalRiskScore = await getFinalRiskScore(partialRiskScores);

    // 8) GPT “interests”
    const interestsPromises = chunks.map((chunk) =>
      getInterestsForChunk(chunk, engagementMetrics, profileDetails)
    );
    const partialInterestsArrays = await Promise.all(interestsPromises);

    const weightedInterests = partialInterestsArrays.flat();
    const aggregatedWeights = {};
    weightedInterests.forEach((item) => {
      const key = item.interest.trim().toLowerCase();
      const weight = Number(item.weight) || 1;
      aggregatedWeights[key] = (aggregatedWeights[key] || 0) + weight;
    });
    const totalWeight = Object.values(aggregatedWeights).reduce((sum, w) => sum + w, 0);
    const interestPercentages = Object.keys(aggregatedWeights).map((interest) => ({
      interest,
      percentage: ((aggregatedWeights[interest] / totalWeight) * 100).toFixed(2),
    }));
    interestPercentages.sort((a, b) => b.percentage - a.percentage);
    const topFiveInterestsWithPercentage = interestPercentages.slice(0, 5);

    // 9) GPT “relationships”
    const taggedLookup = {};
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        if (tag.username && tag.profileImage) {
          taggedLookup[tag.username.trim()] = tag.profileImage;
        }
      });
      post.taggedUsers.forEach((tg) => {
        if (tg.username && tg.profileImage) {
          taggedLookup[tg.username.trim()] = tg.profileImage;
        }
      });
    });

    const relationshipPromises = chunks.map((chunk) =>
      getRelationshipsForChunk(chunk, engagementMetrics, profileDetails)
    );
    const partialRelationships = await Promise.all(relationshipPromises);

    // Aggregate relationship “votes”
    const relationshipCounts = {};
    partialRelationships.forEach((chunkResp) => {
      Object.entries(chunkResp).forEach(([user, rel]) => {
        if (!relationshipCounts[user]) {
          relationshipCounts[user] = {
            Family: 0,
            "Girlfriend/Wife": 0,
            "Boyfriend/Husband": 0,
            Associate: 0,
            Friend: 0,
          };
        }
        const weight =
          ((engagementMetrics[user]?.likes || 0) + (engagementMetrics[user]?.comments || 0)) || 1;
        if (rel in relationshipCounts[user]) {
          relationshipCounts[user][rel] += weight;
        }
      });
    });

    // Build finalRelationships { username → { relationship, profileImage } }
    const defaultImage = "/no-profile-pic-img.png";
    const finalRelationships = {};
    Object.entries(relationshipCounts).forEach(([user, counts]) => {
      if (user.startsWith("unknown_")) return;

      let relationshipType = "";
      if (counts.Family > 0) {
        relationshipType = "Family";
      } else if (counts["Girlfriend/Wife"] > 0 || counts["Boyfriend/Husband"] > 0) {
        relationshipType =
          counts["Girlfriend/Wife"] >= counts["Boyfriend/Husband"]
            ? "Girlfriend/Wife"
            : "Boyfriend/Husband";
      } else if (counts.Associate > counts.Friend) {
        relationshipType = "Associate";
      } else {
        relationshipType = "Friend";
      }

      let profileImage =
        taggedLookup[user] ||
        posts.reduce((acc, post) => {
          let found = post.tags.find((t) => t.username === user);
          if (!found && post.taggedUsers) {
            found = post.taggedUsers.find((t) => t.username === user);
          }
          return found && found.profileImage ? found.profileImage : acc;
        }, "") ||
        defaultImage;

      finalRelationships[user] = {
        username: user,
        relationship: relationshipType,
        profileImage,
      };
    });

    // Override with “official” image from cached profile details
    const relationshipUsernames = Object.keys(finalRelationships);
    const profileDetailsArr = await Promise.all(
      relationshipUsernames.map((un) => fetchProfileDetailsCached(un))
    );
    relationshipUsernames.forEach((un, idx) => {
      const details = profileDetailsArr[idx] || {};
      if (details.image) {
        finalRelationships[un].profileImage = details.image;
      }
    });
    const relationshipsOutput =
      Object.keys(finalRelationships).length > 0
        ? finalRelationships
        : "No relationships found";

    // 10) Main user profile image
    const mainUserProfileImage = profileDetails.image || defaultImage;

    // 11) If finalRiskScore > 60, run Sightengine on each post’s image (optional)
    let imageAnalysisResults = [];
    if (Number(finalRiskScore) > 60) {
      const imagesToAnalyze = posts.map((p) => p.imageUrl).filter((url) => url);
      imageAnalysisResults = await Promise.all(
        imagesToAnalyze.map((url) => analyzeImageWithSightengine(url))
      );
    }

    // 12) Return JSON (including postCount)
    return res.status(200).json({
      finalAnalysis: finalRiskScore,
      postCount: posts.length,
      topInterests: topFiveInterestsWithPercentage,
      relationships: relationshipsOutput,
      mainUserProfileImage,
      imageAnalysis: imageAnalysisResults,
    });
  } catch (error) {
    console.error("Error in riskScore handler:", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
}
