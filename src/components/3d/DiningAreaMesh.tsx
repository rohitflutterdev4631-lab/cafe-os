'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';

export interface TableData {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'BLOCKED';
  position: [number, number, number];
  currentOrder?: {
    orderNumber: string;
    totalAmount: number;
    durationMinutes: number;
  };
}

interface DiningAreaMeshProps {
  tables: TableData[];
  onSelectTable: (table: TableData) => void;
}

export function DiningAreaMesh({ tables, onSelectTable }: DiningAreaMeshProps) {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  return (
    <group>
      {/* --- Booth / Banquette Leather Sofa Seating 1 (Near Right Wall) --- */}
      <group position={[8.5, 0, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Wood Banquette Base */}
        <mesh position={[0, 0.22, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.44, 0.85]} />
          <meshStandardMaterial color="#2B1A10" roughness={0.6} />
        </mesh>
        {/* Fluted Cognac Leather Seat Cushion */}
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[3.15, 0.16, 0.8]} />
          <meshStandardMaterial color="#965624" roughness={0.4} />
        </mesh>
        {/* Tufted Leather Backrest */}
        <mesh position={[0, 1.05, -0.34]} castShadow>
          <boxGeometry args={[3.15, 1.0, 0.16]} />
          <meshStandardMaterial color="#84481C" roughness={0.4} />
        </mesh>
      </group>

      {/* --- Dining Tables Grid --- */}
      {tables.map((table) => {
        const isHovered = hoveredTable === table.id;
        const isOccupied = table.status === 'OCCUPIED';
        const isReserved = table.status === 'RESERVED';

        let badgeBg = 'bg-stone-950/90 text-white border-emerald-500/40';
        let statusDot = 'bg-emerald-400';
        if (isOccupied) {
          badgeBg = 'bg-stone-950/90 text-white border-amber-500/40';
          statusDot = 'bg-amber-400';
        } else if (isReserved) {
          badgeBg = 'bg-stone-950/90 text-white border-blue-500/40';
          statusDot = 'bg-blue-400';
        }

        return (
          <group
            key={table.id}
            position={table.position}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredTable(table.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredTable(null);
              document.body.style.cursor = 'auto';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTable(table);
            }}
          >
            {/* Table Top - Warm European White Oak with Beveled Chamfer */}
            <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.78, 0.78, 0.065, 36]} />
              <meshStandardMaterial
                color={isHovered ? '#DFB992' : '#C1986B'}
                roughness={0.32}
                metalness={0.06}
                emissive={isHovered ? '#B45309' : '#000000'}
                emissiveIntensity={isHovered ? 0.22 : 0}
              />
            </mesh>

            {/* Brass Edge Band Accent */}
            <mesh position={[0, 0.92, 0]}>
              <cylinderGeometry args={[0.785, 0.785, 0.02, 36]} />
              <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Center Fluted Pedestal Stem - Matte Cast Iron */}
            <mesh position={[0, 0.46, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.075, 0.88, 16]} />
              <meshStandardMaterial color="#1A1A1E" roughness={0.7} metalness={0.5} />
            </mesh>
            {/* Stepped Cast Iron Base Plate */}
            <mesh position={[0, 0.025, 0]} receiveShadow>
              <cylinderGeometry args={[0.42, 0.44, 0.05, 24]} />
              <meshStandardMaterial color="#1A1A1E" roughness={0.7} metalness={0.5} />
            </mesh>

            {/* Tableware (Ceramic Cups with Latte Art on Occupied Tables) */}
            {isOccupied && (
              <group position={[0.22, 0.98, 0.12]}>
                {/* Ceramic Cup */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.055, 0.04, 0.09, 16]} />
                  <meshStandardMaterial color="#FDFBF7" roughness={0.15} />
                </mesh>
                {/* Steamed Crema / Latte Art Liquid Surface */}
                <mesh position={[0, 0.042, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.005, 16]} />
                  <meshStandardMaterial color="#8D5B2E" roughness={0.8} />
                </mesh>
                {/* Small Saucer */}
                <mesh position={[0, -0.045, 0]}>
                  <cylinderGeometry args={[0.08, 0.075, 0.01, 16]} />
                  <meshStandardMaterial color="#FDFBF7" roughness={0.15} />
                </mesh>
                {/* Clear Ribbed Water Tumbler */}
                <mesh position={[-0.38, 0.02, -0.18]} castShadow>
                  <cylinderGeometry args={[0.038, 0.032, 0.12, 12]} />
                  <meshStandardMaterial color="#BAE6FD" opacity={0.4} transparent roughness={0.1} />
                </mesh>
              </group>
            )}

            {/* Brass Table Number Marker Stand */}
            <group position={[-0.24, 0.95, 0.22]}>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.11, 0]}>
                <boxGeometry args={[0.07, 0.05, 0.005]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>

            {/* Warm Radial Table Pool Light */}
            <pointLight
              position={[0, 2.2, 0]}
              color="#FEF3C7"
              intensity={0.9}
              distance={4.5}
              decay={2}
            />

            {/* 4 Scandinavian Dining Chairs with Curved Backrests */}
            {[-0.92, 0.92].map((offset, idx) => (
              <group
                key={`chair-pair-${idx}`}
                position={[offset, 0, 0]}
                rotation={[0, offset > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
              >
                {/* Seat Cushion */}
                <mesh position={[0, 0.52, 0]} castShadow>
                  <boxGeometry args={[0.44, 0.05, 0.44]} />
                  <meshStandardMaterial color="#2B1A10" roughness={0.6} />
                </mesh>
                {/* Tapered Legs with Brass Tips */}
                {[
                  [-0.18, -0.18],
                  [0.18, -0.18],
                  [-0.18, 0.18],
                  [0.18, 0.18],
                ].map(([lx, lz], lidx) => (
                  <group key={`leg-${lidx}`} position={[lx, 0.26, lz]}>
                    <mesh>
                      <cylinderGeometry args={[0.018, 0.022, 0.52, 8]} />
                      <meshStandardMaterial color="#18181B" metalness={0.4} />
                    </mesh>
                    <mesh position={[0, -0.22, 0]}>
                      <cylinderGeometry args={[0.02, 0.024, 0.06, 8]} />
                      <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
                    </mesh>
                  </group>
                ))}
                {/* Curved Walnut Steam-Bent Backrest */}
                <mesh position={[0, 0.82, -0.2]} castShadow>
                  <boxGeometry args={[0.44, 0.32, 0.035]} />
                  <meshStandardMaterial color="#2B1A10" roughness={0.6} />
                </mesh>
              </group>
            ))}

            {/* Spatial Context Card (Apple Vision Pro Style Glass Badge) */}
            <Html position={[0, 1.4, 0]} center distanceFactor={22}>
              <div
                className={`cursor-pointer transition-all duration-300 transform select-none ${
                  isHovered ? 'scale-110 -translate-y-1' : 'scale-100 opacity-95'
                }`}
              >
                <div
                  className={`flex flex-col items-center px-2.5 py-1 rounded-xl ${badgeBg} backdrop-blur-md border shadow-lg`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot} ${isOccupied ? 'animate-pulse' : ''}`} />
                    <span className="font-extrabold text-[11px] tracking-tight">Table {table.tableNumber}</span>
                    <span className="text-[9px] text-stone-400">({table.capacity}p)</span>
                  </div>

                  {isOccupied && table.currentOrder ? (
                    <div className="text-[9px] text-amber-300 font-mono mt-0.5 font-bold">
                      ₹{table.currentOrder.totalAmount} • {table.currentOrder.durationMinutes}m
                    </div>
                  ) : table.status === 'AVAILABLE' ? (
                    <span className="text-[8px] text-emerald-400 uppercase tracking-widest font-bold">
                      Available
                    </span>
                  ) : (
                    <span className="text-[8px] text-blue-300 uppercase tracking-widest font-bold">
                      Reserved
                    </span>
                  )}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
