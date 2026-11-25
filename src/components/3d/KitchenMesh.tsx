'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';

interface KitchenMeshProps {
  onSelectZone: (zone: string) => void;
  activeOrdersCount?: number;
}

export function KitchenMesh({ onSelectZone, activeOrdersCount = 4 }: KitchenMeshProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[-7.5, 0, -4]}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('KITCHEN');
        }}
      >
        {/* Commercial Stainless Steel Pass Counter */}
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.0, 1.3, 0.95]} />
          <meshStandardMaterial
            color={hovered ? '#E5E7EB' : '#9CA3AF'}
            metalness={0.9}
            roughness={0.16}
            emissive={hovered ? '#EA580C' : '#000000'}
            emissiveIntensity={hovered ? 0.2 : 0}
          />
        </mesh>

        {/* Double Kitchen Door Wall Partition */}
        <mesh position={[0, 1.9, -0.65]} receiveShadow>
          <boxGeometry args={[3.4, 3.8, 0.16]} />
          <meshStandardMaterial color="#2B2824" roughness={0.8} />
        </mesh>

        {/* Commercial Kitchen Swing Doors Left & Right */}
        <mesh position={[-0.8, 1.75, -0.56]} castShadow>
          <boxGeometry args={[1.35, 3.3, 0.06]} />
          <meshStandardMaterial color="#1E2024" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0.8, 1.75, -0.56]} castShadow>
          <boxGeometry args={[1.35, 3.3, 0.06]} />
          <meshStandardMaterial color="#1E2024" roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Brass Kick Plates on Swing Doors */}
        <mesh position={[-0.8, 0.25, -0.52]}>
          <boxGeometry args={[1.3, 0.45, 0.015]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.8, 0.25, -0.52]}>
          <boxGeometry args={[1.3, 0.45, 0.015]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Illuminated Porthole Windows in Doors */}
        <mesh position={[-0.8, 2.35, -0.52]}>
          <circleGeometry args={[0.24, 32]} />
          <meshStandardMaterial
            color="#FEF3C7"
            emissive="#F59E0B"
            emissiveIntensity={hovered ? 1.4 : 0.85}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0.8, 2.35, -0.52]}>
          <circleGeometry args={[0.24, 32]} />
          <meshStandardMaterial
            color="#FEF3C7"
            emissive="#F59E0B"
            emissiveIntensity={hovered ? 1.4 : 0.85}
            roughness={0.1}
          />
        </mesh>

        {/* Stainless Order Ticket Rail */}
        <mesh position={[0, 1.95, 0]}>
          <boxGeometry args={[2.6, 0.08, 0.06]} />
          <meshStandardMaterial color="#E5E7EB" metalness={0.95} roughness={0.08} />
        </mesh>

        {/* Hanging Paper Order Slips */}
        {[-0.9, -0.4, 0.15, 0.7].map((tx, idx) => (
          <mesh key={`ticket-${idx}`} position={[tx, 1.74, 0.02]} castShadow>
            <boxGeometry args={[0.28, 0.34, 0.01]} />
            <meshStandardMaterial
              color={idx === 1 ? '#FEF2F2' : '#FFFDF7'}
              roughness={0.9}
            />
          </mesh>
        ))}

        {/* Halogen Heat Warmer Bar with Radiant Infrared Glow */}
        <mesh position={[0, 2.15, 0]}>
          <boxGeometry args={[2.2, 0.06, 0.22]} />
          <meshStandardMaterial
            color="#DC2626"
            emissive="#EA580C"
            emissiveIntensity={hovered ? 2.0 : 1.2}
          />
        </mesh>
        <pointLight
          position={[0, 1.95, 0]}
          color="#F97316"
          intensity={hovered ? 2.2 : 1.4}
          distance={4}
          decay={2}
        />

        {/* Floating Spatial Label */}
        <Html position={[0, 2.8, 0]} center distanceFactor={22}>
          <div
            className={`pointer-events-none transition-all duration-300 transform select-none scale-[0.65] sm:scale-80 md:scale-95 lg:scale-100 origin-center ${
              hovered ? 'scale-110 -translate-y-1' : 'opacity-95'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-stone-950/90 text-white backdrop-blur-md border border-orange-500/50 shadow-xl whitespace-nowrap">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-orange-400 animate-ping shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[9px] sm:text-[11px] tracking-wider uppercase text-orange-400">
                  Kitchen KDS
                </span>
                <span className="text-[8px] sm:text-[9px] text-stone-400 font-mono hidden sm:inline">
                  {activeOrdersCount} Live Tickets
                </span>
              </div>
              <span className="hidden md:inline text-[9px] bg-orange-500/20 text-orange-200 px-1.5 py-0.5 rounded-md font-mono font-bold border border-orange-500/30">
                Click
              </span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
