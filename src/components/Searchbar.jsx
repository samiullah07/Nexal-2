// src/components/Searchbar.jsx
"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SearchBar = ({ placeholder = "Search Instagram..." }) => {
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cachedData, setCachedData] = useState({});

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");

  const handleSearch = async (platformUsed = selectedPlatform) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || !/^[a-zA-Z0-9._]+$/.test(trimmedQuery)) {
      setError("User not found. Please type an existing username.");
      setProfile(null);
      return;
    }

    // Build the correct API route based on platform
    const apiRoute =
      platformUsed === "Facebook"
        ? "facebookSearch"
        : platformUsed.toLowerCase();

    // Use a cache key that includes platform, so Instagram/"foo" and Facebook/"foo" don't collide
    const cacheKey = platformUsed + ":" + trimmedQuery;
    if (cachedData[cacheKey]) {
      setProfile(cachedData[cacheKey]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    setProfile(null);

    try {
      const response = await fetch(
        `/api/${apiRoute}?username=${trimmedQuery}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setProfile(null);
        return;
      }

      // If it's Facebook, we know our API returns { username, image, … },
      // but the UI expects `profile_pic_url` + `username`. So remap:
      let formattedData;
      if (platformUsed === "Facebook") {
        formattedData = {
          username: data.username,
          profile_pic_url: data.image || "/no-profile-pic-img.png",
        };
      } else {
        // Instagram (and any other future platforms) already return { username, profile_pic_url, … }
        formattedData = data;
      }

      setProfile(formattedData);
      setCachedData((prev) => ({
        ...prev,
        [cacheKey]: formattedData,
      }));
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("An error occurred while fetching profile.");
    } finally {
      setLoading(false);
    }
  };

  const onDropdownClick = (platform) => {
    setSelectedPlatform(platform);
    setIsOpen(false);
    // Immediately re-run search on the existing query (if any)
    if (query.trim()) {
      handleSearch(platform);
    }
  };

  return (
    <div className="w-full flex flex-col items-start space-y-4">
      <div className="w-full flex space-x-2">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={`Search ${selectedPlatform}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-gray-200 
                       border border-gray-600 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 bg-[#52C2B1]  text-white rounded-md flex items-center"
          >
            {selectedPlatform} <span className="ml-2">▾</span>
          </button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
              <ul className="text-white">
                <li
                  className="px-4 py-2 hover:bg-[#52C2B1]  cursor-pointer"
                  onClick={() => onDropdownClick("Instagram")}
                >
                  Instagram
                </li>
                <li
                  className="px-4 py-2 hover:bg-[#52C2B1]  cursor-pointer"
                  onClick={() => onDropdownClick("Facebook")}
                >
                  Facebook
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {loading && <p className="text-[#F0FFFF]">Loading...</p>}

      {profile && (
        // Choose the appropriate route based on platform:
        <Link
          href={
            selectedPlatform === "Facebook"
              ? `/facebook-profile/${profile.username}`
              : `/profile/${profile.username}`
          }
        >
          <div
            className="w-[1000px] bg-gray-800 border border-cyan-600 
                          rounded-lg p-4 flex items-center cursor-pointer"
          >
            <Image
              src={profile.profile_pic_url || "/no-profile-pic-img.png"}
              alt={profile.username || "Profile image"}
              width={60}
              height={60}
              className="rounded-full mx-5"
              onError={(e) => (e.target.src = "/no-profile-pic-img.png")}
            />
            <div>
              <p className="text-white font-bold">{profile.username}</p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
};

export default SearchBar;
