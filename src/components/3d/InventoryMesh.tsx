'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';

interface InventoryMeshProps {
  onSelectZone: (zone: string) => void;
  lowStockCount?: number;
}

export function InventoryMesh({ onSelectZone, lowStockCount = 2 }: InventoryMeshProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[-5, 0, -7.5]}>
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
          onSelectZone('INVENTORY');
        }}
      >
        {/* Industrial Matte Black Steel Rack Uprights */}
        {[-1.2, 1.2].map((x, idx) => (
          <group key={`upright-${idx}`} position={[x, 1.6, 0]}>
            <mesh position={[0, 0, -0.32]} castShadow>
              <boxGeometry args={[0.07, 3.2, 0.07]} />
              <meshStandardMaterial color="#201E1C" metalness={0.8} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.32]} castShadow>
              <boxGeometry args={[0.07, 3.2, 0.07]} />
              <meshStandardMaterial color="#201E1C" metalness={0.8} roughness={0.25} />
            </mesh>
            {/* Diagonal Cross Brace */}
            <mesh position={[0, 0, 0]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[0.03, 0.85, 0.03]} />
              <meshStandardMaterial color="#2B2824" metalness={0.7} />
            </mesh>
          </group>
        ))}

        {/* 4 Heavy-Duty Solid Oak Shelf Planks */}
        {[0.42, 1.25, 2.08, 2.9].map((y, idx) => (
          <mesh key={`plank-${idx}`} position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 0.065, 0.76]} />
            <meshStandardMaterial
              color={hovered ? '#B47B49' : '#8A582D'}
              roughness={0.45}
              metalness={0.05}
              emissive={hovered ? '#452715' : '#000000'}
              emissiveIntensity={hovered ? 0.25 : 0}
            />
          </mesh>
        ))}

        {/* Shelf Tier 1: Textured Burlap Coffee Sacks (Yirgacheffe & Supremo) */}
        <group position={[-0.7, 0.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#9C7A5B" roughness={0.92} />
          </mesh>
          {/* Stencil Label Tag */}
          <mesh position={[0, 0, 0.255]}>
            <planeGeometry args={[0.3, 0.2]} />
            <meshStandardMaterial color="#2B1A10" roughness={0.9} />
          </mesh>
        </group>
        <group position={[0, 0.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#886244" roughness={0.92} />
          </mesh>
        </group>
        <group position={[0.7, 0.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#9C7A5B" roughness={0.92} />
          </mesh>
        </group>

        {/* Shelf Tier 2: Dairy Whole Milk & Oat Milk Crates */}
        <group position={[-0.6, 1.48, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.38, 0.45]} />
            <meshStandardMaterial color="#1E3A8A" roughness={0.35} metalness={0.1} />
          </mesh>
        </group>
        <group position={[0.45, 1.48, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.38, 0.45]} />
            <meshStandardMaterial color="#0F766E" roughness={0.35} metalness={0.1} />
          </mesh>
        </group>

        {/* Shelf Tier 3: Artisan Syrup Bottles with Brass Pump Dispensers */}
        {[-0.8, -0.5, -0.2].map((bx, idx) => (
          <group key={`syrup-${idx}`} position={[bx, 2.3, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.065, 0.065, 0.36, 16]} />
              <meshStandardMaterial
                color={idx === 0 ? '#78350F' : idx === 1 ? '#C2410C' : '#92400E'}
                roughness={0.15}
                metalness={0.25}
              />
            </mesh>
            {/* Pump Head */}
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
              <meshStandardMaterial color="#D4AF37" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Takeaway Nested Ripple Cup Stacks */}
        {[0.3, 0.6, 0.9].map((cx, idx) => (
          <group key={`cup-stack-${idx}`} position={[cx, 2.32, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.1, 0.075, 0.4, 16]} />
              <meshStandardMaterial color="#D97706" roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* Floating Spatial Label */}
        <Html position={[0, 3.4, 0]} center distanceFactor={22}>
          <div
            className={`pointer-events-none transition-all duration-300 transform select-none scale-[0.65] sm:scale-80 md:scale-95 lg:scale-100 origin-center ${
              hovered ? 'scale-110 -translate-y-1' : 'opacity-95'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-stone-950/90 text-white backdrop-blur-md border border-blue-500/50 shadow-xl whitespace-nowrap">
              <span
                className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0 ${
                  lowStockCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-[9px] sm:text-[11px] tracking-wider uppercase text-blue-400">
                  Inventory
                </span>
                <span className="text-[8px] sm:text-[9px] text-stone-400 font-mono hidden sm:inline">
                  {lowStockCount > 0 ? `${lowStockCount} Low` : 'Optimal'}
                </span>
              </div>
              <span className="hidden md:inline text-[9px] bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded-md font-mono font-bold border border-blue-500/30">
                Click
              </span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
