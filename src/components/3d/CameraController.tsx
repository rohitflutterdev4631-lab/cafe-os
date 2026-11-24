'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface CameraTarget {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export const CAMERA_PRESETS: Record<string, CameraTarget> = {
  OVERVIEW: {
    position: [0, 11, 16],
    target: [0, 1, 0],
    fov: 42,
  },
  COUNTER_POS: {
    position: [-2.8, 3.2, 5.2],
    target: [-2.8, 1.35, 0],
    fov: 38,
  },
  DINING_FLOOR: {
    position: [3.8, 5.2, 8.2],
    target: [3.8, 1.0, 1.8],
    fov: 40,
  },
  KITCHEN: {
    position: [-6.2, 3.4, 0.8],
    target: [-7.5, 1.8, -4],
    fov: 36,
  },
  INVENTORY: {
    position: [-5.0, 3.6, -3.8],
    target: [-5.0, 1.8, -7.5],
    fov: 36,
  },
  OFFICE: {
    position: [5.2, 4.2, -2.8],
    target: [6.5, 1.8, -6.5],
    fov: 36,
  },
  TOP_VIEW: {
    position: [0, 19, 0.2],
    target: [0, 0, 0],
    fov: 45,
  },
  WALKTHROUGH: {
    position: [0, 2.1, 8.5],
    target: [0, 1.6, 0],
    fov: 52,
  },
};

interface CameraControllerProps {
  activePreset: string;
  customTarget?: CameraTarget | null;
  parallaxIntensity?: number; // 0 to 1
  enableParallax?: boolean;
  is360Active?: boolean;
  orbitSpeed?: number;
  isPaused360?: boolean;
  isAutoTour?: boolean;
  onNextAutoTourZone?: () => void;
}

export function CameraController({
  activePreset,
  customTarget,
  parallaxIntensity = 0.35,
  enableParallax = true,
  is360Active = false,
  orbitSpeed = 1.0,
  isPaused360 = false,
  isAutoTour = false,
  onNextAutoTourZone,
}: CameraControllerProps) {
  const { camera, pointer } = useThree();

  const desiredPos = useRef(new THREE.Vector3(...CAMERA_PRESETS.OVERVIEW.position));
  const desiredLookAt = useRef(new THREE.Vector3(...CAMERA_PRESETS.OVERVIEW.target));
  const currentLookAt = useRef(new THREE.Vector3(...CAMERA_PRESETS.OVERVIEW.target));

  // 360 Orbit State
  const orbitAngle = useRef(0);
  const orbitRadius = useRef(14);
  const orbitHeight = useRef(7);
  const lapAccumulator = useRef(0);

  useEffect(() => {
    let pos = CAMERA_PRESETS.OVERVIEW.position;
    let target = CAMERA_PRESETS.OVERVIEW.target;

    if (customTarget) {
      pos = customTarget.position;
      target = customTarget.target;
    } else if (CAMERA_PRESETS[activePreset]) {
      pos = CAMERA_PRESETS[activePreset].position;
      target = CAMERA_PRESETS[activePreset].target;
    }

    desiredPos.current.set(...pos);
    desiredLookAt.current.set(...target);

    // Calculate initial orbital radius & height relative to the target
    const dx = pos[0] - target[0];
    const dz = pos[2] - target[2];
    const calculatedRadius = Math.sqrt(dx * dx + dz * dz);
    orbitRadius.current = Math.max(calculatedRadius, 4.0);
    orbitHeight.current = pos[1] - target[1];

    // Align initial orbit angle with preset orientation
    orbitAngle.current = Math.atan2(dx, dz);
    lapAccumulator.current = 0;
  }, [activePreset, customTarget]);

  useFrame((_, delta) => {
    const lerpSpeed = Math.min(delta * 4.0, 1);

    if (is360Active) {
      // 360 Cinematic Orbit Flythrough
      if (!isPaused360) {
        const step = delta * 0.38 * orbitSpeed;
        orbitAngle.current += step;
        lapAccumulator.current += step;

        // In Auto-Tour mode, switch zone after completing a 360 orbit (~2*PI)
        if (isAutoTour && lapAccumulator.current >= Math.PI * 2) {
          lapAccumulator.current = 0;
          if (onNextAutoTourZone) {
            onNextAutoTourZone();
          }
        }
      }

      const orbitX = desiredLookAt.current.x + Math.sin(orbitAngle.current) * orbitRadius.current;
      const orbitZ = desiredLookAt.current.z + Math.cos(orbitAngle.current) * orbitRadius.current;
      const orbitY = desiredLookAt.current.y + orbitHeight.current;

      camera.position.lerp(new THREE.Vector3(orbitX, orbitY, orbitZ), lerpSpeed);
      currentLookAt.current.lerp(desiredLookAt.current, lerpSpeed);
      camera.lookAt(currentLookAt.current);
    } else {
      // Standard Camera Positioning with Parallax
      const parallaxX = enableParallax ? pointer.x * (0.45 * parallaxIntensity) : 0;
      const parallaxY = enableParallax ? pointer.y * (0.35 * parallaxIntensity) : 0;

      const targetWithParallax = new THREE.Vector3(
        desiredPos.current.x + parallaxX,
        desiredPos.current.y + parallaxY,
        desiredPos.current.z
      );

      camera.position.lerp(targetWithParallax, lerpSpeed);
      currentLookAt.current.lerp(desiredLookAt.current, lerpSpeed);
      camera.lookAt(currentLookAt.current);
    }
  });

  return null;
}
