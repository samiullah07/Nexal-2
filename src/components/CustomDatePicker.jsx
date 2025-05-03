"use client";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

const CustomDatePicker = ({ value, onChange }) => {
  const [date, setDate] = useState({
    month: "",
    day: "",
    year: "",
  });
  const [showPicker, setShowPicker] = useState(false);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  // Parse initial value when component mounts or value prop changes
  useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        const month = months[dateObj.getMonth()];
        const day = dateObj.getDate();
        const year = dateObj.getFullYear();
        setDate({ month, day, year });
      }
    }
  }, [value]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = () => {
    if (date.month && date.day && date.year) {
      const monthIndex = months.findIndex((m) => m === date.month) + 1;
      return `${date.year}-${monthIndex.toString().padStart(2, "0")}-${date.day
        .toString()
        .padStart(2, "0")}`;
    }
    return "";
  };

  const handleApply = () => {
    const formattedDate = formatDate();
    if (formattedDate) {
      // Create a synthetic event to mimic the native input's onChange event
      const syntheticEvent = {
        target: {
          name: "date",
          value: formattedDate,
        },
      };
      onChange(syntheticEvent);
    }
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        readOnly
        className="w-full p-2 pl-10 pr-4 bg-[#1f2937] text-white border border-gray-500 rounded-md focus:outline-none focus:border-teal-400"
        value={formatDate() || "Select date"}
        onClick={() => setShowPicker(!showPicker)}
      />
      <CalendarIcon
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={18}
      />

      {showPicker && (
        <div className="absolute z-10 mt-1 p-4 bg-[#1f2937] border border-gray-700 rounded-md shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            {/* Month Select */}
            <select
              name="month"
              value={date.month}
              onChange={handleDateChange}
              className="p-2 bg-[#2d3748] text-white rounded"
            >
              <option value="">Month</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>

            {/* Day Select */}
            <select
              name="day"
              value={date.day}
              onChange={handleDateChange}
              className="p-2 bg-[#2d3748] text-white rounded"
              disabled={!date.month}
            >
              <option value="">Day</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              name="year"
              value={date.year}
              onChange={handleDateChange}
              className="p-2 bg-[#2d3748] text-white rounded"
              disabled={!date.day}
            >
              <option value="">Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex justify-between">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="px-3 py-1 bg-gray-600 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1 bg-teal-600 rounded"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
