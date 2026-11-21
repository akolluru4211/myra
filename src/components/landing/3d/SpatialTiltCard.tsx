"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpatialTiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  glowColor?: string;
}

export default function SpatialTiltCard({
  children,
  className,
  maxTilt = 12,
  perspective = 1000,
  glowColor = "rgba(79, 70, 229, 0.2)",
  ...props
}: SpatialTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = x / rect.width;
    const percentY = y / rect.height;

    const rY = (percentX - 0.5) * (maxTilt * 2);
    const rX = -(percentY - 0.5) * (maxTilt * 2);

    setRotateX(rX);
    setRotateY(rY);
    setSheenPos({ x: percentX * 100, y: percentY * 100 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className="relative select-none"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: isHovered
            ? "transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl transition-shadow duration-300",
          className
        )}
        {...props}
      >
        {/* Specular Dynamic Light Reflection Sheen */}
        {isHovered && (
          <div
            className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 380px at ${sheenPos.x}% ${sheenPos.y}%, rgba(255, 255, 255, 0.14), transparent 70%)`,
            }}
          />
        )}

        {/* Ambient Corner Glow Accent */}
        <div
          className="pointer-events-none absolute -inset-1 z-0 opacity-40 blur-xl transition-opacity duration-300"
          style={{ background: glowColor }}
        />

        {/* Card Content with 3D depth preserve */}
        <div className="relative z-10 w-full h-full" style={{ transformStyle: "preserve-3d" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
