"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Calendar, 
  Loader2,
  Sparkles,
  Trophy,
  Users,
  ExternalLink
} from "lucide-react";
import { EventRecord } from "@/app/api/events/route";
import EventDetailModal from "./EventDetailModal";

interface FeaturedEventsCarouselProps {
  userId?: string;
}

export default function FeaturedEventsCarousel({ userId }: FeaturedEventsCarouselProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = userId ? `/api/events?userId=${encodeURIComponent(userId)}` : "/api/events";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setError("Unable to load upcoming events.");
      }
    } catch (err) {
      setError("Failed to connect to events service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [events]);

  // Smooth scroll left and right advancing one banner at a time
  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const firstChild = container.firstElementChild as HTMLElement | null;
    const cardWidth = firstChild ? firstChild.getBoundingClientRect().width + 16 : 340;
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth"
    });
  };

  // Keyboard navigation for carousel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleScroll("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleScroll("right");
    }
  };

  // Toggle bookmark/save event
  const handleToggleSave = async (eventId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic UI update
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, is_saved: !ev.is_saved } : ev))
      );
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent((prev) => prev ? { ...prev, is_saved: !prev.is_saved } : null);
      }

      await fetch("/api/events/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, userId }),
      });
    } catch (err) {
      console.warn("Could not save event:", err);
      fetchEvents();
    }
  };

  // Open modal for details
  const handleCardClick = (event: EventRecord) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Format date readable
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return "Registration Open";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  // 0 events: Hide the entire strip
  if (!loading && events.length === 0) {
    return null;
  }

  return (
    <section 
      aria-label="Upcoming Events and Hackathons"
      data-testid="upcoming-events-strip"
      className="space-y-3 font-sans w-full"
    >
      {/* Strip Header with Title & Arrow Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 font-display flex items-center gap-2">
            <span>Upcoming Events</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-blue-200 hidden sm:inline-block">
              Hackathons & Contests
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Participate in premier national challenges, hackathons, and placement competitions
          </p>
        </div>

        {/* Labeled Previous and Next controls on Desktop (Hidden if only 1 event) */}
        {events.length > 1 && (
          <div className="flex items-center gap-2" role="group" aria-label="Event slider controls">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shadow-2xs ${
                canScrollLeft
                  ? "bg-white border-blue-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
                  : "bg-slate-100 border-blue-200/60 text-slate-400 cursor-not-allowed opacity-60"
              }`}
              aria-label="Previous events"
              title="Previous banner"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shadow-2xs ${
                canScrollRight
                  ? "bg-white border-blue-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
                  : "bg-slate-100 border-blue-200/60 text-slate-400 cursor-not-allowed opacity-60"
              }`}
              aria-label="Next events"
              title="Next banner"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 flex items-center justify-center gap-2 text-slate-400 font-mono text-xs bg-white rounded-2xl border border-blue-100">
          <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
          <span>Loading upcoming event banners...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Horizontal Sliding Banner Strip */}
      {!loading && events.length > 0 && (
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Upcoming Events Carousel"
          className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-2xl -mx-1 px-1"
        >
          {events.map((event, idx) => {
            const style = event.banner_style || {};
            const bgGradient = style.bgGradient || "from-slate-900 via-indigo-950 to-slate-900";
            const imageUrl = style.imageUrl;

            // Responsive widths:
            // Mobile: 1 banner (w-[85%] or w-[88vw] to preview next)
            // Tablet: 2 banners (sm:w-[calc(50%-0.5rem)])
            // Desktop: 3 banners (lg:w-[calc(33.333%-0.67rem)])
            const cardWidthClass = events.length === 1
              ? "w-full max-w-xl"
              : "w-[85vw] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] shrink-0";

            return (
              <div
                key={event.id}
                data-testid={`event-banner-card-${idx}`}
                onClick={() => handleCardClick(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(event);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${event.title}`}
                className={`${cardWidthClass} group cursor-pointer snap-start flex flex-col justify-between bg-white rounded-2xl border border-blue-100 hover:border-blue-200/80 p-3 transition-all duration-200 shadow-2xs hover:shadow-md select-none`}
              >
                {/* 16:9 Banner Image Container (1200 x 675 Aspect Ratio) */}
                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden relative bg-[#EFF6FF] border border-[#BFDBFE] shadow-sm">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={event.title}
                      fill
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    /* Themed 16:9 Graphic Banner with Safe Center Placement */
                    <div className="w-full h-full bg-[#EFF6FF] border-b border-[#BFDBFE] p-4 sm:p-5 flex flex-col justify-between text-black relative overflow-hidden">
                      {/* Top Badges inside Banner (Inward padding safe from edges) */}
                      <div className="flex items-center justify-between z-10">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 rounded text-[#2563EB] border border-blue-200">
                          {event.category || "Event"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 font-bold">
                          {event.organizer}
                        </span>
                      </div>

                      {/* Main Center Headline (Safe from edges for phone viewing) */}
                      <div className="z-10 px-1 py-0.5">
                        <p className="text-xs sm:text-sm font-black text-black leading-snug line-clamp-2">
                          {style.headline || event.title}
                        </p>
                        {style.subHeadline && (
                          <p className="text-[10px] sm:text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {style.subHeadline}
                          </p>
                        )}
                      </div>

                      {/* Bottom Prize & Mode inside banner */}
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-800 z-10 pt-1 border-t border-blue-200">
                        <span className="flex items-center gap-1 font-bold text-[#2563EB]">
                          <Trophy className="w-3 h-3 text-[#2563EB] shrink-0" />
                          <span>{event.prize_pool || "Recognition & Certificates"}</span>
                        </span>
                        <span className="text-slate-600 font-mono text-[9px] uppercase tracking-wide">
                          {event.mode}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bookmark Save Action Button (Top-Right overlay on banner) */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(event.id, e)}
                    className={`absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
                      event.is_saved
                        ? "bg-rose-500 text-white"
                        : "bg-black/40 hover:bg-black/60 text-white/90 hover:text-white"
                    }`}
                    aria-label={event.is_saved ? "Remove from saved events" : "Save this event"}
                    title={event.is_saved ? "Saved" : "Save event"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${event.is_saved ? "fill-current" : ""}`} />
                  </button>
                </div>

                {/* Event Name & Date as Readable Text Below Image (Works even if image fails) */}
                <div className="pt-2.5 pb-0.5 px-0.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#2563EB] transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    {event.is_free && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] border border-blue-200 shrink-0">
                        Free
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3 h-3 text-[#2563EB] shrink-0" />
                      <span>Deadline: {formatEventDate(event.registration_deadline)}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {event.organizer}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Detail Modal for Full Interaction */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onToggleSave={(id) => handleToggleSave(id)}
      />
    </section>
  );
}
