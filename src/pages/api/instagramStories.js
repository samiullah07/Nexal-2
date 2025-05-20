export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    console.error("No username provided in query.");
    return res.status(400).json({ error: "Username query parameter is required." });
  }

  const url = `https://social-api4.p.rapidapi.com/v1/stories?username_or_id_or_url=${encodeURIComponent(username)}`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "social-api4.p.rapidapi.com",
    },
  };

  try {
    // console.log("Fetching stories URL:", url);
    const response = await fetch(url, options);
    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON response:", text);
      return res.status(500).json({ error: "Invalid JSON from stories API." });
    }

    // console.log("Full API response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(`Error fetching stories. Status: ${response.status}`, data);
      return res.status(response.status).json({ error: data.message || "Error fetching stories." });
    }

    // Extract stories from the `items` array
    const stories = data.data?.items;
    // console.log("Extracted stories:", stories);

    if (!Array.isArray(stories) || stories.length === 0) {
      console.warn(`No stories found for user '${username}'.`);
      return res.status(404).json({ error: "No stories found for this user." });
    }

    // Optionally include metadata
    const metadata = data.data?.additional_data;

    res.status(200).json({ metadata, stories });
  } catch (error) {
    console.error("Exception caught while fetching stories:", error);
    res.status(500).json({ error: error.message });
  }
}
