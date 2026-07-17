"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

export function HomeIntro() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="home-intro"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          setIsVisible(false);
        }
      }}
    >
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
