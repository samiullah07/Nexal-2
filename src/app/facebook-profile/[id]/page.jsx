// src/app/facebook-profile/[id]/page.jsx
import Navbar from "@/components/Navbar";
import FbPosts from "@/components/FbPosts";
import UserDetailFB from "@/components/UserDetailFB";
import Image from "next/image";
import RiskScoreCard from "@/components/RiskScoreCard";
import FbRelationCard from "@/components/fb_Relation_Card";   
import Fb_InterestsCard from "@/components/Fb_InterestsCard";

import ExportToPdfButton from "@/components/ExportToPdfButton"; // ← our new component


import { 
  GlobeAltIcon, 
  PhoneIcon 
} from "@heroicons/react/24/outline";


// A helper that runs on the server to fetch Facebook profile details for “location”
async function fetchFacebookProfile(profileId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/facebookSearch?username=${profileId}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    console.error("Failed to fetch fb profile for location:", await res.text());
    return null;
  }
  return res.json();
}

// ── 2) Fetch raw posts from your fb_posts API ──────────────────────────────
// We expect each post to have a `timestamp` field (integer, Unix seconds).
async function fetchFacebookPosts(profileId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/fb_posts?username=${profileId}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    console.error("Failed to fetch fb posts:", await res.text());
    return [];
  }
  const json = await res.json();
  // `json.results` should be an array of objects with at least { post_id, timestamp, ... }.
  return Array.isArray(json.results) ? json.results : [];
}


function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  if (diffMs < 0) return "in the future";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/**
 * Format a JavaScript Date (or ISO‐string) into "MM/DD/YYYY".
 */
function formatCalendarDate(isoString) {
  try {
    const d = new Date(isoString);
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return "";
  }
}

export default async function ProfilePage({ params }) {
  const { id } = params; // numeric Facebook profile_id

  // 1) Fetch profile details server‐side so we can extract “location”
  let locationText = "Unknown";
  try {
    const profileData = await fetchFacebookProfile(id);
    const aboutPublic = profileData?.about_public || [];
    // Find first `item.text` that looks like “City, State…”
    const found = aboutPublic.find((item) => /,/.test(item.text));
    if (found) {
      locationText = found.text;
    }
  } catch (e) {
    console.error(e);
    locationText = "Unknown";
  }

    // Determine if we have a “real” location or must fall back:
  const hasRealLocation = locationText && locationText !== "Unknown";
  
// ─── 2) Fetch raw posts & pick out the “latest” one ───
  const allPosts = await fetchFacebookPosts(id);
  // If your API returns *unordered* results, sort them by created_time descending:
  allPosts.sort((a, b) => {
    const ta = typeof a.timestamp === "number" ? a.timestamp : 0;
    const tb = typeof b.timestamp === "number" ? b.timestamp : 0;
    return tb - ta;
  });

  // Grab the first item as “most recent”
  const latestPost = allPosts.length > 0 ? allPosts[0] : null;
 const latestISO = latestPost
    ? new Date(latestPost.timestamp * 1000).toISOString()
    : null;

  const relativeText = latestISO
    ? formatRelativeTime(latestISO)
    : "No posts";

  const calendarDateText = latestISO
    ? formatCalendarDate(latestISO)
    : "";


  return (
    <div className="bg-[#111827] min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-5">
        {/* ─── NAVBAR ───────── */}
        <Navbar />


        {/* ─── Export Button (fixed) ───────────────────────────────── */}
        {/* <ExportToPdfButton
          containerId="profile-pdf-container"
          fileName={`profile-${id}`}
        /> */}

          <div className="absolute top-4 right-4 z-10 mt-40 mr-28">
            <ExportToPdfButton
              containerId="profile-pdf-container"
              fileName={`profile-${id}`}
            />
          </div>


           <div id="profile-pdf-container" className="bg-[#111827] transition-colors duration-200">
        {/* ─── USER DETAILS CARD (profile picture, name, bio) ───────────────────── */}
        <div className="pt-44 pb-8">
          <UserDetailFB profileId={id} />
        </div>

        {/* ─── STATS CARDS ─────────────────────────────────────────────────────── */}
        <div className="px-5 md:px-0 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-7 mx-6 mt-6">
            {/* ── Card #1: Risk Score (dummy) ────────────────────────────────────── */}
                     <RiskScoreCard username={id} />

            <div className="bg-[#1F2937] px-4 py-2 pt-4 shadow-md flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
              <Image 
                src="/card2.png" 
                alt="Latest Post" 
                width={48} 
                height={48} 
                className="flex-shrink-0" 
              />
              <div>
                <p className="text-[#E9ECEF] font-bold text-[16px] mb-[4px]">
                  Latest Post
                </p>
                <p className="text-[22px] text-white mb-[4px]">
                  {relativeText}
                </p>
                {calendarDateText && (
                  <p className="mt-1 mb-[4px] text-[14px] text-[#28A745]">
                    {calendarDateText}
                  </p>
                )}
              </div>
            </div>

            {/* ── Card #3: Location (dynamic) ─────────────── */}
            <div className="bg-[#1F2937] px-4 py-2 pt-4 shadow-md flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
              <GlobeAltIcon className="h-12 w-12 text-blue-300 flex-shrink-0" />
              <div>
                <p className="text-[#E9ECEF] font-bold text-[16px] mb-[4px]">
                  Location
                </p>
                <p className="text-[18px] text-white mb-[4px]">
                  {hasRealLocation ? locationText : "United States"}
                </p>
                {/* <p className="mt-1 mb-[4px] text-[14px] text-[#28A745]">
                  New York, NY
                </p> */}
              </div>
            </div>

            {/* ── Card #4: Contact Info (dummy) ───────────────────────────────────── */}
            <div className="bg-[#1F2937] px-4 py-2 pt-4 shadow-md flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
              <PhoneIcon className="h-12 w-12 text-blue-300 flex-shrink-0" />
              <div>
                <p className="text-[#E9ECEF] font-bold text-[16px] mb-[4px]">
                  Contact info
                </p>
                <p className="text-[18px] text-white mb-[4px]">
                  +1 (555) 123-4567
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Relationship List */}
        <div className="pt-[44px] pb-[44px]">
        <FbRelationCard username={id} />
        </div>  

       {/* Interests Section */}
         <div className="pt-[44px] pb-[44px]">
      <Fb_InterestsCard username={id} />
      </div>  
 

        {/* ─── PROFILE POSTS ───────────────── */}
        <div className="px-7 pb-20">
          <h1 className="text-2xl font-bold mb-4 text-white">Profile Posts</h1>
          <FbPosts profileId={id} />
        </div>
        
        </div>
      </div>
    </div>
  );
}
