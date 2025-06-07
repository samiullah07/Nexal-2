// // src/components/FbRelationCard.jsx
// "use client";

// import React from "react";
// import Image from "next/image";
// import useSWR from "swr";

// const fetcher = (url) => fetch(url).then((res) => res.json());

// // Helper to choose a text color based on the relationship type
// const getRelationshipColor = (type) => {
//   switch (type) {
//     case "Family":
//       return "text-blue-500";
//     case "Girlfriend/Wife":
//       return "text-pink-500";
//     case "Boyfriend/Husband":
//       return "text-yellow-500";
//     case "Associate":
//       return "text-green-500";
//     case "Friend":
//       return "text-purple-500";
//     default:
//       return "text-gray-500";
//   }
// };

// export default function FbRelationCard({ username }) {
//   // Fetch relationships once and never revalidate automatically
//   const { data, error } = useSWR(
//     username ? `/api/fb_riskscore?username=${encodeURIComponent(username)}` : null,
//     fetcher,
//     {
//       revalidateOnFocus: false,
//       revalidateOnReconnect: false,
//       refreshInterval: 0,
//     }
//   );

//   // 1) Error state
//   if (error) {
//     return (
//       <div className="mt-5 mx-12 bg-[#1F2937] shadow-lg rounded-lg p-6">
//         <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>
//         <p className="text-red-500">Error loading relationships.</p>
//       </div>
//     );
//   }

//   // 2) Still loading
//   if (!data) {
//     return (
//       <div className="mt-5 mx-12 bg-[#1F2937] shadow-lg rounded-lg p-6">
//         <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>
//         <p className="text-white">Loading relationships…</p>
//       </div>
//     );
//   }

//   const { relationships } = data;

//   // 3) If the API returned a string (e.g. "No relationships found")
//   if (typeof relationships === "string") {
//     return (
//       <div className="mt-5 mx-20 bg-[#1F2937] shadow-lg rounded-lg p-6">
//         <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>
//         <p className="text-[#F0FFFF]">{relationships}</p>
//       </div>
//     );
//   }

//   // Helper to fetch the real FB‐profile URL for a given “relUsername”
//   async function getFbProfileLink(relUsername) {
//     try {
//       const resp = await fetch(
//         `/api/facebookSearch?username=${encodeURIComponent(relUsername)}`
//       );
//       if (!resp.ok) {
//         console.warn(`facebookSearch failed for ${relUsername}: ${resp.status}`);
//         // Fallback to the plain handle if the API fails
//         return `https://www.facebook.com/${encodeURIComponent(relUsername)}`;
//       }
//       const json = await resp.json();

//       // 1) If API returns a “url” field directly, use that
//       if (json.url) {
//         return json.url;
//       }

//       // 2) Otherwise, if it returns a “username” field, build URL from that
//       //    e.g. { username: "grace.la.pierre.ii", … }
//       if (json.username) {
//         return `https://www.facebook.com/${encodeURIComponent(json.username)}`;
//       }

//       // 3) Otherwise, if it returns a “link” field, use that URL directly
//       //    e.g. { link: "https://www.facebook.com/grace.la.pierre.ii", … }
//       if (json.link) {
//         return json.link;
//       }

//       // 4) Otherwise, if it returns a numeric “id” field, use profile.php
//       //    e.g. { id: "100076428107904", … }
//       if (json.id) {
//         return `https://www.facebook.com/profile.php?id=${encodeURIComponent(json.id)}`;
//       }

//       // 5) Last fallback: try the raw relUsername (may contain spaces)
//       return `https://www.facebook.com/${encodeURIComponent(relUsername)}`;
//     } catch (err) {
//       console.error("Error calling facebookSearch:", err);
//       return `https://www.facebook.com/${encodeURIComponent(relUsername)}`;
//     }
//   }

//   // 4) Render relationships as a grid of cards
//   return (
//     <div className="mt-5 bg-[#1F2937] border border-[#6c757d] shadow-lg rounded-lg p-6">
//       <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>
//       <ul className="grid grid-cols-5 gap-4">
//         {Object.entries(relationships).map(([userKey, relData]) => {
//           const imgUrl = relData.profileImage || "/no-profile-pic-img.png";
//           const relType = relData.relationship || "Unknown";

//           return (
//             <li
//               key={userKey}
//               className="
//                 border border-[#6c757d]
//                 rounded-md
//                 p-5
//                 shadow-md
//                 flex flex-col items-center justify-center
//                 transition-transform duration-300
//                 hover:scale-105
//                 cursor-pointer
//               "
//               onClick={async () => {
//                 // 1) Call facebookSearch for the exact public “username” or “link”
//                 const profileUrl = await getFbProfileLink(relData.username);
//                 // 2) Open that URL in a new tab
//                 window.open(profileUrl, "_blank");
//               }}
//             >
//               <Image
//                 src={imgUrl}
//                 alt={`Profile of ${relData.username}`}
//                 width={80}
//                 height={80}
//                 className="w-16 h-16 rounded-full mb-2 object-cover"
//                 onError={(e) => {
//                   e.currentTarget.src = "/no-profile-pic-img.png";
//                 }}
//               />
//               <span className="font-medium text-[#F0FFFF] text-[16px] truncate">
//                 {relData.username}
//               </span>
//               <span className={`text-sm font-semibold ${getRelationshipColor(relType)}`}>
//                 {relType}
//               </span>
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }



// src/components/FbRelationCard.jsx
"use client";

import React from "react";
import Image from "next/image";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

// Helper to choose a text color based on the relationship type
const getRelationshipColor = (type) => {
  switch (type) {
    case "Family":
      return "text-blue-500";
    case "Girlfriend/Wife":
      return "text-pink-500";
    case "Boyfriend/Husband":
      return "text-yellow-500";
    case "Associate":
      return "text-green-500";
    case "Friend":
      return "text-purple-500";
    default:
      return "text-gray-500";
  }
};

export default function FbRelationCard({ username }) {
  // Fetch relationships once and never revalidate automatically
  const { data, error } = useSWR(
    username ? `/api/fb_riskscore?username=${encodeURIComponent(username)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    }
  );

  // 1) Error state
  if (error) {
    return (
      <div className="mt-5 mx-12 bg-[#1F2937] shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>
        <p className="text-red-500">Error loading relationships.</p>
      </div>
    );
  }

  // 2) Still loading → show a circular spinner instead of plain text
  if (!data) {
    return (
      <div className="mt-5 mx-12 bg-[#1F2937] shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>

        {/*
          Instead of:
            <p className="text-white">Loading relationships…</p>
          we drop in a spinner. Here’s one simple Tailwind+CSS spinner:
        */}
        <div className="flex justify-center items-center py-10">
          {/* 
            This <div> becomes a spinning circle:
            - ‘h-10 w-10’:   size of the spinner
            - ‘border-4’:    thickness of the circle’s ring
            - ‘border-t-transparent’: hide the top border, so you see a “gap”
            - ‘border-blue-400’: give the rest of the ring a color
            - ‘rounded-full’: make it perfectly circular
            - ‘animate-spin’: the built-in Tailwind spin animation
          */}
          <div className="h-10 w-10 border-4 border-t-transparent border-blue-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const { relationships } = data;

  // 3) If the API returned a string (e.g. "No relationships found")
  if (typeof relationships === "string") {
    return (
      <div className="mt-5 mx-20 bg-[#1F2937] shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>
        <p className="text-[#F0FFFF]">{relationships}</p>
      </div>
    );
  }

  // Helper to fetch the real FB‐profile URL for a given “relUsername”
  async function getFbProfileLink(relUsername) {
    try {
      const resp = await fetch(
        `/api/facebookSearch?username=${encodeURIComponent(relUsername)}`
      );
      if (!resp.ok) {
        console.warn(`facebookSearch failed for ${relUsername}: ${resp.status}`);
        return `https://www.facebook.com/${encodeURIComponent(relUsername)}`;
      }
      const json = await resp.json();

      if (json.url) {
        return json.url;
      }
      if (json.username) {
        return `https://www.facebook.com/${encodeURIComponent(json.username)}`;
      }
      if (json.link) {
        return json.link;
      }
      if (json.id) {
        return `https://www.facebook.com/profile.php?id=${encodeURIComponent(json.id)}`;
      }
      return `https://www.facebook.com/${encodeURIComponent(relUsername)}`;
    } catch (err) {
      console.error("Error calling facebookSearch:", err);
      return `https://www.facebook.com/${encodeURIComponent(relUsername)}`;
    }
  }

  // 4) Render relationships as a grid of cards
  return (
    <div className="mt-5 bg-[#1F2937] border border-[#6c757d] shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Relationships</h2>
      <ul className="grid grid-cols-5 gap-4">
        {Object.entries(relationships).map(([userKey, relData]) => {
          const imgUrl = relData.profileImage || "/no-profile-pic-img.png";
          const relType = relData.relationship || "Unknown";

          return (
            <li
              key={userKey}
              className="
                border border-[#6c757d]
                rounded-md
                p-5
                shadow-md
                flex flex-col items-center justify-center
                transition-transform duration-300
                hover:scale-105
                cursor-pointer
              "
              onClick={async () => {
                const profileUrl = await getFbProfileLink(relData.username);
                window.open(profileUrl, "_blank");
              }}
            >
              <Image
                src={imgUrl}
                alt={`Profile of ${relData.username}`}
                width={80}
                height={80}
                className="w-16 h-16 rounded-full mb-2 object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/no-profile-pic-img.png";
                }}
              />
              <span className="font-medium text-[#F0FFFF] text-[16px] truncate">
                {relData.username}
              </span>
              <span className={`text-sm font-semibold ${getRelationshipColor(relType)}`}>
                {relType}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
