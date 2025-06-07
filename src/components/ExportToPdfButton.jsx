// components/ExportToPdfButton.jsx
"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function ExportToPdfButton({
  containerId,

  fileName,
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsGenerating(true);

      const containerEl = document.getElementById(containerId);
      if (!containerEl) {
        console.error(`No element found with id="${containerId}"`);
        setIsGenerating(false);
        return;
      }

      const canvas = await html2canvas(containerEl, {
        scale: 2,      
        useCORS: true, 
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);

      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isGenerating}
      className="
        px-6 
        py-2 
        bg-blue-500 
        text-white 
        text-[20px] 
        font-bold 
        rounded 
        hover:bg-blue-700 
        disabled:opacity-50
      "
    >
      {isGenerating ? "Generating PDF…" : "Export to PDF"}
    </button>
  );
}
