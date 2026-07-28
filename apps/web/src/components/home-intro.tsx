"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

const PARTICLES = [
  { left: "12%", top: "24%", delay: "0.1s", size: "6px" },
  { left: "82%", top: "18%", delay: "0.35s", size: "8px" },
  { left: "24%", top: "72%", delay: "0.55s", size: "5px" },
  { left: "68%", top: "68%", delay: "0.2s", size: "7px" },
  { left: "48%", top: "14%", delay: "0.65s", size: "4px" },
  { left: "88%", top: "52%", delay: "0.45s", size: "6px" },
  { left: "8%", top: "50%", delay: "0.75s", size: "5px" },
  { left: "58%", top: "84%", delay: "0.3s", size: "7px" },
];

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
      <div className="home-intro__aurora" />
      <div className="home-intro__grid" />
      <div className="home-intro__glow" />
      <div className="home-intro__particles">
        {PARTICLES.map((particle, index) => (
          <span
            key={index}
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>
      <div className="home-intro__rings">
        <span />
        <span />
        <span />
      </div>
      <div className="home-intro__brand">
        <div className="home-intro__mark">
          <span className="home-intro__mark-halo" />
          <Lock />
        </div>
        <p className="home-intro__title">ZoomVault</p>
        <span className="home-intro__tagline">Secure recording sharing</span>
        <span className="home-intro__bar">
          <span className="home-intro__bar-fill" />
        </span>
      </div>
    </div>
  );
}
