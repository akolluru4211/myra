"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  Search, 
  X, 
  Check, 
  Star, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase
} from "lucide-react";

export interface CareerPath {
  id: string;
  name: string;
  category: string;
  description: string;
  typical_skills: string[];
  active: boolean;
  display_order: number;
}

interface CareerCategory {
  name: string;
  paths: CareerPath[];
}

interface CareerPathPickerProps {
  mode?: "onboarding" | "settings";
  userId?: string;
  initialSelectedIds?: string[];
  initialPrimaryId?: string;
  onChange?: (selectedIds: string[], primaryId: string) => void;
  onSaveSuccess?: (selectedIds: string[], primaryId: string) => void;
  onProceed?: () => void;
  showSubmitButton?: boolean;
  submitButtonText?: string;
}

export default function CareerPathPicker({
  mode = "onboarding",
  userId,
  initialSelectedIds = [],
  initialPrimaryId,
  onChange,
  onSaveSuccess,
  onProceed,
  showSubmitButton = false,
  submitButtonText = "Save & Continue",
}: CareerPathPickerProps) {
  const [categories, setCategories] = useState<CareerCategory[]>([]);
  const [allPaths, setAllPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Selection state: max 3 paths
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [primaryId, setPrimaryId] = useState<string>(initialPrimaryId || "");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load available paths from catalog API
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await fetch("/api/career/paths");
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
          setAllPaths(data.paths || []);

          // If no initial selection was passed, attempt to load user's existing selections if userId is provided
          if (initialSelectedIds.length === 0 && userId) {
            try {
              const userRes = await fetch(`/api/user/career-paths?userId=${encodeURIComponent(userId)}`);
              const userData = await userRes.json();
              if (userData.success && userData.selectedPaths && userData.selectedPaths.length > 0) {
                const loadedIds = userData.selectedPaths.map((p: any) => p.career_path_id);
                setSelectedIds(loadedIds);
                const prim = userData.selectedPaths.find((p: any) => p.is_primary)?.career_path_id || loadedIds[0];
                setPrimaryId(prim);
              }
            } catch (err) {
              // Ignore failure to fetch user paths, will fallback to empty
            }
          }
        } else {
          setError("Failed to load career paths catalog.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError("Unable to connect to the career catalog service.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Sync prop changes
  useEffect(() => {
    if (initialSelectedIds.length > 0) {
      setSelectedIds(initialSelectedIds);
    }
  }, [initialSelectedIds]);

  useEffect(() => {
    if (initialPrimaryId) {
      setPrimaryId(initialPrimaryId);
    }
  }, [initialPrimaryId]);

  // Notify parent component of changes
  const notifyParent = useCallback(
    (newSelected: string[], newPrimary: string) => {
      if (onChange) {
        onChange(newSelected, newPrimary);
      }
    },
    [onChange]
  );

  // Toggle selection handler
  const handleTogglePath = (pathId: string) => {
    setError(null);

    // If "other_exploring" was selected and user clicks another path, or vice versa
    if (pathId === "other_exploring") {
      handleSelectOtherExploring();
      return;
    }

    const isCurrentlySelected = selectedIds.includes(pathId);

    if (isCurrentlySelected) {
      // Remove it
      const nextSelected = selectedIds.filter((id) => id !== pathId);
      let nextPrimary = primaryId;
      if (primaryId === pathId) {
        nextPrimary = nextSelected.length > 0 ? nextSelected[0] : "";
      }
      setSelectedIds(nextSelected);
      setPrimaryId(nextPrimary);
      notifyParent(nextSelected, nextPrimary);
    } else {
      // Trying to add: enforce strict max 3
      if (selectedIds.length >= 3) {
        setError("You can select up to 3 career paths (1 primary + 2 secondary). Deselect one to add this.");
        return;
      }

      // If user had "other_exploring" selected, clear it when selecting specific careers
      const cleanSelected = selectedIds.filter((id) => id !== "other_exploring");

      const nextSelected = [...cleanSelected, pathId];
      // If this is the first selected item, make it primary automatically
      const nextPrimary = primaryId && primaryId !== "other_exploring" ? primaryId : pathId;

      setSelectedIds(nextSelected);
      setPrimaryId(nextPrimary);
      notifyParent(nextSelected, nextPrimary);
    }
  };

  // Set primary path handler
  const handleSetPrimary = (pathId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setError(null);

    if (!selectedIds.includes(pathId)) {
      if (selectedIds.length >= 3) {
        setError("You can select up to 3 career paths. Deselect one before making this your primary focus.");
        return;
      }
      const nextSelected = [...selectedIds, pathId];
      setSelectedIds(nextSelected);
      setPrimaryId(pathId);
      notifyParent(nextSelected, pathId);
    } else {
      setPrimaryId(pathId);
      notifyParent(selectedIds, pathId);
    }
  };

  // 1-Click "Other / Not sure yet" handler
  const handleSelectOtherExploring = () => {
    setError(null);
    const nextSelected = ["other_exploring"];
    const nextPrimary = "other_exploring";
    setSelectedIds(nextSelected);
    setPrimaryId(nextPrimary);
    notifyParent(nextSelected, nextPrimary);
    setIsDropdownOpen(false);
  };

  // Save changes to API
  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least 1 career path or choose 'Other / Not Sure Yet'.");
      return;
    }

    if (!primaryId || !selectedIds.includes(primaryId)) {
      setError("Please specify which selected career path is your primary focus.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/user/career-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          selectedPathIds: selectedIds,
          primaryPathId: primaryId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save career selections.");
      }

      if (onSaveSuccess) {
        onSaveSuccess(selectedIds, primaryId);
      }
      if (onProceed) {
        onProceed();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving your career preferences.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered categories based on live search
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;

    const result: CareerCategory[] = [];
    for (const cat of categories) {
      const matchingPaths = cat.paths.filter((p) => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchSkills = p.typical_skills.some((s) => s.toLowerCase().includes(q));
        return matchName || matchDesc || matchCategory || matchSkills;
      });

      if (matchingPaths.length > 0) {
        result.push({
          name: cat.name,
          paths: matchingPaths,
        });
      }
    }
    return result;
  }, [categories, searchQuery]);

  const totalMatchingPaths = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.paths.length, 0);
  }, [filteredCategories]);

  // Highlight matching search text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-blue-100 text-[#2563EB] px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      searchInputRef.current?.blur();
    } else if (e.key === "Enter" || e.key === "ArrowDown") {
      setIsDropdownOpen(true);
    }
  };

  // Map of selected paths for fast lookup
  const selectedPathsDetails = useMemo(() => {
    const map = new Map<string, CareerPath>();
    allPaths.forEach((p) => {
      if (selectedIds.includes(p.id)) {
        map.set(p.id, p);
      }
    });
    return map;
  }, [allPaths, selectedIds]);

  return (
    <div className="w-full bg-transparent text-white font-sans space-y-4" ref={containerRef}>
      {/* Top Header & Quick Exploring Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-display">
              Designated Career Paths
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#0F1422] border border-white/10 text-white">
              {selectedIds.length} / 3 selected
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Pick 1 primary focus and up to 2 secondary tracks to adapt your courses, mock interviews, and practice.
          </p>
        </div>

        {/* Quick 1-Click "Not sure yet / Exploring" Button */}
        <button
          type="button"
          onClick={handleSelectOtherExploring}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedIds.includes("other_exploring")
              ? "bg-white text-slate-950 font-bold border-white"
              : "bg-[#0F1422] text-white border-white/10 hover:bg-white/10"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Exploring / Not Sure Yet</span>
          {selectedIds.includes("other_exploring") && <Check className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Selected Paths Tray (Compact horizontal tags) */}
      <div className="edworld-blue-card p-3.5  border border-white/10 rounded-xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Active Trajectory:
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setPrimaryId("");
                notifyParent([], "");
              }}
              className="text-[11px] text-slate-400 hover:text-white hover:underline cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              No target paths selected yet. Use the search bar below to choose.
            </span>
          ) : (
            selectedIds.map((id) => {
              const path = selectedPathsDetails.get(id);
              const isPrimary = id === primaryId;
              const name = path ? path.name : id === "other_exploring" ? "Other / Exploring Focus" : id;

              return (
                <div
                  key={id}
                  className={`inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                    isPrimary
                      ? "bg-white text-slate-950 font-bold border-white shadow-md"
                      : "bg-[#0C101A] text-white border-white/15 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-950 text-white">
                        <Star className="w-3 h-3 fill-current text-white" />
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleSetPrimary(id, e)}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Set as primary career focus"
                      >
                        Make Primary
                      </button>
                    )}
                    <span className="font-semibold text-xs">{name}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePath(id)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label={`Remove ${name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Error / Alert feedback */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input Bar with Combobox Options Dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search and select career paths (e.g. Full Stack, AI, DevOps, FinTech)..."
            className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm bg-[#0F1422] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              aria-label="Toggle options menu"
            >
              {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Options Dropdown Panel */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0C101A] border border-white/10 rounded-xl shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-white/10 animate-in fade-in zoom-in-95 duration-100">
            {loading ? (
              <div className="p-6 text-center text-slate-300 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-xs">Loading career options...</span>
              </div>
            ) : totalMatchingPaths === 0 ? (
              <div className="p-5 text-center space-y-2">
                <p className="text-xs font-semibold text-white">
                  No career paths matched &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-[11px] text-slate-400">
                  Try searching a different keyword or choose &ldquo;Exploring / Not Sure Yet&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={handleSelectOtherExploring}
                  className="mt-1 px-3 py-1.5 text-xs font-semibold bg-white text-slate-950 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Select Exploring / Not Sure Yet
                </button>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.name} className="p-2">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-white/5 rounded-md mb-1">
                    {cat.name} ({cat.paths.length})
                  </div>
                  <div className="space-y-0.5">
                    {cat.paths.map((path) => {
                      const isSelected = selectedIds.includes(path.id);
                      const isPrimary = path.id === primaryId;

                      return (
                        <div
                          key={path.id}
                          onClick={() => handleTogglePath(path.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-white/10 text-white border border-white/20"
                              : "hover:bg-white/5 text-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                                isSelected
                                  ? "bg-white border-white text-slate-950 font-bold"
                                  : "border-white/20 bg-[#0F1422]"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">
                                  {highlightMatch(path.name, searchQuery)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {path.description}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {path.typical_skills.slice(0, 3).map((skill, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300 font-mono"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                            {isSelected && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isPrimary
                                    ? "bg-white text-slate-950 font-bold"
                                    : "bg-white/15 text-white"
                                }`}
                              >
                                {isPrimary ? "Primary" : "Secondary"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Explicit Save Button for Settings / Profile mode */}
      {showSubmitButton && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={saving || selectedIds.length === 0}
            onClick={handleSave}
            className="px-5 py-2 bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{submitButtonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
