"use client";

import { AnimatedGradient } from "@/components/ui/AnimatedGradient";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function DashboardHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!titleRef.current || !subtitleRef.current) return;

      gsap.set([titleRef.current, subtitleRef.current], {
        autoAlpha: 0,
        y: 20,
        filter: "blur(10px)",
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(titleRef.current, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1,
      }).to(
        subtitleRef.current,
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
        },
        "-=0.6"
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] overflow-hidden rounded-3xl mb-8 group"
    >
      <AnimatedGradient />

      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 lg:px-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-light tracking-tight text-white/80">
              Live Feed
            </span>
          </div>

          <h1
            ref={titleRef}
            className="text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tight text-white mb-4 leading-[1.1]"
          >
            Your Campus Pulse
          </h1>

          <p
            ref={subtitleRef}
            className="text-lg md:text-xl font-light text-white/70 max-w-xl leading-relaxed"
          >
            See what's happening right now across clubs, events, and student
            spaces.
          </p>
        </div>
      </div>

      {/* Bottom fade for smooth integration */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
