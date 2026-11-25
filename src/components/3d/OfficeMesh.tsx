'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';

interface OfficeMeshProps {
  onSelectZone: (zone: string) => void;
}

export function OfficeMesh({ onSelectZone }: OfficeMeshProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[6.5, 0, -6.5]}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('OFFICE');
        }}
      >
        {/* Raised Executive Dark Oak Floor Platform with Brass Edging */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[3.6, 0.16, 3.2]} />
          <meshStandardMaterial color="#1C1814" roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.16, 1.58]}>
          <boxGeometry args={[3.6, 0.02, 0.04]} />
          <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Architectural Glass & Brass Mezzanine Railing */}
        <group position={[0, 0.5, 1.55]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[3.5, 0.8, 0.02]} />
            <meshStandardMaterial
              color="#BAE6FD"
              opacity={0.25}
              transparent
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Top Brass Rail */}
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[3.55, 0.04, 0.06]} />
            <meshStandardMaterial color="#B45309" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Railing Posts */}
          {[-1.6, 0, 1.6].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.04, 0.85, 0.04]} />
              <meshStandardMaterial color="#1C1917" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Executive Walnut Desk with Chamfered Edge */}
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.08, 1.2]} />
          <meshStandardMaterial
            color={hovered ? '#4E3321' : '#332014'}
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>
        {/* Desk Front Privacy Modesty Panel */}
        <mesh position={[0, 0.48, 0.45]}>
          <boxGeometry args={[2.2, 0.65, 0.04]} />
          <meshStandardMaterial color="#221710" roughness={0.4} />
        </mesh>

        {/* Matte Black Steel Desk Trestle Legs */}
        <mesh position={[-1.05, 0.42, 0]} castShadow>
          <boxGeometry args={[0.08, 0.78, 1.0]} />
          <meshStandardMaterial color="#18181B" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[1.05, 0.42, 0]} castShadow>
          <boxGeometry args={[0.08, 0.78, 1.0]} />
          <meshStandardMaterial color="#18181B" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Curved Ultrawide Executive Monitor with Glowing Analytics Dashboard */}
        <group position={[0, 0.9, -0.15]}>
          {/* Heavy Metal Monitor Stand */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.15, 0.16, 0.02, 24]} />
            <meshStandardMaterial color="#18181B" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.22, -0.05]}>
            <boxGeometry args={[0.04, 0.42, 0.04]} />
            <meshStandardMaterial color="#27272A" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Curved Ultrawide Display Screen */}
          <group position={[0, 0.38, 0]}>
            {/* Screen Bezel */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.95, 0.38, 0.025]} />
              <meshStandardMaterial color="#09090B" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Illuminated High-Res Display Surface */}
            <mesh position={[0, 0, 0.015]}>
              <planeGeometry args={[0.92, 0.35]} />
              <meshStandardMaterial
                color="#0A0A0A"
                emissive="#D97706"
                emissiveIntensity={hovered ? 0.7 : 0.4}
                roughness={0.1}
              />
            </mesh>
          </group>
          {/* Mechanical Keyboard & Precision Mouse */}
          <mesh position={[0, 0.01, 0.28]}>
            <boxGeometry args={[0.42, 0.015, 0.14]} />
            <meshStandardMaterial color="#27272A" roughness={0.5} />
          </mesh>
          <mesh position={[0.3, 0.01, 0.28]}>
            <boxGeometry args={[0.08, 0.02, 0.12]} />
            <meshStandardMaterial color="#18181B" roughness={0.3} />
          </mesh>
        </group>

        {/* Architectural Brass Desk Task Lamp with Warm Downlight */}
        <group position={[0.9, 0.9, -0.3]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.03, 20]} />
            <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Angled Brass Stem */}
          <mesh position={[-0.04, 0.22, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.42, 12]} />
            <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Hood Shade */}
          <mesh position={[-0.15, 0.4, 0.05]} rotation={[0.4, 0, 0.5]}>
            <coneGeometry args={[0.1, 0.14, 16]} />
            <meshStandardMaterial
              color="#B45309"
              emissive="#FEF08A"
              emissiveIntensity={hovered ? 1.0 : 0.5}
              metalness={0.8}
            />
          </mesh>
          {/* Warm Desk Glow */}
          <pointLight
            position={[-0.15, 0.35, 0.05]}
            color="#FEF3C7"
            intensity={hovered ? 1.2 : 0.7}
            distance={2.5}
            decay={2}
          />
        </group>

        {/* Executive High-Back Ribbed Leather Armchair with Chrome 5-Spoke Base */}
        <group position={[0, 0, -0.75]}>
          {/* Chrome Star Base */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.03, 10]} />
            <meshStandardMaterial color="#E4E4E7" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.38, 12]} />
            <meshStandardMaterial color="#E4E4E7" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Padded Seat Cushion */}
          <mesh position={[0, 0.52, 0]} castShadow>
            <boxGeometry args={[0.62, 0.1, 0.58]} />
            <meshStandardMaterial color="#1C1917" roughness={0.35} />
          </mesh>
          {/* Contoured Backrest */}
          <mesh position={[0, 1.0, -0.24]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[0.58, 0.88, 0.09]} />
            <meshStandardMaterial color="#1C1917" roughness={0.35} />
          </mesh>
          {/* Ergonomic Armrests */}
          <mesh position={[-0.32, 0.74, -0.05]}>
            <boxGeometry args={[0.06, 0.04, 0.38]} />
            <meshStandardMaterial color="#27272A" metalness={0.8} />
          </mesh>
          <mesh position={[0.32, 0.74, -0.05]}>
            <boxGeometry args={[0.06, 0.04, 0.38]} />
            <meshStandardMaterial color="#27272A" metalness={0.8} />
          </mesh>
        </group>

        {/* Credenza / Award Trophy Shelf Behind Desk */}
        <group position={[0, 0.5, -1.35]}>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[2.2, 0.9, 0.45]} />
            <meshStandardMaterial color="#1C1814" roughness={0.4} />
          </mesh>
          {/* Brass Accents & Coffee Roaster Awards */}
          <mesh position={[-0.6, 0.55, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.18, 16]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.6, 0.55, 0]}>
            <boxGeometry args={[0.2, 0.18, 0.05]} />
            <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>

        {/* Vision Pro Spatial Context Card */}
        <Html position={[0, 2.4, 0]} center distanceFactor={22}>
          <div
            className={`pointer-events-none transition-all duration-300 transform select-none scale-[0.65] sm:scale-80 md:scale-95 lg:scale-100 origin-center ${
              hovered ? 'scale-110 -translate-y-1' : ''
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-stone-950/90 text-stone-100 backdrop-blur-md border border-amber-500/40 shadow-xl whitespace-nowrap">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div>
                <div className="font-extrabold text-[9px] sm:text-[11px] tracking-wide text-white">
                  <span className="hidden sm:inline">EXECUTIVE </span>OFFICE & AI
                </div>
                <div className="text-[8px] sm:text-[9px] text-amber-300/90 font-mono hidden sm:block">
                  Postgres BI & Automation
                </div>
              </div>
              <span className="hidden md:inline text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-mono font-bold border border-amber-500/30">
                ENTER
              </span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
