// // pages/api/sightengine.js
// export default async function handler(req, res) {
//   const { url } = req.query;
//   if (!url) {
//     console.log("[Sightengine] Missing URL in request");
//     return res.status(400).json({ error: "Missing image URL" });
//   }

//   const apiUser = process.env.SIGHTENGINE_USER || "150452328";
//   const apiSecret = process.env.SIGHTENGINE_SECRET || "uEzhj5Q2FVbg4jfnB4mRc84cdRqTpz4m";
//   const endpoint = "https://api.sightengine.com/1.0/check.json";

//   try {
//    const params = new URLSearchParams({
//    api_user: apiUser,
//    api_secret: apiSecret,
//    url,
//   // use 'wad' for weapons-alcohol-drugs, plus nudity, offensive, violence
//   models: "nudity,offensive,violence,wad",
//   });
//     const requestUrl = `${endpoint}?${params.toString()}`;
//     console.log("[Sightengine] Request URL:", requestUrl);

//     const sightRes = await fetch(requestUrl);
//     const analysis = await sightRes.json();
//     console.log("[Sightengine] Analysis response:", JSON.stringify(analysis));

//     if (!sightRes.ok) {
//       console.error("[Sightengine] API returned error:", analysis);
//       return res.status(500).json({ error: "Sightengine API error" });
//     }

//     // Build a label if any category passes threshold
//     const labels = [];
//     // if (analysis.drugs && analysis.drugs > 0.05) labels.push("Drugs");
//     // if (analysis.weapon && analysis.weapon > 0.05) labels.push("Weapon");
//     if (analysis.wad && analysis.wad > 0.05) labels.push("WAD"); // weapons/alcohol/drugs
//     if (analysis.offensive && analysis.offensive.prob > 0.1) labels.push("Offensive");
//     if (analysis.nudity && analysis.nudity.safe < 0.8)     labels.push("Nudity");
//     if (analysis.violence && analysis.violence > 0.05)       labels.push("Violence");

//     const sightLabel = labels.length ? labels.join(", ") : null;
//     console.log("[Sightengine] Computed sightLabel:", sightLabel);

//     return res.status(200).json({ sightLabel });
//   } catch (err) {
//     console.error("[Sightengine] Exception:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }


export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    console.log("[Sightengine] Missing URL in request");
    return res.status(400).json({ error: "Missing image URL" });
  }

  const apiUser = process.env.SIGHTENGINE_USER || "150452328";
  const apiSecret = process.env.SIGHTENGINE_SECRET || "uEzhj5Q2FVbg4jfnB4mRc84cdRqTpz4m";
  const endpoint = "https://api.sightengine.com/1.0/check.json";

  try {
    const params = new URLSearchParams({
      api_user: apiUser,
      api_secret: apiSecret,
      url,
      models: "nudity,offensive,violence,wad",
    });

    const requestUrl = `${endpoint}?${params.toString()}`;
    console.log("[Sightengine] Request URL:", requestUrl);

    const sightRes = await fetch(requestUrl);
    const analysis = await sightRes.json();
    console.log("[Sightengine] Analysis response:", JSON.stringify(analysis));

    if (!sightRes.ok) {
      console.error("[Sightengine] API returned error:", analysis);
      return res.status(500).json({ error: "Sightengine API error" });
    }

    // 🔧 Adjusted realistic thresholds (more tolerant)
    const THRESHOLDS = {
      nuditySafe: 0.3,           // Previously 0.8 — now allows more skin if artistic
      offensiveProb: 0.3,        // Previously 0.1 — ignore light sarcasm or edgy jokes
      violence: 0.3,             // Was 0.05 — now only flag clearly violent imagery
      wad: 0.4,                  // Raise to avoid false positive on bottles/cartoons
    };

    const labels = [];

    if (analysis.wad && analysis.wad > THRESHOLDS.wad) {
      labels.push("Weapons/Alcohol/Drugs");
    }

    if (analysis.offensive && analysis.offensive.prob > THRESHOLDS.offensiveProb) {
      labels.push("Offensive");
    }

    if (analysis.nudity && analysis.nudity.safe < THRESHOLDS.nuditySafe) {
      labels.push("Nudity");
    }

    if (analysis.violence && analysis.violence > THRESHOLDS.violence) {
      labels.push("Violence");
    }

    const sightLabel = labels.length ? labels.join(", ") : null;
    console.log("[Sightengine] Computed sightLabel:", sightLabel);

    return res.status(200).json({ sightLabel });
  } catch (err) {
    console.error("[Sightengine] Exception:", err);
    return res.status(500).json({ error: err.message });
  }
}
