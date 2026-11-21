"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  Briefcase, 
  Layers, 
  X,
  Search,
  Check,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface CareerPath {
  id: string;
  name: string;
  category: string;
  description: string;
  typical_skills: string[];
  active?: boolean;
}

const DEFAULT_CAREER_PATHS: CareerPath[] = [
  {
    id: "sde",
    name: "Software Development Engineer (SDE)",
    category: "Engineering",
    description: "Build robust, scalable distributed systems, cloud services, and production web applications.",
    typical_skills: ["Data Structures & Algorithms", "System Design", "Node.js/Go", "PostgreSQL", "Cloud"],
  },
  {
    id: "ai-engineer",
    name: "AI & Machine Learning Engineer",
    category: "Artificial Intelligence",
    description: "Design LLM applications, retrieval-augmented systems (RAG), and deploy production ML pipelines.",
    typical_skills: ["Python", "PyTorch", "LangChain/LlamaIndex", "Vector DBs", "Model Fine-Tuning"],
  },
  {
    id: "cloud-devops",
    name: "Cloud & DevOps Engineer",
    category: "Infrastructure",
    description: "Architect automated CI/CD deployment pipelines, container orchestration, and multi-cloud resilience.",
    typical_skills: ["Docker", "Kubernetes", "AWS/GCP", "Terraform", "Linux Internals"],
  },
  {
    id: "product-manager",
    name: "Associate Product Manager (APM)",
    category: "Product & Strategy",
    description: "Drive product lifecycle from customer research, roadmapping, UX prototyping, to metrics delivery.",
    typical_skills: ["Product Strategy", "User Research", "Agile/Scrum", "A/B Testing", "Data Analytics"],
  },
  {
    id: "data-scientist",
    name: "Data Scientist & Analyst",
    category: "Data & Analytics",
    description: "Extract actionable predictive insights from complex datasets using statistics, SQL, and modeling.",
    typical_skills: ["SQL", "Python/Pandas", "Hypothesis Testing", "Tableau/PowerBI", "Statistical Modeling"],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity Analyst",
    category: "Security",
    description: "Safeguard cloud infrastructure, identify security vulnerabilities, and perform penetration auditing.",
    typical_skills: ["Network Security", "Ethical Hacking", "OWASP Top 10", "SOC Analysis", "Cryptography"],
  },
];

export default function CareerPathSelectorWidget() {
  const { user, profile } = useAuth();
  const [allPaths, setAllPaths] = useState<CareerPath[]>(DEFAULT_CAREER_PATHS);
  const [selectedPath, setSelectedPath] = useState<CareerPath>(DEFAULT_CAREER_PATHS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch career paths from API
  useEffect(() => {
    let isMounted = true;
    async function loadPaths() {
      try {
        const res = await fetch("/api/career/paths");
        if (res.ok) {
          const data = await res.json();
          if (data.paths && data.paths.length > 0 && isMounted) {
            setAllPaths(data.paths);
          }
        }
      } catch (err) {
        console.warn("Using default career paths fallback:", err);
      }

      // Load user selected path
      try {
        const userRes = await fetch("/api/user/career-paths");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.primaryPath && isMounted) {
            const matched = {
              id: userData.primaryPath.career_path_id || userData.primaryPath.id,
              name: userData.primaryPath.name,
              category: userData.primaryPath.category,
              description: userData.primaryPath.description,
              typical_skills: userData.primaryPath.typical_skills || [],
            };
            setSelectedPath(matched);
          }
        }
      } catch (err) {
        // Fallback to profile targetRole
        const userTargetRole = profile?.targetRole;
        if (userTargetRole && isMounted) {
          const match = DEFAULT_CAREER_PATHS.find(
            (p) => p.name.toLowerCase().includes(userTargetRole.toLowerCase())
          );
          if (match) setSelectedPath(match);
        }
      }
    }

    loadPaths();
    return () => {
      isMounted = false;
    };
  }, [profile?.targetRole]);

  // Handle switching path
  const handleSelectPath = async (path: CareerPath) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/career-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPathIds: [path.id],
          primaryPathId: path.id,
        }),
      });

      setSelectedPath(path);
      setIsModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e) {
      console.error("Failed to update career path:", e);
      setSelectedPath(path);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter paths for modal
  const categories = ["All", ...Array.from(new Set(allPaths.map((p) => p.category)))];
  const filteredPaths = allPaths.filter((path) => {
    const matchesSearch =
      path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.typical_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || path.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="tactile-chassis bg-[#0C101A] border border-white/10 p-6 sm:p-7 rounded-3xl space-y-6 shadow-xl text-white">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-display">
              Career Trajectory
            </span>
            <span className="text-xs font-medium text-slate-400">Primary Specialization</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            Selected Career Path
          </h2>
        </div>

        {/* Change Career Path Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white self-start sm:self-auto cursor-pointer transition-all shadow-sm"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Switch Career Path</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Career trajectory successfully updated to <strong>{selectedPath.name}</strong>. Timetable and practice tracks adjusted.</span>
        </div>
      )}

      {/* Primary Selected Path Card */}
      <div className="tactile-chassis bg-[#0F1422] border border-white/10 p-6 space-y-4 rounded-2xl shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-300 px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full font-display">
                {selectedPath.category}
              </span>
              <span className="text-[11px] font-medium text-slate-400">Target Specialization</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white font-display">
              {selectedPath.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {selectedPath.description}
            </p>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Target</span>
            </span>
          </div>
        </div>

        {/* Required Skills & Competencies */}
        <div className="pt-3 border-t border-white/10">
          <span className="text-xs font-semibold text-slate-300 block mb-2 font-display">
            Core Competencies &amp; Learning Modules:
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedPath.typical_skills && selectedPath.typical_skills.length > 0 ? (
              selectedPath.typical_skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 rounded-full shadow-xs"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">Curriculum modules initialized</span>
            )}
          </div>
        </div>
      </div>

      {/* Career Path Picker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="tactile-chassis bg-[#0C101A] border border-white/10 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0F1422]">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Select Your Career Path
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pick your primary target. Myra AI and your timetable will tailor modules and question sets accordingly.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="p-4 border-b border-white/10 space-y-3 bg-[#0C101A]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by role name or skill (e.g. Python, Product, DevOps)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0F1422] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-white text-slate-950 font-bold border-white shadow-sm"
                        : "bg-[#0F1422] text-slate-300 hover:text-white border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Paths List */}
            <div className="p-4 space-y-2.5 overflow-y-auto max-h-[50vh] bg-[#0C101A]">
              {filteredPaths.map((path) => {
                const isCurrent = selectedPath.id === path.id;

                return (
                  <div
                    key={path.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? "bg-white/10 border-white/30 ring-1 ring-white/20"
                        : "bg-[#0F1422] border-white/10 hover:border-white/25 hover:bg-[#13192a]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          {path.category}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-slate-950 bg-white px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white font-display">{path.name}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2">{path.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {path.typical_skills.slice(0, 4).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={isSaving}
                      onClick={() => handleSelectPath(path)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? "bg-white text-slate-950 cursor-default"
                          : "bg-white hover:bg-slate-200 text-slate-950"
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </>
                      ) : isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Choose Path</span>
                      )}
                    </button>
                  </div>
                );
              })}

              {filteredPaths.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No career paths matched "{searchQuery}".
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/10 bg-[#0F1422] flex items-center justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
