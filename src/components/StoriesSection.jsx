// components/StoriesSection.jsx
import { useEffect, useState } from "react";
import Image from "next/image";
import PropTypes from "prop-types";

export default function StoriesSection({ username }) {
  const [stories, setStories] = useState([]);
  const [labels, setLabels]   = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

   useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);

    fetch(`/api/instagramStories?username=${encodeURIComponent(username)}`)
      .then((res) => {
        if (res.status === 404) {
          // Treat 404 as "no stories found"
          setStories([]);
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to load stories");
        }
        return res.json();
      })
      .then((json) => {
        if (json && Array.isArray(json.stories)) {
          setStories(json.stories);
        }
      })
      .catch((err) => {
        // If there was any other error, treat as "no stories found" rather than an error
        console.warn("Stories fetch error:", err);
        setStories([]);
      })
      .finally(() => setLoading(false));
  }, [username]);


  // 2️⃣ For each story thumbnail, fetch its Sightengine label
  useEffect(() => {
    if (!stories.length) return;

    const fetchLabels = async () => {
      const newLabels = {};
      await Promise.all(
        stories.map(async (story) => {
          // pick the thumbnail or fallback to thumbnail_url
          const imgItem = story.image_versions?.items?.[0];
          const url     = imgItem?.url || story.thumbnail_url;
          if (!url) return;

          const key = story.id || story.fbid || story.code;
          try {
            const res = await fetch(`/api/sightengine?url=${encodeURIComponent(url)}`);
            const { sightLabel } = await res.json();
            newLabels[key] = sightLabel;
          } catch {
            // ignore individual failures
          }
        })
      );
      setLabels(newLabels);
    };

    fetchLabels();
  }, [stories]);

  if (loading) return <p className="text-center text-white py-4">Loading stories…</p>;
  // if (error)   return <p className="text-center text-red-500 py-4">Error: {error}</p>;

  return (
    <section className="px-4 py-6">
      <h2 className="mb-4 text-2xl font-bold text-[#F0FFFF]">Stories</h2>

      {stories.length === 0 ? (
        <p className="text-gray-500">No Stories Found.</p>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {stories.map((story) => {
            const imgItem   = story.image_versions?.items?.[0];
            const thumbnail = imgItem?.url || story.thumbnail_url;
            const key       = story.id || story.fbid || story.code;
            const sightLabel = labels[key];

            return (
              <button
                key={key}
                className="relative w-full aspect-square overflow-hidden rounded-md"
                onClick={() => setSelectedStory(story)}
              >
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={story.caption || "Story"}
                    // fill
                    width={120}
                    height={90}
                    className="object-cover "
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800">
                    <span className="text-xs text-white">No Media</span>
                  </div>
                )}

                {sightLabel && (
                  <span className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                    {sightLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ▶️ Modal to view full story (video or image) */}
      {selectedStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="relative w-[90vw]  h-[400px] max-w-lg bg-[#1f2937] rounded-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-2 right-2 text-white text-lg font-bold"
            >
              ×
            </button>

            {selectedStory.video_url ? (
              <video
                src={selectedStory.video_url}
                controls
                className="w-full h-full rounded"
              />
            ) : (() => {
              const img = selectedStory.image_versions?.items?.[0]?.url ||
                          selectedStory.thumbnail_url;
              return img ? (
                <Image
                  src={img}
                  alt={selectedStory.caption || "Story"}
                  width={600}
                  height={600}
                  className="object-contain w-full h-full rounded"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center bg-gray-800 text-white">
                  No Media Available
                </div>
              );
            })()}

            {selectedStory.caption && (
              <p className="mt-2 text-white text-sm">
                {selectedStory.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

StoriesSection.propTypes = {
  username: PropTypes.string.isRequired,
};
