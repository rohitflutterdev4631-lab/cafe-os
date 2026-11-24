'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';

interface CafeInteriorMeshProps {
  onSelectZone: (zone: string) => void;
  reservationCount?: number;
}

export function CafeInteriorMesh({ onSelectZone, reservationCount = 4 }: CafeInteriorMeshProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  return (
    <group>
      {/* --- Main Architectural Floor (Deep Espresso Herringbone & Polished Terrazzo) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[26, 22]} />
        <meshStandardMaterial color="#16120F" roughness={0.7} metalness={0.06} />
      </mesh>

      {/* --- Barista Zone Polished Nero Marquina Marble / Terrazzo Runner --- */}
      <mesh position={[-2.8, 0.006, 0.6]} receiveShadow>
        <boxGeometry args={[6.2, 0.012, 3.8]} />
        <meshStandardMaterial color="#1A1816" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Brass Demarcation Inlay Strip along Barista Runner */}
      <mesh position={[-2.8, 0.014, 2.5]}>
        <boxGeometry args={[6.2, 0.008, 0.03]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 0.014, 0.6]}>
        <boxGeometry args={[0.03, 0.008, 3.8]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* --- Kitchen Non-Slip Graphite Tile Runner --- */}
      <mesh position={[-7.2, 0.006, -3.8]} receiveShadow>
        <boxGeometry args={[5.2, 0.012, 3.6]} />
        <meshStandardMaterial color="#212429" roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh position={[-4.6, 0.014, -3.8]}>
        <boxGeometry args={[0.03, 0.008, 3.6]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* --- Raised Dining Parquet Hardwood Platform with Warm Amber Trim --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.0, 0.005, 1.8]} receiveShadow>
        <planeGeometry args={[11.5, 9.5]} />
        <meshStandardMaterial color="#241A14" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Architectural Parquet Wood Plank Inlays (Herringbone Look in 3D) */}
      {[-3.5, -1.5, 0.5, 2.5, 4.5, 6.5, 8.5].map((px, idx) => (
        <mesh
          key={`parquet-${idx}`}
          position={[px, 0.008, 1.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[0.02, 9.4]} />
          <meshStandardMaterial color="#17110C" roughness={0.9} />
        </mesh>
      ))}
      {[-1.5, 1.0, 3.5].map((pz, idx) => (
        <mesh
          key={`parquet-h-${idx}`}
          position={[4.0, 0.008, pz]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[11.4, 0.02]} />
          <meshStandardMaterial color="#17110C" roughness={0.9} />
        </mesh>
      ))}

      {/* Platform Perimeter Brass Inset Line */}
      <mesh position={[4.0, 0.015, -2.95]}>
        <boxGeometry args={[11.5, 0.01, 0.04]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[4.0, 0.015, 6.55]}>
        <boxGeometry args={[11.5, 0.01, 0.04]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-1.75, 0.015, 1.8]}>
        <boxGeometry args={[0.04, 0.01, 9.5]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* --- Overhead Architectural Acoustic Timber Ceiling Baffles & LED Recessed Strips --- */}
      {[-7, -4, -1, 2, 5, 8].map((bz, bidx) => (
        <group key={`ceiling-baffle-${bidx}`} position={[0, 5.4, bz]}>
          {/* Walnut Beam */}
          <mesh>
            <boxGeometry args={[24.8, 0.22, 0.1]} />
            <meshStandardMaterial color="#261A12" roughness={0.6} />
          </mesh>
          {/* Recessed Warm LED Linear Light Strip */}
          <mesh position={[0, -0.115, 0]}>
            <boxGeometry args={[24.0, 0.015, 0.03]} />
            <meshStandardMaterial color="#FFFBEB" emissive="#FDE68A" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}

      {/* --- Perimeter Architectural Walls --- */}
      {/* Back Wall - Deep Charcoal with Ambient Lighting */}
      <mesh position={[0, 3, -10]} receiveShadow>
        <boxGeometry args={[26, 6, 0.4]} />
        <meshStandardMaterial color="#141210" roughness={0.85} />
      </mesh>

      {/* Acoustic Vertical Wood Slat Accent Feature Wall behind Menu */}
      <group position={[-3, 3, -9.75]}>
        {Array.from({ length: 24 }).map((_, idx) => (
          <mesh key={idx} position={[-2.4 + idx * 0.21, 0, 0]}>
            <boxGeometry args={[0.08, 5.8, 0.06]} />
            <meshStandardMaterial color="#3E2A1C" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Left Wall - Architectural Concrete & Acoustic Paneling */}
      <mesh position={[-12.8, 3, 0]} receiveShadow>
        <boxGeometry args={[0.4, 6, 20]} />
        <meshStandardMaterial color="#181512" roughness={0.85} />
      </mesh>

      {/* Right Wall with Architectural Glass Windows */}
      <mesh position={[12.8, 3, 0]} receiveShadow>
        <boxGeometry args={[0.4, 6, 20]} />
        <meshStandardMaterial color="#181512" roughness={0.85} />
      </mesh>

      {/* Full-Height Architectural Bronze Window Mullions and Glass Panes */}
      <group position={[12.55, 3.2, 0]}>
        {/* Glass Surface */}
        <mesh>
          <boxGeometry args={[0.04, 4.4, 17.5]} />
          <meshStandardMaterial
            color="#93C5FD"
            opacity={0.22}
            transparent
            roughness={0.08}
            metalness={0.95}
          />
        </mesh>
        {/* Vertical Bronze Window Frames */}
        {[-7, -3.5, 0, 3.5, 7].map((z, i) => (
          <mesh key={i} position={[0, 0, z]}>
            <boxGeometry args={[0.1, 4.6, 0.12]} />
            <meshStandardMaterial color="#261E16" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* --- Cafe Entrance & Custom Welcome Mat --- */}
      <group position={[0, 0, 9.8]}>
        {/* Welcome Mat with Recessed Brass Border */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[3.4, 0.02, 1.5]} />
          <meshStandardMaterial color="#171412" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[3.2, 0.02, 1.3]} />
          <meshStandardMaterial color="#0C0A09" roughness={0.95} />
        </mesh>
      </group>

      {/* --- Wall-Mounted Glowing Artisan Menu Board --- */}
      <group
        position={[-3, 3.5, -9.6]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredZone('MENU');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredZone(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('MENU');
        }}
      >
        {/* Menu Board Backing */}
        <mesh castShadow>
          <boxGeometry args={[4.2, 2.2, 0.1]} />
          <meshStandardMaterial
            color={hoveredZone === 'MENU' ? '#3B271A' : '#241810'}
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>
        {/* Backlit Header Strip */}
        <mesh position={[0, 0.85, 0.06]}>
          <boxGeometry args={[4.0, 0.28, 0.02]} />
          <meshStandardMaterial
            color="#D97706"
            emissive="#F59E0B"
            emissiveIntensity={hoveredZone === 'MENU' ? 1.4 : 0.8}
          />
        </mesh>
        {/* Backlight Glow Point Light */}
        <pointLight
          position={[0, 0.5, 0.4]}
          color="#FEF3C7"
          intensity={hoveredZone === 'MENU' ? 1.5 : 0.8}
          distance={4}
          decay={2}
        />

        {/* Spatial Floating Label */}
        <Html position={[0, 0, 0.18]} center distanceFactor={22}>
          <div
            className={`cursor-pointer transition-all duration-300 transform select-none ${
              hoveredZone === 'MENU' ? 'scale-110 -translate-y-1' : 'scale-100'
            }`}
          >
            <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-stone-950/95 text-stone-100 border border-amber-500/50 shadow-xl backdrop-blur-md">
              <span className="font-extrabold text-[11px] tracking-wider uppercase text-amber-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Artisan Menu & Recipes
              </span>
              <span className="text-[9px] text-stone-400 font-mono mt-0.5">
                Catalog • Dynamic Pricing • Margin Engine
              </span>
            </div>
          </div>
        </Html>
      </group>

      {/* --- Host Stand / Reservation Podium at Entrance --- */}
      <group
        position={[2.6, 0, 8.2]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredZone('RESERVATIONS');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredZone(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('RESERVATIONS');
        }}
      >
        {/* Podium Base */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.75, 1.2, 0.55]} />
          <meshStandardMaterial
            color={hoveredZone === 'RESERVATIONS' ? '#4E3321' : '#2A1C12'}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        {/* Top Brass Trim and Sloped Reading Desk */}
        <mesh position={[0, 1.22, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.82, 0.06, 0.6]} />
          <meshStandardMaterial color="#B45309" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Guest Reservation Tablet Stand */}
        <mesh position={[0, 1.3, -0.05]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.32, 0.22, 0.02]} />
          <meshStandardMaterial
            color="#09090B"
            emissive="#38BDF8"
            emissiveIntensity={hoveredZone === 'RESERVATIONS' ? 0.8 : 0.4}
          />
        </mesh>

        <Html position={[0, 1.9, 0]} center distanceFactor={22}>
          <div
            className={`cursor-pointer transition-all duration-300 transform select-none ${
              hoveredZone === 'RESERVATIONS' ? 'scale-110 -translate-y-1' : 'scale-100'
            }`}
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-stone-950/95 text-stone-100 border border-amber-500/40 shadow-xl backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <div className="font-extrabold text-[11px] text-white">RESERVATIONS & HOST</div>
                <div className="text-[9px] text-amber-300 font-mono">
                  {reservationCount} Active Bookings • Seating Queue
                </div>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* --- Staff Clock-In / HR Biometric Terminal --- */}
      <group
        position={[-11.5, 0, 6]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredZone('STAFF');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredZone(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone('STAFF');
        }}
      >
        <mesh position={[0, 1.5, -0.15]}>
          <boxGeometry args={[1.6, 1.3, 0.08]} />
          <meshStandardMaterial
            color={hoveredZone === 'STAFF' ? '#261F18' : '#171411'}
            roughness={0.4}
          />
        </mesh>
        {/* Illuminated Screen */}
        <mesh position={[0, 1.55, -0.1]}>
          <planeGeometry args={[1.4, 0.9]} />
          <meshStandardMaterial
            color="#09090B"
            emissive="#10B981"
            emissiveIntensity={hoveredZone === 'STAFF' ? 0.7 : 0.35}
          />
        </mesh>

        <Html position={[0, 2.3, 0]} center distanceFactor={14}>
          <div
            className={`cursor-pointer transition-all duration-300 transform select-none ${
              hoveredZone === 'STAFF' ? 'scale-110 -translate-y-1' : 'scale-100'
            }`}
          >
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-stone-950/95 text-stone-100 border border-emerald-500/40 shadow-2xl backdrop-blur-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div>
                <div className="font-extrabold text-xs text-white">STAFF & SHIFTS</div>
                <div className="text-[10px] text-emerald-300 font-mono">Clock-In • Performance</div>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* --- Architectural Potted Plants (Lush Fiddle Leaf Fig & Monstera) --- */}
      {[
        [-11.5, 0, -8.5],
        [11.5, 0, -8.5],
        [11.5, 0, 7.5],
        [-1.8, 0, 8.5],
      ].map((pos, idx) => (
        <group key={`plant-${idx}`} position={pos as [number, number, number]}>
          {/* Ribbed Ceramic Pot with Brass Base */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.25, 0.9, 20]} />
            <meshStandardMaterial color="#27272A" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 20]} />
            <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Layered Lush Foliage */}
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.62, 16, 16]} />
            <meshStandardMaterial color="#14532D" roughness={0.7} />
          </mesh>
          <mesh position={[0.1, 1.5, -0.05]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial color="#15803D" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* --- Suspended Brass Pendant Cone Lights --- */}
      {[
        [-3.8, 4.5, 0],
        [-1.8, 4.5, 0],
        [2.0, 4.5, 2.5],
        [5.0, 4.5, 2.5],
        [8.0, 4.5, 2.5],
      ].map((pos, idx) => (
        <group key={`light-${idx}`} position={pos as [number, number, number]}>
          {/* Black Braided Cord */}
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 1.5, 8]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
          {/* Spun Brass Cone Shade */}
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.28, 0.24, 20]} />
            <meshStandardMaterial color="#D97706" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Diffused Frosted Bulb */}
          <mesh position={[0, -0.06, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial
              color="#FFFBEB"
              emissive="#FDE68A"
              emissiveIntensity={1.8}
            />
          </mesh>
          {/* Warm Ambient Radial Light Cone */}
          <pointLight
            color="#FEF3C7"
            intensity={1.9}
            distance={7.5}
            decay={2}
            position={[0, -0.15, 0]}
          />
        </group>
      ))}
    </group>
  );
}
