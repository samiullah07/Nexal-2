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



// src/components/FbPosts.jsx (current code correct multiple keyword)
// "use client";

// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useMemo,
// } from "react";
// import { getPostImageUrl } from "../lib/get_Post_Images";
// import { fetchCommentsBatch } from "../lib/api";

// function formatCount(value) {
//   const num = Number(value);
//   if (isNaN(num)) return value;
//   if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
//   if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
//   if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
//   return String(num);
// }

// function toLocalDateString(unixSeconds) {
//   const d = new Date(unixSeconds * 1000);
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
//     d.getDate()
//   ).padStart(2, "0")}`;
// }

// function CommentAvatar({ author }) {
//   const src = author.picture || "/no-profile-pic-img.png";
//   return (
//     <img
//       src={src}
//       alt={`${author.name || "User"}’s avatar`}
//       className="w-8 h-8 rounded-full object-cover mr-3"
//       onError={(e) => (e.currentTarget.src = "/no-profile-pic-img.png")}
//     />
//   );
// }

// export default function FbPosts({ profileId, totalPages = 1 }) {
//   const POSTS_PER_PAGE = 3;

//   // ─── Posts & Pagination
//   const [pageCursors, setPageCursors] = useState({ 1: null });
//   const [pageData, setPageData] = useState({});
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loadingPage, setLoadingPage] = useState(false);
//   const [error, setError] = useState(null);

//   // ─── Filters: posts
//   const [postKeywordInput, setPostKeywordInput] = useState("");
//   const [postKeywords, setPostKeywords] = useState([]);
//   const [selectedDate, setSelectedDate] = useState("");

//   // ─── Comments batch cache
//   const [commentsByPost, setCommentsByPost] = useState({});

//   // ─── Filters: comments (main view)
//   const [commentKeywordInput, setCommentKeywordInput] = useState("");
//   const [commentKeywords, setCommentKeywords] = useState([]);

//   // ─── Modal
//   const [showModal, setShowModal] = useState(false);
//   const [selectedPost, setSelectedPost] = useState(null);

//   // Reset when profileId changes
//   useEffect(() => {
//     if (!profileId) return;
//     setPageCursors({ 1: null });
//     setPageData({});
//     setCurrentPage(1);
//     setError(null);
//     setPostKeywordInput("");
//     setPostKeywords([]);
//     setSelectedDate("");
//     setCommentsByPost({});
//     setCommentKeywordInput("");
//     setCommentKeywords([]);
//     setShowModal(false);
//     setSelectedPost(null);
//   }, [profileId]);

//   // Fetch posts page
//   useEffect(() => {
//     if (pageData[currentPage] || loadingPage) return;
//     (async () => {
//       setLoadingPage(true);
//       try {
//         const cursor = pageCursors[currentPage];
//         const url = new URL("/api/fb_posts", window.location.origin);
//         url.searchParams.set("profile_id", profileId);
//         url.searchParams.set("limit", POSTS_PER_PAGE);
//         if (cursor) url.searchParams.set("cursor", cursor);

//         const res = await fetch(url);
//         if (!res.ok) throw new Error(res.statusText);
//         const { results, cursor: nextCursor } = await res.json();

//         setPageData((pd) => ({ ...pd, [currentPage]: results }));
//         if (nextCursor) {
//           setPageCursors((pc) => ({ ...pc, [currentPage + 1]: nextCursor }));
//         }
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoadingPage(false);
//       }
//     })();
//   }, [currentPage, pageData, loadingPage, profileId]);

//   // Batch-fetch comments for current page
//   useEffect(() => {
//     const posts = pageData[currentPage] || [];
//     const missing = posts.map((p) => p.post_id).filter((id) => !commentsByPost[id]);
//     if (!missing.length) return;
//     fetchCommentsBatch(missing)
//       .then((batch) => setCommentsByPost((c) => ({ ...c, ...batch })))
//       .catch(console.error);
//   }, [pageData, currentPage, commentsByPost]);

//   // ─── Open/Close Modal
//   const openModal = (post) => {
//     setSelectedPost(post);
//     setShowModal(true);
//   };
//   const closeModal = () => {
//     setShowModal(false);
//     setSelectedPost(null);
//   };

//   // ─── Filtered posts
//   const filteredPosts = useMemo(() => {
//     const posts = pageData[currentPage] || [];
//     return posts.filter((post) => {
//       const text = (post.message || "").toLowerCase();
//       const kwMatch =
//         postKeywords.length === 0 ||
//         postKeywords.some((kw) => text.includes(kw));
//       const dateMatch =
//         !selectedDate ||
//         toLocalDateString(post.timestamp) === selectedDate;
//       return kwMatch && dateMatch;
//     });
//   }, [pageData, currentPage, postKeywords, selectedDate]);

//   // ─── Flatten all comments on this page & filter
//   const allPageComments = useMemo(() => {
//     return (pageData[currentPage] || []).flatMap((p) => commentsByPost[p.post_id] || []);
//   }, [pageData, currentPage, commentsByPost]);

//   const filteredComments = useMemo(() => {
//     if (commentKeywords.length === 0) return [];
//     return allPageComments.filter((c) =>
//       commentKeywords.some((kw) =>
//         (c.message || "").toLowerCase().includes(kw)
//       )
//     );
//   }, [allPageComments, commentKeywords]);

//   // ─── Handlers: post keywords
//   const addPostKeyword = useCallback(() => {
//     const raw = postKeywordInput.trim().toLowerCase();
//     if (!raw) return;
//     raw
//       .split(",")
//       .map((p) => p.trim())
//       .filter(Boolean)
//       .forEach((p) =>
//         setPostKeywords((prev) => (prev.includes(p) ? prev : [...prev, p]))
//       );
//     setPostKeywordInput("");
//   }, [postKeywordInput]);

//   const handlePostInputChange = (e) => setPostKeywordInput(e.target.value);
//   const handlePostInputKey = (e) => {
//     if (e.key === "Enter" || e.key === ",") {
//       e.preventDefault();
//       addPostKeyword();
//     }
//   };
//   const removePostKeyword = (kw) =>
//     setPostKeywords((prev) => prev.filter((p) => p !== kw));

//   // ─── Handlers: comment keywords
//   const addCommentKeyword = useCallback(() => {
//     const raw = commentKeywordInput.trim().toLowerCase();
//     if (!raw) return;
//     raw
//       .split(",")
//       .map((p) => p.trim())
//       .filter(Boolean)
//       .forEach((p) =>
//         setCommentKeywords((prev) => (prev.includes(p) ? prev : [...prev, p]))
//       );
//     setCommentKeywordInput("");
//   }, [commentKeywordInput]);

//   const handleCommentInputChange = (e) => setCommentKeywordInput(e.target.value);
//   const handleCommentInputKey = (e) => {
//     if (e.key === "Enter" || e.key === ",") {
//       e.preventDefault();
//       addCommentKeyword();
//     }
//   };
//   const removeCommentKeyword = (kw) =>
//     setCommentKeywords((prev) => prev.filter((c) => c !== kw));

//   // ─── Pagination metadata
//   const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
//   const FIRST = pages.slice(0, 5);
//   const LAST = pages[pages.length - 1];

//   // ─── Render
//   return (
//     <div className="space-y-4">
//       {/* ─── FILTER BAR (posts + comments) */}
//       <div className="grid grid-cols-2 gap-4">
//         {/* Posts */}
//         <div className="flex gap-2 border border-teal-400 rounded-md px-2 py-1 bg-gray-800">
//           {postKeywords.map((kw) => (
//             <span
//               key={kw}
//               className="flex items-center bg-teal-500 text-white px-3 py-1 rounded-sm"
//             >
//               {kw}{" "}
//               <button onClick={() => removePostKeyword(kw)} className="ml-1">
//                 ×
//               </button>
//             </span>
//           ))}
//           <input
//             className="flex-1 bg-transparent placeholder-gray-500 text-gray-200 focus:outline-none"
//             placeholder="Type post keyword and Enter…"
//             value={postKeywordInput}
//             onChange={handlePostInputChange}
//             onKeyDown={handlePostInputKey}
//           />
//         </div>
//         {/* Comments */}
//         <div className="flex gap-2 border border-blue-500 rounded-md px-2 py-1 bg-gray-800">
//           {commentKeywords.map((kw) => (
//             <span
//               key={kw}
//               className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-sm"
//             >
//               {kw}{" "}
//               <button onClick={() => removeCommentKeyword(kw)} className="ml-1">
//                 ×
//               </button>
//             </span>
//           ))}
//           <input
//             className="flex-1 bg-transparent placeholder-gray-500 text-gray-200 focus:outline-none"
//             placeholder="Type comment keyword and Enter…"
//             value={commentKeywordInput}
//             onChange={handleCommentInputChange}
//             onKeyDown={handleCommentInputKey}
//           />
//         </div>
//       </div>

//       {/* Date filter (posts only) */}
//       <div className="flex justify-end">
//         <input
//           type="date"
//           className="bg-gray-800 border border-teal-400 text-gray-200 px-3 py-2 rounded-md"
//           value={selectedDate}
//           onChange={(e) => setSelectedDate(e.target.value)}
//         />
//       </div>

//       {/* ─── MAIN TABLE */}
//       {commentKeywords.length > 0 ? (
//         // → show comments results
//         <div className="overflow-x-auto">
//           <h2 className="text-lg text-gray-200 mb-2">
//             Comment Search Results
//           </h2>
//           <table className="table-auto w-full bg-gray-800 rounded-md">
//             <thead className="bg-gray-700">
//               <tr>
//                 <th className="px-4 py-2 text-gray-200">Author</th>
//                 <th className="px-4 py-2 text-gray-200">Comment</th>
//                 <th className="px-4 py-2 text-gray-200">Date</th>
//                 <th className="px-4 py-2 text-gray-200">View</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredComments.map((c) => (
//                 <tr key={c.comment_id} className="border-b border-gray-700">
//                   <td className="px-4 py-2 text-gray-100">{c.author.name}</td>
//                   <td className="px-4 py-2 text-gray-200">{c.message}</td>
//                   <td className="px-4 py-2 text-gray-300 text-sm">
//                     {new Date(c.created_time * 1000).toLocaleString()}
//                   </td>
//                   <td className="px-4 py-2 text-center">
//                     {/* reopen modal on parent post */}
//                     <button
//                       onClick={() =>
//                         openModal(
//                           pageData[currentPage].find(
//                             (p) => p.post_id === c.post_id
//                           )
//                         )
//                       }
//                     >
//                       <img
//                         src="/eye.png"
//                         alt="View post"
//                         className="h-5 w-5"
//                       />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {filteredComments.length === 0 && (
//                 <tr>
//                   <td
//                     colSpan={4}
//                     className="py-6 text-center text-gray-400"
//                   >
//                     No comments match those keywords.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         // → show filtered posts
//         <>
//           {loadingPage ? (
//             <p className="py-8 text-center text-gray-400">
//               Loading page {currentPage}…
//             </p>
//           ) : error ? (
//             <p className="py-4 bg-red-900 text-red-200 text-center">
//               Error: {error}
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="table-auto w-full bg-gray-800 rounded-md">
//                 <thead className="bg-gray-700">
//                   <tr>
//                     {[
//                       "Image",
//                       "Post / Title",
//                       "Date",
//                       "Comments",
//                       "Reactions",
//                       "View",
//                     ].map((h) => (
//                       <th
//                         key={h}
//                         className="px-4 py-2 text-left text-gray-200"
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredPosts.map((post) => (
//                     <tr
//                       key={post.post_id}
//                       className="border-b border-gray-700"
//                     >
//                       <td className="px-4 py-2">
//                         {getPostImageUrl(post) ? (
//                           <img
//                             src={getPostImageUrl(post)}
//                             alt="post"
//                             className="h-12 w-12 rounded-md object-cover"
//                           />
//                         ) : (
//                           <div className="h-12 w-12 bg-gray-600 rounded-md flex items-center justify-center">
//                             <span className="text-gray-400 text-xs">
//                               No Image
//                             </span>
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-4 py-2 text-gray-100 truncate max-w-xs">
//                         {post.message || "(No message)"}
//                       </td>
//                       <td className="px-4 py-2 text-gray-300 text-sm">
//                         {new Date(post.timestamp * 1000).toLocaleString()}
//                       </td>
//                       <td className="px-4 py-2 text-center text-gray-200">
//                         {formatCount(post.comments_count)}
//                       </td>
//                       <td className="px-4 py-2 text-center text-gray-200">
//                         {formatCount(post.reactions_count)}
//                       </td>
//                       <td className="px-4 py-2 text-center">
//                         <button onClick={() => openModal(post)}>
//                           <img
//                             src="/eye.png"
//                             alt="View"
//                             className="h-6 w-6"
//                           />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                   {filteredPosts.length === 0 && (
//                     <tr>
//                       <td
//                         colSpan={6}
//                         className="py-6 text-center text-gray-400"
//                       >
//                         No posts match those filters.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* pagination */}
//           <div className="flex justify-center space-x-1">
//             <button
//               onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//               className="px-3 py-1 border border-gray-600 text-gray-200 rounded-md"
//             >
//               ←
//             </button>
//             {FIRST.map((n) => (
//               <button
//                 key={n}
//                 onClick={() => setCurrentPage(n)}
//                 className={`px-3 py-1 border rounded-md ${
//                   n === currentPage
//                     ? "bg-teal-500 text-white border-teal-500"
//                     : "border-gray-600 text-gray-200"
//                 }`}
//               >
//                 {n}
//               </button>
//             ))}
//             <span className="text-gray-200">…</span>
//             <button
//               onClick={() => setCurrentPage(LAST)}
//               className={`px-3 py-1 border rounded-md ${
//                 LAST === currentPage
//                   ? "bg-teal-500 text-white border-teal-500"
//                   : "border-gray-600 text-gray-200"
//               }`}
//             >
//               {LAST}
//             </button>
//             <button
//               onClick={() => setCurrentPage((p) => Math.min(LAST, p + 1))}
//               className="px-3 py-1 border border-gray-600 text-gray-200 rounded-md"
//             >
//               →
//             </button>
//           </div>
//         </>
//       )}

//       {/* ─── Modal for viewing a single post’s comments */}
//       {showModal && selectedPost && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-gray-800 text-white rounded-md p-6 max-w-lg w-[90%] max-h-[80vh] overflow-y-auto">
//             <div className="flex justify-between mb-4">
//               <span className="text-gray-400 text-sm">
//                 {new Date(selectedPost.timestamp * 1000).toLocaleString()}
//               </span>
//               <button onClick={closeModal} className="text-xl font-bold">
//                 ×
//               </button>
//             </div>
//             {(commentsByPost[selectedPost.post_id] || []).map((c) => (
//               <div
//                 key={c.comment_id}
//                 className="flex mb-3 p-2 bg-gray-700 rounded"
//               >
//                 <CommentAvatar author={c.author} />
//                 <div className="flex-1">
//                   <p className="text-sm text-gray-100">
//                     <span className="font-semibold">{c.author.name}</span>{" "}
//                     <span className="text-xs text-gray-400">
//                       ({new Date(c.created_time * 1000).toLocaleDateString()}
//                       ):
//                     </span>
//                   </p>
//                   <p className="text-sm mt-1 text-gray-200">{c.message}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// src/components/FbPosts.jsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { getPostImageUrl } from "../lib/get_Post_Images";
import { fetchCommentsBatch } from "../lib/api";

function formatCount(value) {
  const num = Number(value);
  if (isNaN(num)) return value;
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
}

function toLocalDateString(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function CommentAvatar({ author }) {
  const src = author.picture || "/no-profile-pic-img.png";
  return (
    <img
      src={src}
      alt={`${author.name || "User"}’s avatar`}
      className="w-8 h-8 rounded-full object-cover mr-3"
      onError={(e) => (e.currentTarget.src = "/no-profile-pic-img.png")}
    />
  );
}

export default function FbPosts({ profileId, totalPages = 12 }) {
  const POSTS_PER_PAGE = 3;

  // ─── POSTS & PAGINATION ────────────────────────────────────────────────
  const [pageCursors, setPageCursors] = useState({ 1: null });
  const [pageData, setPageData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState(null);

  // ─── POST FILTERS ───────────────────────────────────────────────────────
  const [postKeywordInput, setPostKeywordInput] = useState("");
  const [postKeywords, setPostKeywords] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // ─── COMMENTS BATCH CACHE FOR THIS PAGE ────────────────────────────────
  const [commentsByPost, setCommentsByPost] = useState({});

  // ─── COMMENT SEARCH BOX (MAIN VIEW) ────────────────────────────────────
  const [commentKeywordInput, setCommentKeywordInput] = useState("");
  const [commentKeywords, setCommentKeywords] = useState([]);

  // ─── MODAL STATE ───────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Reset when profileId changes
  useEffect(() => {
    setPageCursors({ 1: null });
    setPageData({});
    setCurrentPage(1);
    setError(null);
    setPostKeywordInput("");
    setPostKeywords([]);
    setSelectedDate("");
    setCommentsByPost({});
    setCommentKeywordInput("");
    setCommentKeywords([]);
    setShowModal(false);
    setSelectedPost(null);
  }, [profileId]);

  // Fetch posts for current page
  useEffect(() => {
    if (pageData[currentPage] || loadingPage) return;
    (async () => {
      setLoadingPage(true);
      setError(null);
      try {
        const cursor = pageCursors[currentPage];
        const url = new URL("/api/fb_posts", window.location.origin);
        url.searchParams.set("profile_id", profileId);
        url.searchParams.set("limit", POSTS_PER_PAGE);
        if (cursor) url.searchParams.set("cursor", cursor);

        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        const { results, cursor: nextCursor } = await res.json();

        setPageData((pd) => ({ ...pd, [currentPage]: results }));
        if (nextCursor) {
          setPageCursors((pc) => ({ ...pc, [currentPage + 1]: nextCursor }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPage(false);
      }
    })();
  }, [currentPage, pageData, loadingPage, profileId]);

//   // Batch-fetch comments for all posts on this page
//   useEffect(() => {
//     const posts = pageData[currentPage] || [];
//     const missing = posts.map((p) => p.post_id).filter((id) => !commentsByPost[id]);
//     if (!missing.length) return;
//     console.time(`batchComments page#${currentPage}`);
//     fetchCommentsBatch(missing)
//     .then((batch) => {
//       console.timeEnd(`batchComments page#${currentPage}`);
//       setCommentsByPost((c) => ({ ...c, ...batch }));
//     })
//     .catch((err) => {
//       console.timeEnd(`batchComments page#${currentPage}`);
//       console.error(err);
//     });
// }, [pageData, currentPage, commentsByPost]);

// ─── COMMENTS BATCH CACHE FOR THIS PAGE (UPDATED) ────────────────────────
useEffect(() => {
  const posts = pageData[currentPage] || [];
  const missing = posts.map((p) => p.post_id).filter((id) => !commentsByPost[id]);
  if (!missing.length) return;

  // console.time(`batchComments page#${currentPage}`);
  fetchCommentsBatch(missing)
    .then(async (batch) => {
      // console.timeEnd(`batchComments page#${currentPage}`);
      // 1) Merge the ones we got
      setCommentsByPost((c) => ({ ...c, ...batch }));

      // 2) Detect which IDs still missing (batch[id] might be undefined on 429)
      const stillMissing = missing.filter((id) => !batch[id] || batch[id].length === 0);
      // 3) For each one, fall back to per-post fetch with slight delay
      for (let i = 0; i < stillMissing.length; i++) {
        const postId = stillMissing[i];
        // stagger by 500ms each
        await new Promise((r) => setTimeout(r, 500));
        try {
          // console.log(`⏳ retrying single fetch for post ${postId}`);
          const res = await fetch(`/api/fetch_fb_comments?post_id=${postId}`);
          if (!res.ok) throw new Error(res.status);
          const data = await res.json();
          setCommentsByPost((c) => ({ ...c, [postId]: data.results || [] }));
          // console.log(`✅ loaded fallback comments for ${postId}`);
        } catch (err) {
          // console.warn(`⚠️ fallback fetch failed for ${postId}:`, err);
          setCommentsByPost((c) => ({ ...c, [postId]: [] })); // avoid trying again
        }
      }
    })
    .catch((err) => {
      // console.timeEnd(`batchComments page#${currentPage}`);
      // console.error("Batch fetch failed entirely:", err);
      // as a last-ditch, individually fetch all with delays
      missing.forEach((postId, idx) => {
        setTimeout(async () => {
          try {
            // console.log(`⏳ fallback individual fetch for ${postId}`);
            const res = await fetch(`/api/fetch_fb_comments?post_id=${postId}`);
            const data = await res.json();
            setCommentsByPost((c) => ({ ...c, [postId]: data.results || [] }));
          } catch (e) {
            // console.warn(`⚠️ fallback indiv failed for ${postId}`, e);
            setCommentsByPost((c) => ({ ...c, [postId]: [] }));
          }
        }, idx * 500);
      });
    });
}, [pageData, currentPage, commentsByPost]);



  // Open / close modal
  // const openModal = (post) => {
  //   setSelectedPost(post);
  //   setShowModal(true);
  // };

  // Open / close modal, and ensure comments for that post are loaded
 const openModal = async (post) => {
   setSelectedPost(post);
   // if we haven't yet fetched comments for this post, do it now
   if (!commentsByPost[post.post_id]) {
      console.time(`modalComments post#${post.post_id}`);
     try {
       const batch = await fetchCommentsBatch([post.post_id]);
       console.timeEnd(`modalComments post#${post.post_id}`);
       setCommentsByPost((c) => ({ ...c, ...batch }));
     } catch (err) {
       console.timeEnd(`modalComments post#${post.post_id}`);
       console.error("Failed to load comments for post", post.post_id, err);
     }
   }
   setShowModal(true);
 };
  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
  };

  // ─── FILTERED POSTS ─────────────────────────────────────────────────────
  const filteredPosts = useMemo(() => {
    const posts = pageData[currentPage] || [];
    return posts.filter((post) => {
      const text = (post.message || "").toLowerCase();
      const kwMatch =
        postKeywords.length === 0 ||
        postKeywords.some((kw) => text.includes(kw));
      const dateMatch =
        !selectedDate || toLocalDateString(post.timestamp) === selectedDate;
      return kwMatch && dateMatch;
    });
  }, [pageData, currentPage, postKeywords, selectedDate]);

  // ─── FLATTEN & FILTER COMMENTS FOR CURRENT PAGE ─────────────────────────
  const allPageComments = useMemo(() => {
    return (pageData[currentPage] || []).flatMap((p) => commentsByPost[p.post_id] || []);
  }, [pageData, currentPage, commentsByPost]);

  const filteredComments = useMemo(() => {
    if (!commentKeywords.length) return [];
    return allPageComments.filter((c) =>
      commentKeywords.some((kw) =>
        (c.message || "").toLowerCase().includes(kw)
      )
    );
  }, [allPageComments, commentKeywords]);

  // ─── POST KEYWORD HANDLERS ──────────────────────────────────────────────
  const addPostKeyword = useCallback(() => {
    const raw = postKeywordInput.trim().toLowerCase();
    if (!raw) return;
    raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) =>
        setPostKeywords((prev) => (prev.includes(p) ? prev : [...prev, p]))
      );
    setPostKeywordInput("");
  }, [postKeywordInput]);

  const handlePostInputChange = (e) => setPostKeywordInput(e.target.value);
  const handlePostInputKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addPostKeyword();
    }
  };
  const removePostKeyword = (kw) =>
    setPostKeywords((prev) => prev.filter((p) => p !== kw));

  // ─── COMMENT KEYWORD HANDLERS ───────────────────────────────────────────
  const addCommentKeyword = useCallback(() => {
    const raw = commentKeywordInput.trim().toLowerCase();
    if (!raw) return;
    raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) =>
        setCommentKeywords((prev) => (prev.includes(p) ? prev : [...prev, p]))
      );
    setCommentKeywordInput("");
  }, [commentKeywordInput]);

  const handleCommentInputChange = (e) => setCommentKeywordInput(e.target.value);
  const handleCommentInputKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCommentKeyword();
    }
  };
  const removeCommentKeyword = (kw) =>
    setCommentKeywords((prev) => prev.filter((c) => c !== kw));

  // ─── PAGINATION METADATA ────────────────────────────────────────────────
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const FIRST = pages.slice(0, 5);
  const LAST = pages[pages.length - 1];

  return (
    <div className="space-y-4">
      {/* ─── FILTER BAR (posts + comments) */}
      <div className="grid grid-cols-3 gap-4">
        {/* Post keywords */}
        <div className="flex gap-2 border border-teal-400 rounded-md px-2 py-1 bg-gray-800 col-span-2">
          {postKeywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center bg-teal-500 text-white px-3 py-1 rounded-sm"
            >
              {kw} <button onClick={() => removePostKeyword(kw)} className="ml-1">×</button>
            </span>
          ))}
          <input
            className="flex-1 bg-transparent placeholder-gray-500 text-gray-200 focus:outline-none"
            placeholder="Type post keyword and press Enter…"
            value={postKeywordInput}
            onChange={handlePostInputChange}
            onKeyDown={handlePostInputKey}
          />
        </div>
        {/* Comment keywords */}
        
        <div className="flex gap-2 border border-blue-500 rounded-md px-2 py-1 bg-gray-800">
          {commentKeywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-sm"
            >
              {kw} <button onClick={() => removeCommentKeyword(kw)} className="ml-1">×</button>
            </span>
          ))}
          <input
            className="flex-1 bg-transparent placeholder-gray-500 text-gray-200 focus:outline-none"
            placeholder="Type comment keyword and press Enter…"
            value={commentKeywordInput}
            onChange={handleCommentInputChange}
            onKeyDown={handleCommentInputKey}
          />
        </div>
      </div>

      {/* Date filter (posts only) */}
      <div className="flex justify-end">
        <h2 className="text-[18px] mt-2 mr-2 text-white">Filter By Date</h2>
        <input
          type="date"
          className="bg-gray-800 border border-teal-400 text-gray-200 px-3 py-2 rounded-md"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* ─── MAIN TABLE: comments OR posts? */}
      {commentKeywords.length > 0 ? (
        // → show comments for this page
        <div className="overflow-x-auto">
          <h2 className="text-lg text-gray-200 mb-2">Comment Search Results</h2>
          <table className="table-auto w-full bg-gray-800 rounded-md">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-gray-200">Image</th>
                <th className="px-4 py-2 text-gray-200">Author</th>
                <th className="px-4 py-2 text-gray-200">Comment</th>
                <th className="px-4 py-2 text-gray-200">Date</th>
                {/* <th className="px-4 py-2 text-gray-200">View Post</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredComments.map((c) => (
                <tr key={c.comment_id} className="border-b border-gray-700">
                   <td className="px-4 py-2">
                    <CommentAvatar author={c.author} />
                  </td>
                  <td className="px-4 py-2 text-gray-100">{c.author.name}</td>
                  <td className="px-4 py-2 text-gray-200">{c.message}</td>
                  <td className="px-4 py-2 text-gray-300">{new Date(c.created_time * 1000).toLocaleString()}</td>
                  {/* <td className="px-4 py-2 text-center">
                    <button onClick={() => openModal((pageData[currentPage]||[]).find(p => p.post_id===c.post_id))}>
                      <img src="/eye.png" alt="View" className="h-5 w-5"/>
                    </button>
                  </td> */}
                </tr>
              ))}
              {filteredComments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    No comments match those keywords.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // → show posts with pagination
        <>
          {loadingPage ? (
            <div className="py-8 text-center text-gray-400">
              Loading page {currentPage}…
            </div>
          ) : error ? (
            <div className="py-4 bg-red-900 text-red-200 text-center">
              Error: {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full bg-gray-800 rounded-md">
                <thead className="bg-gray-700">
                  <tr>
                    {["Image", "Post / Title", "Date", "Comments", "Reactions", "View"].map(h => (
                      <th key={h} className="px-4 py-2 text-gray-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map(post => (
                    <tr key={post.post_id} className="border-b border-gray-700">
                      <td className="px-4 py-2">
                        {getPostImageUrl(post) ? (
                          <img src={getPostImageUrl(post)} alt="" className="h-12 w-12 object-cover rounded-md"/>
                        ) : (
                          <div className="h-12 w-12 bg-gray-600 flex items-center justify-center rounded-md">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-100 truncate max-w-xs">{post.message||"(No message)"}</td>
                      <td className="px-4 py-2 text-gray-300">{new Date(post.timestamp*1000).toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-200 text-center">{formatCount(post.comments_count)}</td>
                      <td className="px-4 py-2 text-gray-200 text-center">{formatCount(post.reactions_count)}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => openModal(post)}>
                          <img src="/eye.png" alt="View" className="h-6 w-6"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPosts.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-400">No posts match those filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          <div className="flex justify-center items-center space-x-2 pt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p-1))}
              className="px-3 py-1 border border-gray-600 rounded-md text-gray-200"
            >←</button>
            {FIRST.map(n => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`px-3 py-1 border rounded-md ${n===currentPage?"bg-teal-500 text-white":"border-gray-600 text-gray-200"}`}
              >{n}</button>
            ))}
            <span className="text-gray-200">…</span>
            <button
              onClick={() => setCurrentPage(LAST)}
              className={`px-3 py-1 border rounded-md ${LAST===currentPage?"bg-teal-500 text-white":"border-gray-600 text-gray-200"}`}
            >{LAST}</button>
            <button
              onClick={() => setCurrentPage(p => Math.min(LAST, p+1))}
              className="px-3 py-1 border border-gray-600 rounded-md text-gray-200"
            >→</button>
          </div>
        </>
      )}

      {/* ─── COMMENTS MODAL ─────────────────────────────────────────────────── */}
      {/* {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-md p-6 max-w-lg w-[90%] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <span className="text-gray-400">
                {new Date(selectedPost.timestamp*1000).toLocaleString()}
              </span>
              <button onClick={closeModal} className="text-xl font-bold">×</button>
            </div>
            {(commentsByPost[selectedPost.post_id]||[]).map(c => (
              <div key={c.comment_id} className="flex mb-3 p-2 bg-gray-700 rounded">
                <CommentAvatar author={c.author}/>
                <div className="flex-1">
                  <p className="text-sm text-gray-100">
                    <span className="font-semibold">{c.author.name}</span>{" "}
                    <span className="text-xs text-gray-400">({new Date(c.created_time*1000).toLocaleDateString()}):</span>
                  </p>
                  <p className="text-sm mt-1 text-gray-200">{c.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* ─── COMMENTS MODAL WITH POST DETAILS ───────────────────────────────── */}
{showModal && selectedPost && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-800 text-white rounded-md p-6 max-w-lg w-[90%] max-h-[80vh] overflow-y-auto">
      {/* 1) HEADER: date and bio */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">
            {new Date(selectedPost.timestamp * 1000).toLocaleString()}
          </span>
          <button onClick={closeModal} className="text-xl font-bold">
            ×
          </button>
        </div>
      </div>

      {/* 2) MEDIA: video or image */}
      <div className="w-full h-[300px] mb-4 flex items-center justify-center bg-black rounded-md overflow-hidden">
        {selectedPost.video_files?.video_hd_file || selectedPost.video_files?.video_sd_file ? (
          <video
            src={selectedPost.video_files.video_hd_file || selectedPost.video_files.video_sd_file}
            controls
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={getPostImageUrl(selectedPost)}
            alt="Post media"
            className="h-full w-full object-contain"
          />
        )}
      </div>

              <p className="mt-2 text-gray-200">{selectedPost.message || "(No message)"}</p>


      {/* 3) COMMENTS */}
      <div>
        <h3 className="font-medium text-lg mb-3">Comments</h3>
        { (commentsByPost[selectedPost.post_id] || []).length === 0 ? (
          <p className="text-gray-500">No comments yet.</p>
        ) : (
          (commentsByPost[selectedPost.post_id] || []).map((c) => (
            <div key={c.comment_id} className="flex mb-3 p-2 bg-gray-700 rounded">
              <CommentAvatar author={c.author} />
              <div className="flex-1">
                <p className="text-sm text-gray-100">
                  <span className="font-semibold">{c.author.name}</span>{" "}
                  <span className="text-xs text-gray-400">
                    ({new Date(c.created_time * 1000).toLocaleDateString()}):
                  </span>
                </p>
                <p className="text-sm text-gray-200 mt-1">{c.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

    </div>
  );
}
