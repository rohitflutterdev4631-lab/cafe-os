'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface CoffeeBarMeshProps {
  onSelectZone: (zone: string) => void;
  activeOrdersCount?: number;
}

export function CoffeeBarMesh({ onSelectZone, activeOrdersCount = 4 }: CoffeeBarMeshProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[-2.8, 0, 0]}>
      {/* Interactive Trigger Wrapper */}
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
          onSelectZone('POS');
        }}
      >
        {/* Main Counter Base - Rich Walnut Body */}
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 1.3, 1.3]} />
          <meshStandardMaterial
            color={hovered ? '#6B452B' : '#422B1B'}
            roughness={0.35}
            metalness={0.08}
            emissive={hovered ? '#3D2517' : '#000000'}
            emissiveIntensity={hovered ? 0.25 : 0}
          />
        </mesh>

        {/* Counter Top - Polished Calacatta Gold Italian Marble */}
        <mesh position={[0, 1.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 0.12, 1.45]} />
          <meshStandardMaterial
            color={hovered ? '#FFFDF8' : '#F6F3EE'}
            roughness={0.12}
            metalness={0.1}
          />
        </mesh>

        {/* Front Fluted Wood Slat Panels */}
        {Array.from({ length: 18 }).map((_, idx) => (
          <mesh
            key={`slat-${idx}`}
            position={[-2.0 + idx * 0.235, 0.65, 0.66]}
            castShadow
          >
            <boxGeometry args={[0.12, 1.18, 0.04]} />
            <meshStandardMaterial color="#2B1A10" roughness={0.6} />
          </mesh>
        ))}

        {/* Brass Counter Footrest Rail */}
        <mesh position={[0, 0.12, 0.72]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 4.3, 12]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* --- Commercial 2-Group Espresso Machine (La Marzocco Linea Style) --- */}
        <group position={[-1.0, 1.42, 0]}>
          {/* Main Chassis - Brushed Stainless Steel & Matte Obsidian Panels */}
          <mesh position={[0, 0.26, 0]} castShadow>
            <boxGeometry args={[1.2, 0.52, 0.75]} />
            <meshStandardMaterial
              color="#201E1C"
              metalness={0.85}
              roughness={0.18}
              emissive={hovered ? '#B45309' : '#000000'}
              emissiveIntensity={hovered ? 0.15 : 0}
            />
          </mesh>

          {/* Side Chrome Accent Insets */}
          <mesh position={[-0.605, 0.26, 0]}>
            <boxGeometry args={[0.02, 0.48, 0.72]} />
            <meshStandardMaterial color="#E5E7EB" metalness={0.95} roughness={0.08} />
          </mesh>
          <mesh position={[0.605, 0.26, 0]}>
            <boxGeometry args={[0.02, 0.48, 0.72]} />
            <meshStandardMaterial color="#E5E7EB" metalness={0.95} roughness={0.08} />
          </mesh>

          {/* Top Heated Cup Storage Rail */}
          <mesh position={[0, 0.54, 0]}>
            <boxGeometry args={[1.15, 0.03, 0.7]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Porcelain Espresso Cups Warming on Top */}
          {[-0.35, -0.12, 0.12, 0.35].map((cx, idx) => (
            <mesh key={`cup-${idx}`} position={[cx, 0.6, idx % 2 === 0 ? 0.12 : -0.12]} castShadow>
              <cylinderGeometry args={[0.045, 0.035, 0.08, 16]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.15} />
            </mesh>
          ))}

          {/* Grouphead 1 & 2 (Solid Brass with Chrome Portafilter Handles) */}
          {[-0.28, 0.28].map((gx, idx) => (
            <group key={`group-${idx}`} position={[gx, 0.16, 0.4]}>
              {/* Grouphead collar */}
              <mesh>
                <cylinderGeometry args={[0.075, 0.075, 0.16, 16]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
              </mesh>
              {/* Portafilter Spout */}
              <mesh position={[0, -0.09, 0]}>
                <cylinderGeometry args={[0.05, 0.03, 0.06, 12]} />
                <meshStandardMaterial color="#E5E7EB" metalness={0.95} roughness={0.1} />
              </mesh>
              {/* Portafilter Bakelite Handle */}
              <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2 + 0.2, 0, 0]}>
                <cylinderGeometry args={[0.018, 0.022, 0.22, 12]} />
                <meshStandardMaterial color="#1C1917" roughness={0.5} />
              </mesh>
            </group>
          ))}

          {/* Dual Precision Boiler Pressure Gauges */}
          {[-0.45, 0.45].map((gx, idx) => (
            <mesh key={`gauge-${idx}`} position={[gx, 0.36, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
              <meshStandardMaterial
                color="#FFFFFF"
                roughness={0.2}
                emissive="#FEF08A"
                emissiveIntensity={0.3}
              />
            </mesh>
          ))}

          {/* Dual Articulated Steam Wands */}
          <mesh position={[-0.58, 0.22, 0.32]} rotation={[0.4, 0, -0.3]}>
            <cylinderGeometry args={[0.016, 0.016, 0.38, 8]} />
            <meshStandardMaterial color="#E5E7EB" metalness={0.95} roughness={0.08} />
          </mesh>
          <mesh position={[0.58, 0.22, 0.32]} rotation={[0.4, 0, 0.3]}>
            <cylinderGeometry args={[0.016, 0.016, 0.38, 8]} />
            <meshStandardMaterial color="#E5E7EB" metalness={0.95} roughness={0.08} />
          </mesh>

          {/* Slotted Drip Tray */}
          <mesh position={[0, 0.02, 0.42]}>
            <boxGeometry args={[1.15, 0.04, 0.32]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>

        {/* --- Commercial Mahlkönig EK43 Coffee Grinder --- */}
        <group position={[-1.9, 1.42, -0.05]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.16, 0.6, 16]} />
            <meshStandardMaterial color="#18181B" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Smoked Acrylic Bean Hopper */}
          <mesh position={[0, 0.68, 0]}>
            <coneGeometry args={[0.19, 0.36, 16]} />
            <meshStandardMaterial
              color="#52525B"
              transparent
              opacity={0.65}
              roughness={0.1}
              metalness={0.15}
            />
          </mesh>
          {/* Roasted Coffee Beans inside Hopper */}
          <mesh position={[0, 0.62, 0]}>
            <coneGeometry args={[0.15, 0.22, 12]} />
            <meshStandardMaterial color="#452715" roughness={0.9} />
          </mesh>
          {/* Spout & Bag Clamp */}
          <mesh position={[0, 0.18, 0.15]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.03, 0.12, 12]} />
            <meshStandardMaterial color="#A1A1AA" metalness={0.9} />
          </mesh>
        </group>

        {/* --- Glass Pastry Showcase Vitrine --- */}
        <group position={[1.15, 1.42, 0]}>
          {/* Vitrine Base */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[1.5, 0.08, 0.85]} />
            <meshStandardMaterial color="#2E1C12" roughness={0.5} />
          </mesh>
          {/* Frameless Tempered Glass Cover with Realistic Refraction */}
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[1.44, 0.48, 0.8]} />
            <meshStandardMaterial
              color="#BAE6FD"
              opacity={0.3}
              transparent
              roughness={0.05}
              metalness={0.15}
            />
          </mesh>
          {/* Warm LED Strip Lighting inside Showcase */}
          <mesh position={[0, 0.49, 0]}>
            <boxGeometry args={[1.35, 0.015, 0.04]} />
            <meshStandardMaterial color="#FDE047" emissive="#F59E0B" emissiveIntensity={1.2} />
          </mesh>

          {/* Artisanal Pastries on Slate Platters */}
          <mesh position={[-0.4, 0.1, 0.05]} castShadow>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#C27830" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.1, -0.08]} castShadow>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#B45309" roughness={0.8} />
          </mesh>
          <mesh position={[0.4, 0.1, 0.05]} castShadow>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color="#D97706" roughness={0.8} />
          </mesh>
        </group>

        {/* --- Cashier POS Terminal & Screen --- */}
        <group position={[0.05, 1.42, 0.2]} rotation={[0, -0.22, 0]}>
          {/* Weighted Cast Aluminum Stand */}
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.035, 0.07, 0.26, 12]} />
            <meshStandardMaterial color="#27272A" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* 15.6" Touch Screen Display */}
          <mesh position={[0, 0.28, 0]} rotation={[-0.32, 0, 0]}>
            <boxGeometry args={[0.44, 0.3, 0.02]} />
            <meshStandardMaterial
              color="#09090B"
              emissive={hovered ? '#EA580C' : '#0B192C'}
              emissiveIntensity={hovered ? 0.8 : 0.4}
              metalness={0.5}
            />
          </mesh>
          {/* Receipt Thermal Printer */}
          <mesh position={[0.36, 0.09, 0]} castShadow>
            <boxGeometry args={[0.22, 0.17, 0.24]} />
            <meshStandardMaterial color="#1C1C22" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Printed Order Slip sticking out */}
          <mesh position={[0.36, 0.2, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.01]} />
            <meshStandardMaterial color="#FAF8F5" roughness={0.9} />
          </mesh>
        </group>

        {/* --- Barista Accessories on Counter (Pitcher, Tamper, Knockbox) --- */}
        {/* Stainless Steel Milk Frothing Pitcher with Pouring Spout */}
        <group position={[-0.32, 1.42, 0.32]}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.16, 16]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.95} roughness={0.08} />
          </mesh>
          <mesh position={[0.05, 0.08, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.95} roughness={0.08} />
          </mesh>
        </group>

        {/* Solid Walnut & Brass Espresso Precision Tamper on Rubber Mat */}
        <group position={[-0.14, 1.42, 0.38]}>
          {/* Silicone Mat */}
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[0.16, 0.01, 0.18]} />
            <meshStandardMaterial color="#18181B" roughness={0.9} />
          </mesh>
          {/* Brass Tamper Base */}
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.042, 0.042, 0.03, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Walnut Ergonomic Handle */}
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#3E271E" roughness={0.4} />
          </mesh>
        </group>

        {/* Barista Knock Box with Rubber Damping Crossbar */}
        <group position={[-1.6, 1.42, 0.28]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.22, 0.12, 0.22]} />
            <meshStandardMaterial color="#27272A" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 0.2, 12]} />
            <meshStandardMaterial color="#09090B" roughness={0.8} />
          </mesh>
        </group>

        {/* --- 3 Scandinavian Designer Bar Stools along Front Counter --- */}
        {[-0.8, 0.1, 1.0].map((bx, idx) => (
          <group key={`stool-${idx}`} position={[bx, 0, 1.15]}>
            {/* Dark Walnut Circular Seat */}
            <mesh position={[0, 0.84, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.045, 24]} />
              <meshStandardMaterial color="#362215" roughness={0.45} />
            </mesh>
            {/* 3 Angled Matte Black Steel Legs */}
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((rad, legIdx) => {
              const lx = Math.sin(rad) * 0.14;
              const lz = Math.cos(rad) * 0.14;
              return (
                <mesh
                  key={`leg-${legIdx}`}
                  position={[lx, 0.42, lz]}
                  rotation={[Math.cos(rad) * 0.08, 0, -Math.sin(rad) * 0.08]}
                  castShadow
                >
                  <cylinderGeometry args={[0.014, 0.018, 0.84, 8]} />
                  <meshStandardMaterial color="#18181B" metalness={0.7} roughness={0.3} />
                </mesh>
              );
            })}
            {/* Brass Circular Footrest Ring */}
            <mesh position={[0, 0.3, 0]}>
              <torusGeometry args={[0.16, 0.012, 8, 24]} />
              <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Floating Apple Vision Pro Style Spatial Context Tooltip */}
        <Html position={[0, 2.1, 0]} center distanceFactor={22}>
          <div
            className={`pointer-events-none transition-all duration-300 transform select-none scale-[0.65] sm:scale-80 md:scale-95 lg:scale-100 origin-center ${
              hovered ? 'scale-110 -translate-y-1' : 'opacity-90'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-stone-950/90 text-white backdrop-blur-md border border-amber-500/50 shadow-xl whitespace-nowrap">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[9px] sm:text-[11px] tracking-wider uppercase text-amber-300">
                  POS & Cashier
                </span>
                <span className="text-[8px] sm:text-[9px] text-stone-400 font-mono hidden sm:inline">
                  {activeOrdersCount} Active Tabs
                </span>
              </div>
              <span className="hidden md:inline text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded-md font-mono font-bold border border-amber-500/30">
                Click
              </span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
