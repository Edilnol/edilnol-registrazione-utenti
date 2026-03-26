"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import TvKioskLeadForm from "@/components/tv/TvKioskLeadForm";
import MobileLeadForm from "@/components/mobile/MobileLeadForm";

export default function AppEntry() {
  const params = useSearchParams();
  const ui = (params.get("ui") || "").toLowerCase();
  const orientation = (params.get("orientation") || "").toLowerCase();

  const choice = useMemo(() => {
    if (ui === "tv") return "tv";
    if (ui === "mobile") return "mobile";
    if (orientation === "vertical") return "tv";
    if (typeof window !== "undefined") {
      return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "tv";
    }
    return "tv";
  }, [orientation, ui]);

  return choice === "mobile" ? <MobileLeadForm /> : <TvKioskLeadForm />;
}

