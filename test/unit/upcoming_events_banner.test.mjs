import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Upcoming Events Banner Strip Implementation", () => {
  const carouselPath = path.resolve(process.cwd(), "src/components/dashboard/FeaturedEventsCarousel.tsx");
  const dashboardPath = path.resolve(process.cwd(), "src/app/dashboard/page.tsx");
  const eventsApiPath = path.resolve(process.cwd(), "src/app/api/events/route.ts");

  test("FeaturedEventsCarousel exists and implements 16:9 aspect ratio banner", () => {
    assert.ok(fs.existsSync(carouselPath), "FeaturedEventsCarousel.tsx should exist");
    const content = fs.readFileSync(carouselPath, "utf-8");

    // Check 16:9 aspect ratio
    assert.ok(
      content.includes("aspect-[16/9]") || content.includes("aspect-video"),
      "Banner image container must specify 16:9 aspect ratio"
    );

    // Check responsive widths: 1 on mobile with peek, 2 on tablet, 3 on desktop
    assert.ok(
      content.includes("w-[85vw]") || content.includes("w-[82%]"),
      "Mobile view must show 1 banner with partial peek for smooth swiping"
    );
    assert.ok(
      content.includes("sm:w-[calc(50%"),
      "Tablet view must show 2 banners"
    );
    assert.ok(
      content.includes("lg:w-[calc(33.333%"),
      "Desktop view must show 3 banners"
    );

    // Check scroll snap classes
    assert.ok(content.includes("snap-x"), "Carousel track must have horizontal snapping");
    assert.ok(content.includes("snap-start"), "Banner items must snap to start");

    // Check text fallbacks for title and date below banner
    assert.ok(content.includes("formatEventDate"), "Component must format readable event date");
    assert.ok(content.includes("Deadline:"), "Component must display readable deadline below image");

    // Check empty state handling: return null if events.length === 0
    assert.ok(
      content.includes("events.length === 0") && content.includes("return null"),
      "Component must return null to hide strip when 0 events exist"
    );

    // Check single event handling: hide arrows when events.length <= 1
    assert.ok(
      content.includes("events.length > 1"),
      "Navigation arrows must only be rendered when more than 1 event exists"
    );
  });

  test("Dashboard page includes FeaturedEventsCarousel below welcome and quick actions", () => {
    assert.ok(fs.existsSync(dashboardPath), "Dashboard page should exist");
    const content = fs.readFileSync(dashboardPath, "utf-8");

    assert.ok(
      content.includes("import FeaturedEventsCarousel"),
      "Dashboard must import FeaturedEventsCarousel"
    );
    assert.ok(
      content.includes("<FeaturedEventsCarousel"),
      "Dashboard must render FeaturedEventsCarousel"
    );

    // Verify ordering: Greeting / Quick actions -> FeaturedEventsCarousel -> 4 Feature cards
    const quickActionsIndex = content.indexOf("Ask Myra Copilot");
    const carouselIndex = content.indexOf("<FeaturedEventsCarousel");
    const featureCardsIndex = content.indexOf("Problem Arena");

    assert.ok(quickActionsIndex !== -1, "Quick actions should exist");
    assert.ok(carouselIndex !== -1, "Carousel should exist");
    assert.ok(featureCardsIndex !== -1, "Feature cards should exist");

    assert.ok(
      quickActionsIndex < carouselIndex,
      "Carousel must be placed below the welcome and quick actions row"
    );
    assert.ok(
      carouselIndex < featureCardsIndex,
      "Carousel must be placed before or above the lower feature sections"
    );
  });

  test("Events API filters out expired events and orders by display_order then upcoming deadline", () => {
    assert.ok(fs.existsSync(eventsApiPath), "Events API route should exist");
    const content = fs.readFileSync(eventsApiPath, "utf-8");

    // Expired event filtering
    assert.ok(
      content.includes("registration_deadline >= NOW() - INTERVAL '1 day'"),
      "API must filter out expired events by default"
    );

    // Ordering
    assert.ok(
      content.includes("ORDER BY e.display_order ASC, e.registration_deadline ASC NULLS LAST"),
      "API must order by display order and upcoming deadline date"
    );
  });
});
