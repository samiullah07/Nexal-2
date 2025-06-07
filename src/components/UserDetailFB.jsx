// src/components/UserDetailFB.jsx
"use client";

import React, { useState, useEffect } from "react";

// Simple regex to detect URLs (including those without an explicit protocol)
const URL_REGEX = /((https?:\/\/[^\s]+)|(www\.[^\s]+\.[^\s]{2,}))/gi;

export default function UserDetailFB({ profileId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Whenever profileId changes, re‐fetch details
  useEffect(() => {
    if (!profileId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/facebookSearch?username=${encodeURIComponent(profileId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
        setError("Unable to load profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [profileId]);

  if (!profileId) {
    return (
      <div className="p-4  text-white rounded-md">
        No profile ID provided.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-[#111827] text-white rounded-md">
        Loading profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-[#111827] text-red-800 rounded-md">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    name,
    image,
    intro,
    about_public = [],
    followers_count = "N/A",
    following_count = "N/A",
  } = data;

  function linkify(text) {
    const parts = text.split(URL_REGEX);

    return parts.map((part, idx) => {
      if (!part) return null;
      if (URL_REGEX.test(part)) {
        let href = part;
        if (!/^https?:\/\//i.test(part)) {
          href = "https://" + part;
        }
        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }

  const introLines = intro
    ? intro.split(/\r?\n/).filter((line) => line.trim() !== "")
    : [];

  return (
    <div className="max-w-md mx-7  border border-gray-200 text-gra-200 shadow-lg rounded-lg overflow-hidden mb-8">
      <div className="flex flex-col items-start p-6  space-y-4">
        {image ? (
          <img
            src={image}
            alt={`${name} profile`}
            className="w-24 h-24  text-gray-200 rounded-full border-2  object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full flex items-center justify-center">
            <span className=" text-gray-200">No Image</span>
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-200">{name || "Unknown"}</h2>
        <p className="text-sm text-gray-200">Name: {profileId}</p>

        {introLines.length > 0 && (
          <ul className="list-disc list-inside space-y-1  text-white text-sm">
            {introLines.map((line, idx) => (
              <li key={idx} className="flex items-start">
              {linkify(line)}
              </li>
            ))}
          </ul>
        )}

        {/* FOLLOWERS / FOLLOWING (commented out for now) */}
        
        {/* <div className="mt-4 flex space-x-8">
          <div className="text-center">
            <span className="block text-lg font-bold text-gray-800">
              {followers_count}
            </span>
            <span className="text-xs text-gray-500">Followers</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-gray-800">
              {following_count}
            </span>
            <span className="text-xs text-gray-500">Following</span>
          </div>
        </div>
        */}

        {/* PUBLIC INFO (location, category, links) – optional
        {about_public.length > 0 && (
          <ul className="mt-4 space-y-1 w-full text-gray-700 text-sm">
            {about_public.map((item, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="flex-1 truncate">{item.text}</span>
              </li>
            ))}
          </ul>
        )} */}
      </div>
    </div>
  );
}
