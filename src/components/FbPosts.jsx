// // src/components/FbPosts.jsx
// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { getPostImageUrl } from "../lib/get_Post_Images";

// function formatCount(value) {
//   // Ensure we’re working with a number
//   const num = Number(value);
//   if (isNaN(num)) return value;

//   if (num >= 1_000_000_000) {
//     return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
//   }
//   if (num >= 1_000_000) {
//     return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
//   }
//   if (num >= 1_000) {
//     return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
//   }
//   return String(num);
// }

// function CommentAvatar({ author }) {
//   if (!author.picture) {
//     console.warn(
//       `CommentAvatar: no profile‐pic URL for author “${author.name || "Unknown"}” (ID: ${
//         author.id || "n/a"
//       }, URL: ${author.url || "n/a"})`
//     );
//   }
//   const avatarUrl = author.picture || "/no-profile-pic-img.png";

//   return (
//     <img
//       src={avatarUrl}
//       alt={`${author.name || "User"}’s profile picture`}
//       className="w-8 h-8 rounded-full object-cover flex-shrink-0 mr-3"
//       onError={(e) => {
//         e.currentTarget.onerror = null;
//         e.currentTarget.src = "/no-profile-pic-img.png";
//       }}
//     />
//   );
// }

// /**
//  * Helper: given a UNIX‐timestamp-in‐seconds, return "YYYY-MM-DD" local date string.
//  */
// function toLocalDateString(unixSeconds) {
//   const d = new Date(unixSeconds * 1000);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// }

// export default function FbPosts({ profileId, totalPages = 12 }) {
//   const POSTS_PER_PAGE = 3;

//   // ─── pagination state ─────────────────────────────────────────────────
//   const [pageCursors, setPageCursors] = useState({ 1: null });
//   const [pageData, setPageData] = useState({});
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loadingPage, setLoadingPage] = useState(null);
//   const [error, setError] = useState(null);

//   // ─── modal / comments state ─────────────────────────────────────────────
//   const [showModal, setShowModal] = useState(false);
//   const [selectedPost, setSelectedPost] = useState(null);
//   const [showChildren, setShowChildren] = useState(false);

//   const [comments, setComments] = useState([]);
//   const [commentsCursor, setCommentsCursor] = useState(null);
//   const [commentsLoading, setCommentsLoading] = useState(false);
//   const [commentsError, setCommentsError] = useState(null);

//   // ─── MULTI-KEYWORD SEARCH state ─────────────────────────────────────────
//   const [keywordInput, setKeywordInput] = useState("");
//   const [keywords, setKeywords] = useState([]); // array of lowercase strings

//   // ─── DATE FILTER state ───────────────────────────────────────────────────
//   // Will hold a string "YYYY-MM-DD" or "" if none selected.
//   const [selectedDate, setSelectedDate] = useState("");

//   // Whenever profileId changes, reset pagination + filters
//   useEffect(() => {
//     if (!profileId) return;
//     setPageCursors({ 1: null });
//     setPageData({});
//     setCurrentPage(1);
//     setError(null);

//     // Reset keyword & date filters
//     setKeywordInput("");
//     setKeywords([]);
//     setSelectedDate("");
//   }, [profileId]);

//   // Fetch posts for current page
//   useEffect(() => {
//     if (!pageData[currentPage] && loadingPage !== currentPage) {
//       fetchPage(currentPage);
//     }
//   }, [currentPage, pageData, loadingPage]);

//   async function fetchPage(pageNum) {
//     if (pageData[pageNum] || loadingPage === pageNum) return;
//     setLoadingPage(pageNum);
//     setError(null);

//     try {
//       const cursor = pageCursors[pageNum] || null;
//       const url = new URL("/api/fb_posts", window.location.origin);
//       url.searchParams.set("profile_id", profileId);
//       if (cursor) url.searchParams.set("cursor", cursor);
//       url.searchParams.set("limit", POSTS_PER_PAGE);

//       const res = await fetch(url);
//       if (!res.ok) throw new Error(`Failed to fetch page ${pageNum}: ${res.statusText}`);
//       const { results: pagePosts = [], cursor: nextCursor = null } = await res.json();

//       setPageData((prev) => ({ ...prev, [pageNum]: pagePosts }));
//       if (nextCursor) {
//         setPageCursors((prev) => ({ ...prev, [pageNum + 1]: nextCursor }));
//       }
//     } catch (err) {
//       console.error(err);
//       setError(err.message || "Unknown error");
//     } finally {
//       setLoadingPage(null);
//     }
//   }

//   async function openModal(post) {
//     setSelectedPost(post);
//     setShowChildren(false);
//     setShowModal(true);

//     setComments([]);
//     setCommentsCursor(null);
//     setCommentsLoading(true);
//     setCommentsError(null);

//     try {
//       const url = new URL("/api/fetch_fb_comments", window.location.origin);
//       url.searchParams.set("post_id", post.post_id);

//       const res = await fetch(url);
//       if (!res.ok) throw new Error(res.statusText);

//       const data = await res.json();
//       setComments(data.results || []);
//       setCommentsCursor(data.cursor || null);
//     } catch (err) {
//       console.error(err);
//       setCommentsError(err.message || "Failed to load comments");
//     } finally {
//       setCommentsLoading(false);
//     }
//   }

//   function closeModal() {
//     setShowModal(false);
//     setSelectedPost(null);
//   }

//   function firstBadLabel(labels = []) {
//     return labels.find((l) => l !== "safe" && l !== "no_image" && l !== "analysis_error");
//   }

//   // ─── FILTER LOGIC ─────────────────────────────────────────────────────────
//   // Collect all posts on this page
//   const posts = pageData[currentPage] || [];

//   // Return true if a given post matches the selected date (or if no date is selected).
//   const matchesDate = (post) => {
//     if (!selectedDate) return true;
//     // Convert timestamp → local "YYYY-MM-DD"
//     return toLocalDateString(post.timestamp) === selectedDate;
//   };

//   // Return true if a given post’s message contains at least one keyword (or if no keywords).
//   const matchesKeyword = (post) => {
//     if (keywords.length === 0) return true;
//     const text = (post.message || "").toLowerCase();
//     return keywords.some((kw) => text.includes(kw));
//   };

//   // Final filtered list: must match both date and keyword filters
//   const filteredPosts = posts.filter((post) => matchesDate(post) && matchesKeyword(post));

//   // ─── KEYWORD INPUT HANDLERS ──────────────────────────────────────────────
//   const addKeyword = useCallback(() => {
//     const raw = keywordInput.trim().toLowerCase();
//     if (raw === "") return;

//     // Split on commas if user typed/pasted multiple (e.g. "foo, bar")
//     const parts = raw.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
//     setKeywords((prev) => {
//       const next = [...prev];
//       parts.forEach((p) => {
//         if (p && !next.includes(p)) {
//           next.push(p);
//         }
//       });
//       return next;
//     });
//     setKeywordInput("");
//   }, [keywordInput]);

//   function handleKeywordKeyDown(e) {
//     if (e.key === "Enter" || e.key === ",") {
//       e.preventDefault();
//       addKeyword();
//     }
//   }

//   function handleKeywordChange(e) {
//     setKeywordInput(e.target.value);
//   }

//   function removeKeyword(kwToRemove) {
//     setKeywords((prev) => prev.filter((k) => k !== kwToRemove));
//   }

//   // ─── DATE INPUT HANDLER ─────────────────────────────────────────────────
//   function handleDateChange(e) {
//     setSelectedDate(e.target.value); // e.g. "2023-08-15" or "" if cleared
//   }

//   // ─── PAGINATION CONTROLS SETUP ────────────────────────────────────────────
//   const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
//   const block = 5;
//   const firstBlock = pages.slice(0, block);
//   const lastPage = pages[pages.length - 1];

//   const formatShortDate = (unixSeconds) => {
//     const d = new Date(unixSeconds * 1000);
//     return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
//   };

//   return (
//     <div className="space-y-4">
//       {/* ─── FILTER BAR: KEYWORDS + DATE ─────────────────────────────────────── */}
//       <div className="flex items-center justify-between gap-4">
//         {/* Keyword “tags” + input */}
//         <div className="flex w-full gap-1 border border-teal-400 rounded-md px-2 py-1 bg-gray-800">
//           {keywords.map((kw) => (
//             <span
//               key={kw}
//               className="flex items-center bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-sm px-4 py-[4px] text-md"
//             >
//               {kw}
//               <button
//                 onClick={() => removeKeyword(kw)}
//                 className="ml-1 text-[10px] font-bold"
//                 aria-label={`Remove keyword ${kw}`}
//               >
//                 ×
//               </button>
//             </span>
//           ))}

//           <input
//             type="text"
//             value={keywordInput}
//             onChange={handleKeywordChange}
//             onKeyDown={handleKeywordKeyDown}
//             placeholder="Type a keyword and press Enter (or comma)…"
//             className="flex-1 bg-transparent focus:outline-none text-gray-200 placeholder-gray-500 ml-1 py-1"
//           />
//         </div>

//         {/* Date filter */}
//         <div className="flex flex-col">
//           <label htmlFor="date-filter" className="text-gray-200 -mt-7 text-base mb-1">
//             Filter by Date:
//           </label>
//           <input
//             id="date-filter"
//             type="date"
//             value={selectedDate}
//             onChange={handleDateChange}
//             className="bg-gray-800 border border-teal-400 text-gray-200 text-base py-2 px-3 rounded-md focus:outline-none"
//           />
//         </div>
//       </div>

//       {/* ─── LOADING / ERROR MESSAGE FOR POSTS ─────────────────────────────── */}
//       {loadingPage === currentPage && (
//         <div className="flex justify-center items-center py-8">
//           <span className="text-gray-400">Loading page {currentPage}…</span>
//         </div>
//       )}
//       {error && (
//         <div className="py-8 px-4 bg-red-900 rounded-md">
//           <p className="text-red-200">Error: {error}</p>
//         </div>
//       )}

//       {/* ─── POSTS TABLE ────────────────────────────────────────────────────── */}
//       {!loadingPage && !error && (
//         <div className="overflow-x-auto">
//           <table className="table-auto w-full bg-gray-800 rounded-md overflow-hidden">
//             <thead className="bg-gray-700">
//               <tr>
//                 {[
//                   "Image",
//                   "Post / Title",
//                   "Timestamp",
//                   "Comments",
//                   "Reactions",
//                   "View Details",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="px-4 py-2 text-left text-sm font-medium text-gray-200"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filteredPosts.map((post) => {
//                 const date = new Date(post.timestamp * 1000).toLocaleString();
//                 const src = getPostImageUrl(post);
//                 const badLabel = firstBadLabel(post.labels);

//                 return (
//                   <tr key={post.post_id} className="border-b border-gray-700">
//                     {/* ─── IMAGE CELL ─────────────────────────────────────────── */}
//                     <td className="px-4 py-2">
//                       <div className="relative inline-block">
//                         {src ? (
//                           <img
//                             src={src}
//                             alt="post"
//                             className="h-12 w-12 object-cover rounded-md"
//                           />
//                         ) : (
//                           <div className="h-12 w-12 bg-gray-600 flex items-center justify-center rounded-md">
//                             <span className="text-gray-400 text-xs">No Image</span>
//                           </div>
//                         )}

//                         {badLabel && (
//                           <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1 py-[2px] rounded-br-md">
//                             {badLabel.replace("-", " ")}
//                           </span>
//                         )}
//                       </div>
//                     </td>

//                     {/* ─── MESSAGE / TITLE CELL ───────────────────────────────────── */}
//                     <td className="px-4 py-2 text-gray-100 text-sm whitespace-nowrap overflow-hidden truncate max-w-xs">
//                       {post.message || "(No message)"}
//                     </td>

//                     {/* ─── TIMESTAMP CELL ─────────────────────────────────────── */}
//                     <td className="px-4 py-2 text-gray-300 text-sm">{date}</td>

//                     {/* ─── COMMENTS COUNT CELL ───────────────────────────────── */}
//                     <td className="px-4 py-2 text-center text-gray-200 text-sm">
//                       {formatCount(post.comments_count)}
//                     </td>

//                     {/* ─── REACTIONS COUNT CELL ───────────────────────────────── */}
//                     <td className="px-4 py-2 text-center text-gray-200 text-sm">
//                       {formatCount(post.reactions_count)}
//                     </td>

//                     {/* ─── VIEW DETAILS BUTTON CELL ───────────────────────────── */}
//                     <td className="px-4 py-2 text-center">
//                       <button onClick={() => openModal(post)}>
//                         <img src="/eye.png" alt="View" className="h-6 w-6" />
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}

//               {/* If no posts match the filters, show a “no results” row */}
//               {filteredPosts.length === 0 && (
//                 <tr>
//                   <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
//                     No posts match those filters.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* ─── PAGINATION CONTROLS ─────────────────────────────────────────────── */}
//       <div className="flex justify-center items-center space-x-1">
//         <button
//           onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//           className="w-8 h-8 flex items-center justify-center border border-gray-600 rounded-md text-gray-200 hover:bg-gray-700"
//         >
//           &lt;
//         </button>
//         {firstBlock.map((n) => (
//           <button
//             key={n}
//             onClick={() => setCurrentPage(n)}
//             className={`w-8 h-8 flex items-center justify-center border ${
//               n === currentPage
//                 ? "bg-teal-500 border-teal-500 text-white"
//                 : "border-gray-600 text-gray-200 hover:bg-gray-700"
//             }`}
//           >
//             {n}
//           </button>
//         ))}
//         <span className="px-1 text-gray-200">…</span>
//         <button
//           onClick={() => setCurrentPage(lastPage)}
//           className={`w-8 h-8 flex items-center justify-center border ${
//             lastPage === currentPage
//               ? "bg-teal-500 border-teal-500 text-white"
//               : "border-gray-600 text-gray-200 hover:bg-gray-700"
//           }`}
//         >
//           {lastPage}
//         </button>
//         <button
//           onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
//           className="w-8 h-8 flex items-center justify-center border border-gray-600 rounded-md text-gray-200 hover:bg-gray-700"
//         >
//           &gt;
//         </button>
//       </div>

//       {/* ─── MODAL ────────────────────────────────────────────────────────────── */}
//       {showModal && selectedPost && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-[#1f2937] text-white p-4 md:p-6 rounded-md relative w-[90%] max-w-[500px] max-h-[80vh] overflow-y-auto">
//             <div className="flex justify-between items-center">
//               <p className="text-gray-400 text-sm mb-2">
//                 {new Date(selectedPost.timestamp * 1000).toLocaleString()}
//               </p>
//               <button
//                 onClick={closeModal}
//                 className="text-[16px] px-2 py-1 bg-[#000000] font-bold"
//               >
//                 X
//               </button>
//             </div>

//             {/* ─── POST MEDIA ────────────────────────────────────────────────── */}
//             <div className="w-full h-[250px] mb-4 flex items-center justify-center relative">
//               {selectedPost.video_files?.video_hd_file ||
//               selectedPost.video_files?.video_sd_file ? (
//                 <video
//                   src={
//                     selectedPost.video_files.video_hd_file ||
//                     selectedPost.video_files.video_sd_file
//                   }
//                   controls
//                   className="h-full w-full object-contain rounded-md"
//                 />
//               ) : (
//                 <img
//                   src={getPostImageUrl(selectedPost)}
//                   alt="Post media"
//                   className="h-full w-full object-contain rounded-md"
//                 />
//               )}
//               {firstBadLabel(selectedPost.labels) && (
//                 <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1 py-[2px] rounded-br-md">
//                   {firstBadLabel(selectedPost.labels).replace("-", " ")}
//                 </span>
//               )}
//             </div>

//             <div className="text-[14px] mt-4 mb-2 text-gray-200">
//               {selectedPost.message || "(No message)"}
//             </div>

//             {/* ─── CHILD POSTS (IF ANY) ─────────────────────────────────────── */}
//             {selectedPost.album_preview?.length > 1 && (
//               <button
//                 onClick={() => setShowChildren((c) => !c)}
//                 className="mb-4 px-4 py-2 bg-[#14B8A6] text-white rounded-md"
//               >
//                 {showChildren ? "Hide Child Posts" : "View Child Posts"}
//               </button>
//             )}
//             {showChildren && selectedPost.album_preview && (
//               <div className="flex space-x-2 overflow-x-auto mb-4">
//                 {selectedPost.album_preview.map((item, idx) => (
//                   <img
//                     key={idx}
//                     src={item.image_file_uri}
//                     alt={`Child ${idx + 1}`}
//                     className="flex-shrink-0 w-[90px] h-[90px] object-cover rounded-md"
//                   />
//                 ))}
//               </div>
//             )}

//             {/* ─── COMMENTS SECTION ──────────────────────────────────────────── */}
//             <div>
//               <h3 className="font-medium mb-2">Comments</h3>

//               {commentsLoading && <p className="text-gray-400">Loading comments…</p>}
//               {commentsError && <p className="text-red-400">{commentsError}</p>}
//               {!commentsLoading && comments.length === 0 && (
//                 <p className="text-gray-500">No comments yet.</p>
//               )}

//               {comments.map((c) => (
//                 <div key={c.comment_id} className="flex mb-3 p-2 bg-gray-800 rounded">
//                   <CommentAvatar author={c.author} />
//                   <div className="flex-1">
//                     <p className="text-sm text-gray-100">
//                       <span className="font-semibold">{c.author.name}</span>{" "}
//                       <span className="text-xs text-gray-400">
//                         ({formatShortDate(c.created_time)}):
//                       </span>
//                     </p>
//                     <p className="text-sm text-gray-200 mt-1">{c.message}</p>
//                   </div>
//                 </div>
//               ))}

//               {commentsCursor && !commentsLoading && (
//                 <button
//                   onClick={async () => {
//                     setCommentsLoading(true);
//                     try {
//                       const u = new URL("/api/fetch_fb_comments", window.location.origin);
//                       u.searchParams.set("post_id", selectedPost.post_id);
//                       u.searchParams.set("after", commentsCursor);

//                       const res = await fetch(u);
//                       const data = await res.json();
//                       const more = data.results || [];
//                       const nextCursor = data.cursor || null;

//                       setComments((prev) => [...prev, ...more]);
//                       setCommentsCursor(nextCursor);
//                     } catch (err) {
//                       console.error(err);
//                       setCommentsError(err.message);
//                     } finally {
//                       setCommentsLoading(false);
//                     }
//                   }}
//                   className="mt-2 px-4 py-2 bg-[#14B8A6] text-white rounded-md hover:bg-[#0e7663]"
//                 >
//                   Load more comments
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// src/components/FbPosts.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getPostImageUrl } from "../lib/get_Post_Images";

function formatCount(value) {
  // Ensure we’re working with a number
  const num = Number(value);
  if (isNaN(num)) return value;

  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(num);
}

function CommentAvatar({ author }) {
  if (!author.picture) {
    console.warn(
      `CommentAvatar: no profile‐pic URL for author “${author.name || "Unknown"}” (ID: ${
        author.id || "n/a"
      }, URL: ${author.url || "n/a"})`
    );
  }
  const avatarUrl = author.picture || "/no-profile-pic-img.png";

  return (
    <img
      src={avatarUrl}
      alt={`${author.name || "User"}’s profile picture`}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0 mr-3"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/no-profile-pic-img.png";
      }}
    />
  );
}

/**
 * Helper: given a UNIX‐timestamp-in‐seconds, return "YYYY-MM-DD" local date string.
 */
function toLocalDateString(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function FbPosts({ profileId, totalPages = 12 }) {
  const POSTS_PER_PAGE = 3;

  // ─── pagination state ─────────────────────────────────────────────────
  const [pageCursors, setPageCursors] = useState({ 1: null });
  const [pageData, setPageData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(null);
  const [error, setError] = useState(null);

  // ─── modal / comments state ─────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showChildren, setShowChildren] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsCursor, setCommentsCursor] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  // ─── MULTI-KEYWORD SEARCH (for comments) ───────────────────────────────
  const [commentKeywordInput, setCommentKeywordInput] = useState("");
  const [commentKeywords, setCommentKeywords] = useState([]); // array of lowercase strings

  // ─── MULTI-KEYWORD SEARCH state (for posts) ─────────────────────────────
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]); // array of lowercase strings

  // ─── DATE FILTER state ───────────────────────────────────────────────────
  // Will hold a string "YYYY-MM-DD" or "" if none selected.
  const [selectedDate, setSelectedDate] = useState("");

  // Whenever profileId changes, reset pagination + filters
  useEffect(() => {
    if (!profileId) return;
    setPageCursors({ 1: null });
    setPageData({});
    setCurrentPage(1);
    setError(null);

    // Reset keyword & date filters for posts
    setKeywordInput("");
    setKeywords([]);
    setSelectedDate("");

    // Reset comment keyword filters
    setCommentKeywordInput("");
    setCommentKeywords([]);
  }, [profileId]);

  // Fetch posts for current page
  useEffect(() => {
    if (!pageData[currentPage] && loadingPage !== currentPage) {
      fetchPage(currentPage);
    }
  }, [currentPage, pageData, loadingPage]);

  async function fetchPage(pageNum) {
    if (pageData[pageNum] || loadingPage === pageNum) return;
    setLoadingPage(pageNum);
    setError(null);

    try {
      const cursor = pageCursors[pageNum] || null;
      const url = new URL("/api/fb_posts", window.location.origin);
      url.searchParams.set("profile_id", profileId);
      if (cursor) url.searchParams.set("cursor", cursor);
      url.searchParams.set("limit", POSTS_PER_PAGE);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch page ${pageNum}: ${res.statusText}`);
      const { results: pagePosts = [], cursor: nextCursor = null } = await res.json();

      setPageData((prev) => ({ ...prev, [pageNum]: pagePosts }));
      if (nextCursor) {
        setPageCursors((prev) => ({ ...prev, [pageNum + 1]: nextCursor }));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoadingPage(null);
    }
  }

  async function openModal(post) {
    setSelectedPost(post);
    setShowChildren(false);
    setShowModal(true);

    setComments([]);
    setCommentsCursor(null);
    setCommentsLoading(true);
    setCommentsError(null);

    // Clear comment‐keyword filters, so each post’s modal is fresh:
    setCommentKeywordInput("");
    setCommentKeywords([]);

    try {
      const url = new URL("/api/fetch_fb_comments", window.location.origin);
      url.searchParams.set("post_id", post.post_id);

      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);

      const data = await res.json();
      setComments(data.results || []);
      setCommentsCursor(data.cursor || null);
    } catch (err) {
      console.error(err);
      setCommentsError(err.message || "Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSelectedPost(null);
  }

  function firstBadLabel(labels = []) {
    return labels.find((l) => l !== "safe" && l !== "no_image" && l !== "analysis_error");
  }

  // ─── FILTER LOGIC FOR POSTS ─────────────────────────────────────────────
  const posts = pageData[currentPage] || [];

  // Return true if a given post matches the selected date (or if no date is selected).
  const matchesDate = (post) => {
    if (!selectedDate) return true;
    return toLocalDateString(post.timestamp) === selectedDate;
  };

  // Return true if a given post’s message contains at least one keyword (or if no keywords).
  const matchesKeyword = (post) => {
    if (keywords.length === 0) return true;
    const text = (post.message || "").toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  };

  // Final filtered list: must match both date and keyword filters
  const filteredPosts = posts.filter((post) => matchesDate(post) && matchesKeyword(post));

  // ─── POST KEYWORD INPUT HANDLERS ────────────────────────────────────────
  const addKeyword = useCallback(() => {
    const raw = keywordInput.trim().toLowerCase();
    if (raw === "") return;

    // Split on commas if user typed/pasted multiple (e.g. "foo, bar")
    const parts = raw.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
    setKeywords((prev) => {
      const next = [...prev];
      parts.forEach((p) => {
        if (p && !next.includes(p)) {
          next.push(p);
        }
      });
      return next;
    });
    setKeywordInput("");
  }, [keywordInput]);

  function handleKeywordKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    }
  }

  function handleKeywordChange(e) {
    setKeywordInput(e.target.value);
  }

  function removeKeyword(kwToRemove) {
    setKeywords((prev) => prev.filter((k) => k !== kwToRemove));
  }

  // ─── DATE INPUT HANDLER ─────────────────────────────────────────────────
  function handleDateChange(e) {
    setSelectedDate(e.target.value); // e.g. "2023-08-15" or "" if cleared
  }

  // ─── PAGINATION CONTROLS SETUP ────────────────────────────────────────────
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const block = 5;
  const firstBlock = pages.slice(0, block);
  const lastPage = pages[pages.length - 1];

  const formatShortDate = (unixSeconds) => {
    const d = new Date(unixSeconds * 1000);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  // ─── COMMENT KEYWORD HANDLERS ───────────────────────────────────────────
  const addCommentKeyword = useCallback(() => {
    const raw = commentKeywordInput.trim().toLowerCase();
    if (raw === "") return;

    // Split on commas if present
    const parts = raw.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
    setCommentKeywords((prev) => {
      const next = [...prev];
      parts.forEach((p) => {
        if (!next.includes(p)) next.push(p);
      });
      return next;
    });
    setCommentKeywordInput("");
  }, [commentKeywordInput]);

  function handleCommentKeywordKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCommentKeyword();
    }
  }

  function handleCommentKeywordChange(e) {
    setCommentKeywordInput(e.target.value);
  }

  function removeCommentKeyword(kwToRemove) {
    setCommentKeywords((prev) => prev.filter((k) => k !== kwToRemove));
  }

  // Filter comments by commentKeywords:
  const filteredComments = comments.filter((c) => {
    if (commentKeywords.length === 0) return true;
    const text = (c.message || "").toLowerCase();
    return commentKeywords.some((kw) => text.includes(kw));
  });

  return (
    <div className="space-y-4">
      {/* ─── FILTER BAR: POST KEYWORDS + DATE ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        {/* Post Keyword “tags” + input */}
        <div className="flex w-full gap-1 border border-teal-400 rounded-md px-2 py-1 bg-gray-800">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-sm px-4 py-[4px] text-md"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="ml-1 text-[10px] font-bold"
                aria-label={`Remove keyword ${kw}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            type="text"
            value={keywordInput}
            onChange={handleKeywordChange}
            onKeyDown={handleKeywordKeyDown}
            placeholder="Type a keyword and press Enter (or comma)…"
            className="flex-1 bg-transparent focus:outline-none text-gray-200 placeholder-gray-500 ml-1 py-1"
          />
        </div>

        {/* Date filter */}
        <div className="flex flex-col">
          <label htmlFor="date-filter" className="text-gray-200 -mt-7 text-base mb-1">
            Filter by Date:
          </label>
          <input
            id="date-filter"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="bg-gray-800 border border-teal-400 text-gray-200 text-base py-2 px-3 rounded-md focus:outline-none"
          />
        </div>
      </div>

      {/* ─── LOADING / ERROR MESSAGE FOR POSTS ─────────────────────────────── */}
      {loadingPage === currentPage && (
        <div className="flex justify-center items-center py-8">
          <span className="text-gray-400">Loading page {currentPage}…</span>
        </div>
      )}
      {error && (
        <div className="py-8 px-4 bg-red-900 rounded-md">
          <p className="text-red-200">Error: {error}</p>
        </div>
      )}

      {/* ─── POSTS TABLE ────────────────────────────────────────────────────── */}
      {!loadingPage && !error && (
        <div className="overflow-x-auto">
          <table className="table-auto w-full bg-gray-800 rounded-md overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                {[
                  "Image",
                  "Post / Title",
                  "Timestamp",
                  "Comments",
                  "Reactions",
                  "View Details",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-sm font-medium text-gray-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => {
                const date = new Date(post.timestamp * 1000).toLocaleString();
                const src = getPostImageUrl(post);
                const badLabel = firstBadLabel(post.labels);

                return (
                  <tr key={post.post_id} className="border-b border-gray-700">
                    {/* ─── IMAGE CELL ─────────────────────────────────────────── */}
                    <td className="px-4 py-2">
                      <div className="relative inline-block">
                        {src ? (
                          <img
                            src={src}
                            alt="post"
                            className="h-12 w-12 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-600 flex items-center justify-center rounded-md">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}

                        {badLabel && (
                          <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1 py-[2px] rounded-br-md">
                            {badLabel.replace("-", " ")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ─── MESSAGE / TITLE CELL ───────────────────────────────── */}
                    <td className="px-4 py-2 text-gray-100 text-sm whitespace-nowrap overflow-hidden truncate max-w-xs">
                      {post.message || "(No message)"}
                    </td>

                    {/* ─── TIMESTAMP CELL ─────────────────────────────────────── */}
                    <td className="px-4 py-2 text-gray-300 text-sm">{date}</td>

                    {/* ─── COMMENTS COUNT CELL ───────────────────────────────── */}
                    <td className="px-4 py-2 text-center text-gray-200 text-sm">
                      {formatCount(post.comments_count)}
                    </td>

                    {/* ─── REACTIONS COUNT CELL ───────────────────────────────── */}
                    <td className="px-4 py-2 text-center text-gray-200 text-sm">
                      {formatCount(post.reactions_count)}
                    </td>

                    {/* ─── VIEW DETAILS BUTTON CELL ───────────────────────────── */}
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => openModal(post)}>
                        <img src="/eye.png" alt="View" className="h-6 w-6" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* If no posts match the filters, show a “no results” row */}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No posts match those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── PAGINATION CONTROLS ─────────────────────────────────────────────── */}
      <div className="flex justify-center items-center space-x-1">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="w-8 h-8 flex items-center justify-center border border-gray-600 rounded-md text-gray-200 hover:bg-gray-700"
        >
          &lt;
        </button>
        {firstBlock.map((n) => (
          <button
            key={n}
            onClick={() => setCurrentPage(n)}
            className={`w-8 h-8 flex items-center justify-center border ${
              n === currentPage
                ? "bg-teal-500 border-teal-500 text-white"
                : "border-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
          >
            {n}
          </button>
        ))}
        <span className="px-1 text-gray-200">…</span>
        <button
          onClick={() => setCurrentPage(lastPage)}
          className={`w-8 h-8 flex items-center justify-center border ${
            lastPage === currentPage
              ? "bg-teal-500 border-teal-500 text-white"
              : "border-gray-600 text-gray-200 hover:bg-gray-700"
          }`}
        >
          {lastPage}
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
          className="w-8 h-8 flex items-center justify-center border border-gray-600 rounded-md text-gray-200 hover:bg-gray-700"
        >
          &gt;
        </button>
      </div>

      {/* ─── MODAL ────────────────────────────────────────────────────────────── */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1f2937] text-white p-4 md:p-6 rounded-md relative w-[90%] max-w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <p className="text-gray-400 text-sm mb-2">
                {new Date(selectedPost.timestamp * 1000).toLocaleString()}
              </p>
              <button
                onClick={closeModal}
                className="text-[16px] px-2 py-1 bg-[#000000] font-bold"
              >
                X
              </button>
            </div>

            {/* ─── POST MEDIA ────────────────────────────────────────────────── */}
            <div className="w-full h-[250px] mb-4 flex items-center justify-center relative">
              {selectedPost.video_files?.video_hd_file ||
              selectedPost.video_files?.video_sd_file ? (
                <video
                  src={
                    selectedPost.video_files.video_hd_file ||
                    selectedPost.video_files.video_sd_file
                  }
                  controls
                  className="h-full w-full object-contain rounded-md"
                />
              ) : (
                <img
                  src={getPostImageUrl(selectedPost)}
                  alt="Post media"
                  className="h-full w-full object-contain rounded-md"
                />
              )}
              {firstBadLabel(selectedPost.labels) && (
                <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1 py-[2px] rounded-br-md">
                  {firstBadLabel(selectedPost.labels).replace("-", " ")}
                </span>
              )}
            </div>

            <div className="text-[14px] mt-4 mb-2 text-gray-200">
              {selectedPost.message || "(No message)"}
            </div>

            {/* ─── CHILD POSTS (IF ANY) ─────────────────────────────────────── */}
            {selectedPost.album_preview?.length > 1 && (
              <button
                onClick={() => setShowChildren((c) => !c)}
                className="mb-4 px-4 py-2 bg-[#14B8A6] text-white rounded-md"
              >
                {showChildren ? "Hide Child Posts" : "View Child Posts"}
              </button>
            )}
            {showChildren && selectedPost.album_preview && (
              <div className="flex space-x-2 overflow-x-auto mb-4">
                {selectedPost.album_preview.map((item, idx) => (
                  <img
                    key={idx}
                    src={item.image_file_uri}
                    alt={`Child ${idx + 1}`}
                    className="flex-shrink-0 w-[90px] h-[90px] object-cover rounded-md"
                  />
                ))}
              </div>
            )}

            {/* ─── COMMENTS SECTION WITH MULTI-KEYWORD SEARCH ─────────────── */}
            <div>
              <h3 className="font-medium mb-2">Comments</h3>

              {/* Keyword “tags” + input (inside the modal) */}
              <div className="flex w-full gap-1 border border-teal-400 rounded-md px-2 py-1 bg-gray-800 mb-2">
                {commentKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-sm px-4 py-[4px] text-md"
                  >
                    {kw}
                    <button
                      onClick={() => removeCommentKeyword(kw)}
                      className="ml-1 text-[10px] font-bold"
                      aria-label={`Remove keyword ${kw}`}
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={commentKeywordInput}
                  onChange={handleCommentKeywordChange}
                  onKeyDown={handleCommentKeywordKeyDown}
                  placeholder="Type a comment‐keyword and press Enter (or comma)…"
                  className="flex-1 bg-transparent focus:outline-none text-gray-200 placeholder-gray-500 ml-1 py-1"
                />
              </div>

              {commentsLoading && <p className="text-gray-400">Loading comments…</p>}
              {commentsError && <p className="text-red-400">{commentsError}</p>}
              {!commentsLoading && filteredComments.length === 0 && (
                <p className="text-gray-500">No comments match those keywords.</p>
              )}

              {!commentsLoading &&
                filteredComments.map((c) => (
                  <div key={c.comment_id} className="flex mb-3 p-2 bg-gray-800 rounded">
                    <CommentAvatar author={c.author} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-100">
                        <span className="font-semibold">{c.author.name}</span>{" "}
                        <span className="text-xs text-gray-400">
                          ({formatShortDate(c.created_time)}):
                        </span>
                      </p>
                      <p className="text-sm text-gray-200 mt-1">{c.message}</p>
                    </div>
                  </div>
                ))}

              {commentsCursor && !commentsLoading && (
                <button
                  onClick={async () => {
                    setCommentsLoading(true);
                    try {
                      const u = new URL("/api/fetch_fb_comments", window.location.origin);
                      u.searchParams.set("post_id", selectedPost.post_id);
                      u.searchParams.set("after", commentsCursor);

                      const res = await fetch(u);
                      const data = await res.json();
                      const more = data.results || [];
                      const nextCursor = data.cursor || null;

                      setComments((prev) => [...prev, ...more]);
                      setCommentsCursor(nextCursor);
                    } catch (err) {
                      console.error(err);
                      setCommentsError(err.message);
                    } finally {
                      setCommentsLoading(false);
                    }
                  }}
                  className="mt-2 px-4 py-2 bg-[#14B8A6] text-white rounded-md hover:bg-[#0e7663]"
                >
                  Load more comments
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
