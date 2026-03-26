"use client";

import { useSearchParams } from "next/navigation";

export default function OrientationWrapper({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const isVertical = (params.get("orientation") || "").toLowerCase() === "vertical";

  if (!isVertical) {
    return <>{children}</>;
  }

  return <div className="orientation-vertical">{children}</div>;
}

