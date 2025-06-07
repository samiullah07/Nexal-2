// src/components/RiskScoreCard.jsx
"use client";

import { useState, useEffect } from "react";

export default function RiskScoreCard({ username }) {
  const [riskScore, setRiskScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    setError(false);

    fetch(`/api/fb_riskscore?username=${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        // finalAnalysis comes back as a string (e.g. "21"), convert to number
        const parsed = Number(data.finalAnalysis);
        if (isNaN(parsed)) {
          throw new Error("Invalid risk score");
        }
        setRiskScore(parsed);
      })
      .catch((err) => {
        console.error("Error fetching risk score:", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  return (
    <div className="bg-[#1F2937] px-4 py-2 pt-4 shadow-md flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
      {/* Icon */}
      <img
        src="/card1.png"
        alt="Risk Score"
        width={48}
        height={48}
        className="flex-shrink-0"
      />
      <div>
        <p className="text-[#E9ECEF] font-bold text-[16px] mb-[4px]">
          Risk Score
        </p>
        {loading ? (
          <p className="text-[22px] text-gray-400 mb-[4px]">Loading…</p>
        ) : error ? (
          <p className="text-[22px] text-red-400 mb-[4px]">—</p>
        ) : (
          <p className="text-[22px] text-white mb-[4px]">{riskScore}</p>
        )}
      </div>
    </div>
  );
}
