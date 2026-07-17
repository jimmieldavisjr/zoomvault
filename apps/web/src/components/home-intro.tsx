"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

export function HomeIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsVisible(false), 2600);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="home-intro" aria-hidden="true">
      <div className="home-intro__glow" />
      <div className="home-intro__rings">
        <span />
        <span />
        <span />
      </div>
      <div className="home-intro__brand">
        <div className="home-intro__mark">
          <Lock />
        </div>
        <p>ZoomVault</p>
        <span>Secure recording sharing</span>
      </div>
    </div>
  );
}
