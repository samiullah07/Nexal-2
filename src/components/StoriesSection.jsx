// Main corret code
// import { useEffect, useState } from "react";
// import Image from "next/image";
// import PropTypes from "prop-types";

// export default function StoriesSection({ username }) {
//   const [stories, setStories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!username) return;

//     async function fetchStories() {
//       setLoading(true);
//       try {
//         const res = await fetch(`/api/instagramStories?username=${encodeURIComponent(username)}`);
//         if (!res.ok) {
//           const { error: msg } = await res.json();
//           throw new Error(msg || `HTTP ${res.status}`);
//         }
//         const { stories: data } = await res.json();
//         setStories(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchStories();
//   }, [username]);

//   if (loading) return <p className="text-center py-4">Loading stories…</p>;
//   if (error) return <p className="text-center text-red-500 py-4">Error: {error}</p>;

//   return (
//     <section className="px-4 py-6">
//       {/* <h2 className="text-xl font-semibold mb-4">{username}&apos;s Stories</h2> */}
//       <h2 className="mb-4 text-2xl font-bold text-[#F0FFFF]">Stories</h2>
//       {stories.length === 0 ? (
//         <p>No stories to show.</p>
//       ) : (
//         <div className="flex space-x-4 overflow-x-auto pb-2 px-8">
//           {stories.map((story) => {
//             // pick highest resolution image
//             const imgItem = story.image_versions?.items?.[0] || {};
//             const src = imgItem.url;
//             const key = story.id || story.fbid || story.code;

//             return (
//               <div key={key} className="flex-none w-32 shrink-0 rounded-full border-2 border-pink-500 p-1">
//                 {src ? (
//                   <Image
//                     src={src}
//                     alt={story.caption || "Instagram story"}
//                     width={80}
//                     height={80}
//                     className="rounded-full"
//                   />
//                 ) : (
//                   <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
//                     <span className="text-xs text-gray-500">No Media</span>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </section>
//   );
// }

// StoriesSection.propTypes = {
//   username: PropTypes.string.isRequired,
// };

// Correct shape
// import { useEffect, useState } from "react";
// import Image from "next/image";
// import PropTypes from "prop-types";

// export default function StoriesSection({ username }) {
//   const [stories, setStories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!username) return;

//     async function fetchStories() {
//       setLoading(true);
//       try {
//         // const res = await fetch(`/api/instagramStories?username=${encodeURIComponent(username)}`);
//         const res = await fetch(`/api/instagramStories?username=${encodeURIComponent(username)}`);

//         if (!res.ok) {
//           const { error: msg } = await res.json();
//           // throw new Error(msg || `HTTP ${res.status}`);
//           throw new Error(msg || `HTTP ${res.status}`);

//         }
//         const { stories: data } = await res.json();
//         setStories(data);
//       } catch (err) {
//         // setError(err.message);
//         if (err.message.includes("No stories found")) {
//         setStories([]);
//         setError(null);
//         } else {
//         setError(err.message);
//         }
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchStories();
//   }, [username]);

//   if (loading) return <p className="text-center py-4">Loading stories…</p>;
//   // if (error) return <p className="text-center text-red-500 py-4">Error: {error}</p>;
//   if (error) return <p className="text-center text-red-500 py-4">Error: {error}</p>;
//   return (
//     <section className="px-4 py-6">
//       {/* <h2 className="text-xl font-semibold mb-4">{username}&apos;s Stories</h2> */}
//       <h2 className="mb-4 text-2xl font-bold text-[#F0FFFF]">Stories</h2>
//       {/* {stories.length === 0 ? (
//         <p>No stories to show.</p> */}
//       {stories.length === 0 ? (
//       <p className="text-left py-4 text-gray-500 text-md">No Stories Found.</p>
//       ) : (
//         <div className="grid grid-cols-8">
//           {stories.map((story) => {
//             // pick highest resolution image
//             const imgItem = story.image_versions?.items?.[0] || {};
//             const src = imgItem.url;
//             const key = story.id || story.fbid || story.code;

//             return (
//               <div key={key} className="relative w-52 aspect-square overflow-hidden">
//                 {src ? (
//                   <Image
//                     src={src}
//                     alt={story.caption || "Instagram story"}
//                     width={120}
//                     height={70}
//                     className="rounded-md"
//                   />
//                 ) : (
//                   <div className="flex h-full w-full items-center justify-center">
//                     <span className="text-xs text-white">No Media</span>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </section>
//   );
// }

// StoriesSection.propTypes = {
//   username: PropTypes.string.isRequired,
// };


// // StoriesSection.tsx (coorect video section and stroies section)
// import { useEffect, useState } from "react";
// import Image from "next/image";
// import PropTypes from "prop-types";

// export default function StoriesSection({ username }) {
//   const [stories, setStories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   // NEW: Which story is open in the modal?
//   const [selectedStory, setSelectedStory] = useState(null);

//   useEffect(() => {
//     if (!username) return;

//     async function fetchStories() {
//       setLoading(true);
//       try {
//         const res = await fetch(
//           `/api/instagramStories?username=${encodeURIComponent(username)}`
//         );
//         if (!res.ok) {
//           const { error: msg } = await res.json();
//           throw new Error(msg || `HTTP ${res.status}`);
//         }
//         const { stories: data } = await res.json();
//         setStories(data);
//       } catch (err) {
//         if (err.message.includes("No stories found")) {
//           setStories([]);
//           setError(null);
//         } else {
//           setError(err.message);
//         }
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchStories();
//   }, [username]);

//   if (loading) return <p className="text-center py-4">Loading stories…</p>;
//   if (error)
//     return (
//       <p className="text-center text-red-500 py-4">Error: {error}</p>
//     );

//   return (
//     <section className="px-4 py-6">
//       <h2 className="mb-4 text-2xl font-bold text-[#F0FFFF]">Stories</h2>

//       {stories.length === 0 ? (
//         <p className="text-left py-4 text-gray-500 text-md">
//           No Stories Found.
//         </p>
//       ) : (
//         <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
//           {stories.map((story) => {
//             // pick highest resolution image thumbnail
//             const imgItem = story.image_versions?.items?.[0];
//             const thumbnail = imgItem?.url || story.thumbnail_url;
//             const key = story.id || story.fbid || story.code;

//             return (
//               <button
//                 key={key}
//                 className="relative w-full aspect-square overflow-hidden rounded-md"
//                 onClick={() => setSelectedStory(story)}
//               >
//                 {thumbnail ? (
//                   <Image
//                     src={thumbnail}
//                     alt={story.caption || "Instagram story"}
//                     fill
//                     className="object-cover"
//                   />
//                 ) : (
//                   <div className="flex h-full w-full items-center justify-center bg-gray-800">
//                     <span className="text-xs text-white">No Media</span>
//                   </div>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {/* Modal */}
//       {selectedStory && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
//           onClick={() => setSelectedStory(null)}
//         >
//           <div
//             className="relative w-[90vw] h-[400px] max-w-lg bg-[#1f2937] rounded-md p-4"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Close Button */}
//             <button
//               onClick={() => setSelectedStory(null)}
//               className="absolute top-2 right-2 text-white text-lg font-bold"
//             >
//               ×
//             </button>

//             {/* Content */}
//             {selectedStory.video_url ? (
//               <video
//                 src={selectedStory.video_url}
//                 controls
//                 className="h-full w-full object-contain rounded"
//               />
//             ) : (
//               (() => {
//                 // fallback to image if not video
//                 const img =
//                   selectedStory.image_versions?.items?.[0]?.url ||
//                   selectedStory.thumbnail_url;
//                 return img ? (
//                   <Image
//                     src={img}
//                     alt={selectedStory.caption || "Story image"}
//                     width={600}
//                     height={600}
//                     className="object-contain w-full h-full rounded"
//                   />
//                 ) : (
//                   <div className="flex h-64 w-full items-center justify-center bg-gray-800 text-white">
//                     No Media Available
//                   </div>
//                 );
//               })()
//             )}

//             {/* Optional caption */}
//             {selectedStory.caption && (
//               <p className="mt-2 text-white text-sm">
//                 {selectedStory.caption}
//               </p>
//             )}
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }

// StoriesSection.propTypes = {
//   username: PropTypes.string.isRequired,
// };








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

  // 1️⃣ Load Instagram stories
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/instagramStories?username=${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stories");
        return res.json();
      })
      .then(({ stories: data }) => {
        setStories(data);
      })
      .catch((err) => setError(err.message))
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
  if (error)   return <p className="text-center text-red-500 py-4">Error: {error}</p>;

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
