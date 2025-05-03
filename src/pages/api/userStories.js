// /api/userStories.js
export default async function handler(req, res) {
  const { username } = req.query;
  console.log("joo");

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // First get the user ID (since most story APIs require user ID)
    const userInfoResponse = await fetch(
      `https://social-api4.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "social-api4.p.rapidapi.com",
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error("Error fetching user info:", userInfoResponse.status);
      return res.status(userInfoResponse.status).json({
        error: "Error fetching user information",
      });
    }

    const userData = await userInfoResponse.json();

    const userId = userData.data.id; // or whichever field contains the user ID

    if (!userId) {
      return res.status(404).json({ error: "User ID not found" });
    }

    // Now fetch stories using the user ID
    const storiesResponse = await fetch(
      `https://social-api4.p.rapidapi.com/v1/stories?username_or_id_or_url=${userId}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "social-api4.p.rapidapi.com",
        },
      }
    );
    console.log(storiesResponse);
    

    if (!storiesResponse.ok) {
      console.error("Error fetching stories:", storiesResponse.status);
      return res.status(storiesResponse.status).json({
        error: "Error fetching stories",
      });
    }

    const storiesData = await storiesResponse.json();
    console.log(storiesData, "storiesData");

    // Process stories data to include SightEngine analysis
    const storiesWithAnalysis = await Promise.all(
      storiesData.data.items.map(async (story) => {
        let storyUrl = null;

        // Determine story URL (image or video)
        if (story.image_versions2?.candidates?.[0]?.url) {
          storyUrl = story.image_versions2.candidates[0].url;
        } else if (story.video_versions?.[0]?.url) {
          storyUrl = story.video_versions[0].url;
        }

        // Get SightEngine analysis if URL exists
        let sightLabel = "safe";
        if (storyUrl) {
          try {
            const analysisResponse = await fetch(
              `${process.env.SIGHTENGINE_API_URL}?url=${encodeURIComponent(
                storyUrl
              )}&models=nudity-2.0,wad,offensive,text-content&api_user=${
                process.env.SIGHTENGINE_API_USER
              }&api_secret=${process.env.SIGHTENGINE_API_SECRET}`
            );
            const analysis = await analysisResponse.json();
            sightLabel = getSightEngineLabel(analysis);
          } catch (error) {
            console.error("Error analyzing story:", error);
          }
        }

        return {
          id: story.id,
          storyUrl,
          timestamp: story.taken_at,
          expiresAt: story.expiring_at,
          isVideo: !!story.video_versions,
          sightLabel,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          username,
          full_name: userData.data?.full_name,
          profile_pic_url: userData.data?.profile_pic_url_hd,
        },
        stories: storiesWithAnalysis,
      },
    });
  } catch (error) {
    console.error("Error in userStories endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

// Same label function as in your frontend
function getSightEngineLabel(analysis) {
  const labels = [];
  if (analysis.nudity && analysis.nudity.safe < 0.8) {
    labels.push("adult content");
  }
  if (analysis.offensive && analysis.offensive.prob > 0.01) {
    labels.push("offensive");
  }
  if (analysis.weapon && analysis.weapon > 0.005) {
    labels.push("weapon");
  }
  if (analysis.drugs && analysis.drugs > 0.005) {
    labels.push("drugs");
  }
  if (labels.length === 0) {
    labels.push("safe");
  }
  return labels.join(", ");
}
