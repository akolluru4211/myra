import React from "react";
import SectorLandingPage from "@/components/landing/SectorLandingPage";
import { SEED_SECTOR_DATA } from "@/lib/services/landing-sector-service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Acceleration Track for Students | EdWorld Co.",
  description: "The unified career acceleration OS for Class 12th and College students. ATS resume maker, STAR mock interviews, GitHub project studio, and campus placement benchmarks.",
  alternates: {
    canonical: "https://edworldco.in/for/students",
  },
};

export default function ForStudentsPage() {
  return (
    <SectorLandingPage
      sector="career"
      slug="for/students"
      initialData={SEED_SECTOR_DATA.career}
    />
  );
}
