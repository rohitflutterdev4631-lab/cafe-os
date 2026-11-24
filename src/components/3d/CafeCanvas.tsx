'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraController, CameraTarget } from './CameraController';
import { CoffeeBarMesh } from './CoffeeBarMesh';
import { KitchenMesh } from './KitchenMesh';
import { DiningAreaMesh, TableData } from './DiningAreaMesh';
import { InventoryMesh } from './InventoryMesh';
import { OfficeMesh } from './OfficeMesh';
import { CafeInteriorMesh } from './CafeInteriorMesh';

interface CafeCanvasProps {
  activePreset: string;
  customTarget?: CameraTarget | null;
  onSelectZone: (zone: string) => void;
  onSelectTable: (table: TableData) => void;
  tables: TableData[];
  metrics?: {
    activeOrdersCount?: number;
    lowStockCount?: number;
    reservationCount?: number;
  };
  quality?: 'high' | 'medium' | 'low';
  is360Active?: boolean;
  orbitSpeed?: number;
  isPaused360?: boolean;
  isAutoTour?: boolean;
  onNextAutoTourZone?: () => void;
}

export function CafeCanvas({
  activePreset,
  customTarget,
  onSelectZone,
  onSelectTable,
  tables,
  metrics,
  quality = 'high',
  is360Active = false,
  orbitSpeed = 1.0,
  isPaused360 = false,
  isAutoTour = false,
  onNextAutoTourZone,
}: CafeCanvasProps) {
  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        shadows={quality !== 'low'}
        dpr={quality === 'high' ? [1, 2] : 1}
        camera={{ position: [0, 11, 16], fov: 42 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <Suspense fallback={null}>
          <CameraController
            activePreset={activePreset}
            customTarget={customTarget}
            enableParallax={!is360Active}
            parallaxIntensity={0.35}
            is360Active={is360Active}
            orbitSpeed={orbitSpeed}
            isPaused360={isPaused360}
            isAutoTour={isAutoTour}
            onNextAutoTourZone={onNextAutoTourZone}
          />

          <OrbitControls
            enabled={!is360Active}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2.05} // prevent going below floor
            minDistance={2.5}
            maxDistance={30}
          />

          {/* Warm Scandinavian Ambient Lighting */}
          <ambientLight intensity={0.65} color="#FFFBEB" />

          {/* Sun / Architectural Window Directional Light */}
          <directionalLight
            position={[12, 10, 4]}
            intensity={1.3}
            color="#FEF3C7"
            castShadow={quality !== 'low'}
            shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
            shadow-bias={-0.0001}
            shadow-camera-near={0.5}
            shadow-camera-far={40}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
          />

          {/* Soft Skylight Fill from Entrance */}
          <directionalLight position={[-10, 8, -6]} intensity={0.4} color="#E0F2FE" />

          {/* Barista Counter Architectural Spotlight */}
          <spotLight
            position={[-3, 6.5, 2.5]}
            target-position={[-3, 1, 0]}
            intensity={0.9}
            angle={0.55}
            penumbra={0.6}
            color="#FEF08A"
            castShadow={quality === 'high'}
          />

          {/* Scene Modules */}
          <CafeInteriorMesh
            onSelectZone={onSelectZone}
            reservationCount={metrics?.reservationCount}
          />

          <CoffeeBarMesh
            onSelectZone={onSelectZone}
            activeOrdersCount={metrics?.activeOrdersCount}
          />

          <KitchenMesh
            onSelectZone={onSelectZone}
            activeOrdersCount={metrics?.activeOrdersCount}
          />

          <DiningAreaMesh tables={tables} onSelectTable={onSelectTable} />

          <InventoryMesh
            onSelectZone={onSelectZone}
            lowStockCount={metrics?.lowStockCount}
          />

          <OfficeMesh onSelectZone={onSelectZone} />
        </Suspense>
      </Canvas>
    </div>
  );
}
