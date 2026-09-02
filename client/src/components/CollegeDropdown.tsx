/**
 * CollegeDropdown — Searchable college selector
 * Fetches from /api/v1/institutions (real backend, public endpoint).
 * Only institutions registered by an admin appear here.
 */
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Building2, X, AlertCircle } from "lucide-react";
import { institutionsApi, Institution } from "../services/api";

interface CollegeDropdownProps {
  value: string;
  onChange: (name: string, id?: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export default function CollegeDropdown({
  value,
  onChange,
  placeholder = "Select your institution...",
  label = "College / Institution",
  required = false,
}: CollegeDropdownProps) {
  const [colleges, setColleges] = useState<Institution[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch from backend (public endpoint — no auth required)
  useEffect(() => {
    setLoading(true);
    institutionsApi.list()
      .then((data) => {
        setColleges(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = colleges.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (college: Institution) => {
    onChange(college.name, college.id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setSearch("");
  };

  return (
    <div className="relative block" ref={wrapperRef}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#88979c] mb-2">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setTimeout(() => document.getElementById("college-search")?.focus(), 50); }}
        className={`w-full flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-[13px] transition-all ${
          open
            ? "border-[#2f9c95] ring-2 ring-[#2f9c95]/20 bg-white"
            : "border-[#dfe6e3] bg-white hover:border-[#2f9c95]"
        }`}
      >
        <Building2 size={15} className="shrink-0 text-[#2f9c95]" />
        <span className={`flex-1 truncate ${value ? "text-[#18314a] font-medium" : "text-[#aabbbf]"}`}>
          {value || placeholder}
        </span>
        {value ? (
          <X size={14} className="shrink-0 text-[#99aab0] hover:text-[#e05a5a]" onClick={handleClear} />
        ) : (
          <ChevronDown size={15} className={`shrink-0 text-[#99aab0] transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-[#dfe6e3] bg-white shadow-[0_16px_48px_rgba(30,60,50,.12)]">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-[#eef1ef] px-3 py-2.5">
            <Search size={14} className="shrink-0 text-[#2f9c95]" />
            <input
              id="college-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="flex-1 bg-transparent text-[12px] text-[#18314a] outline-none placeholder:text-[#b0bfc5]"
              autoComplete="off"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={13} className="text-[#b0bfc5] hover:text-[#556972]" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[260px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-[#88979c]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2f9c95] border-t-transparent" />
                Loading institutions…
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <AlertCircle size={20} className="text-[#e07b5a]" />
                <span className="text-[12px] text-[#88979c]">Unable to load institutions. Please try again.</span>
              </div>
            ) : colleges.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Building2 size={24} className="mx-auto mb-2 text-[#c0cdd2]" />
                <p className="text-[12px] font-semibold text-[#556972]">No institutions registered yet</p>
                <p className="mt-1 text-[11px] text-[#99aab0]">
                  Ask your institution administrator to sign up first — their institution will appear here automatically.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#88979c]">
                No institution found for "<span className="font-bold">{search}</span>"
              </div>
            ) : (
              filtered.map((college) => (
                <button
                  key={college.id}
                  type="button"
                  onClick={() => handleSelect(college)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-[#f0f8f5] ${
                    value === college.name ? "bg-[#edf7f4] font-semibold text-[#23645f]" : "text-[#18314a]"
                  }`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e6f3f0] text-[9px] font-bold text-[#2f9c95]">
                    {college.code.substring(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{college.name}</div>
                    <div className="mt-0.5 text-[10px] text-[#99aab0]">{college.code} · {college.country}</div>
                  </div>
                  {value === college.name && (
                    <div className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#2f9c95]" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {colleges.length > 0 && (
            <div className="border-t border-[#eef1ef] px-4 py-2.5 text-[10px] text-[#aabbbf]">
              {filtered.length} institution{filtered.length !== 1 ? "s" : ""} available · Only admin-registered institutions are shown
            </div>
          )}
        </div>
      )}
    </div>
  );
}
