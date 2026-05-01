"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef, useMemo, useEffect } from "react";
import type { Points, Group } from "three";
import * as THREE from "three";

/**
 * NetworkGlobe3D
 *
 * A 3D globe visualization composed of interconnected dots and lines,
 * resembling a neural network. The globe can be rotated using mouse cursor movements.
 * Represents global connectivity and trust for Ethi-Trust.
 */

// Fibonacci sphere for even point distribution
function fibonacciSphere(samples: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }

  return points;
}

// Generate connections between nearby points
function generateConnections(
  points: THREE.Vector3[],
  maxDistance: number,
): [number, number][] {
  const connections: [number, number][] = [];

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = points[i].distanceTo(points[j]);
      if (dist < maxDistance) {
        connections.push([i, j]);
      }
    }
  }

  return connections;
}

function Globe() {
  const groupRef = useRef<Group>(null);
  const pointsRef = useRef<Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const { pointer, viewport } = useThree();

  // Target rotation for smooth interpolation
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  // Generate globe points and connections
  const { positions, connections, linePositions, pointSizes } = useMemo(() => {
    const numPoints = 200;
    const radius = 1.8;
    const connectionDistance = 0.65;

    const spherePoints = fibonacciSphere(numPoints, radius);
    const conns = generateConnections(spherePoints, connectionDistance);

    // Flatten point positions for buffer geometry
    const posArray = new Float32Array(numPoints * 3);
    const sizeArray = new Float32Array(numPoints);

    for (let i = 0; i < spherePoints.length; i++) {
      posArray[i * 3] = spherePoints[i].x;
      posArray[i * 3 + 1] = spherePoints[i].y;
      posArray[i * 3 + 2] = spherePoints[i].z;
      // Vary point sizes slightly
      sizeArray[i] = 0.03 + Math.random() * 0.02;
    }

    // Create line positions
    const lineArray = new Float32Array(conns.length * 6);
    for (let i = 0; i < conns.length; i++) {
      const [a, b] = conns[i];
      lineArray[i * 6] = spherePoints[a].x;
      lineArray[i * 6 + 1] = spherePoints[a].y;
      lineArray[i * 6 + 2] = spherePoints[a].z;
      lineArray[i * 6 + 3] = spherePoints[b].x;
      lineArray[i * 6 + 4] = spherePoints[b].y;
      lineArray[i * 6 + 5] = spherePoints[b].z;
    }

    return {
      positions: posArray,
      connections: conns,
      linePositions: lineArray,
      pointSizes: sizeArray,
    };
  }, []);

  // Animated dots that travel along connections
  const travelingDots = useMemo(() => {
    // Select random connections for traveling dots
    const numTravelers = Math.min(15, Math.floor(connections.length * 0.1));
    const travelers: {
      connectionIdx: number;
      progress: number;
      speed: number;
    }[] = [];

    const shuffled = [...connections].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numTravelers; i++) {
      travelers.push({
        connectionIdx: i % shuffled.length,
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
      });
    }

    return travelers;
  }, [connections]);

  const travelerPositions = useRef(new Float32Array(travelingDots.length * 3));

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Update target rotation based on mouse position
    targetRotation.current.y = pointer.x * Math.PI * 0.5;
    targetRotation.current.x = -pointer.y * Math.PI * 0.25;

    // Smoothly interpolate current rotation towards target
    currentRotation.current.x +=
      (targetRotation.current.x - currentRotation.current.x) * 0.05;
    currentRotation.current.y +=
      (targetRotation.current.y - currentRotation.current.y) * 0.05;

    // Apply rotation with base auto-rotation
    if (groupRef.current) {
      groupRef.current.rotation.x = currentRotation.current.x;
      groupRef.current.rotation.y = currentRotation.current.y + t * 0.08;
    }

    // Pulse effect for points
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.7 + Math.sin(t * 2) * 0.15;
    }

    // Update traveling dots
    for (let i = 0; i < travelingDots.length; i++) {
      const traveler = travelingDots[i];
      traveler.progress += traveler.speed;

      if (traveler.progress > 1) {
        traveler.progress = 0;
        // Move to a random connection
        traveler.connectionIdx = Math.floor(Math.random() * connections.length);
      }

      const conn = connections[traveler.connectionIdx];
      if (conn) {
        const startIdx = conn[0] * 3;
        const endIdx = conn[1] * 3;
        const p = traveler.progress;

        travelerPositions.current[i * 3] =
          positions[startIdx] * (1 - p) + positions[endIdx] * p;
        travelerPositions.current[i * 3 + 1] =
          positions[startIdx + 1] * (1 - p) + positions[endIdx + 1] * p;
        travelerPositions.current[i * 3 + 2] =
          positions[startIdx + 2] * (1 - p) + positions[endIdx + 2] * p;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#888888"
          transparent
          opacity={0.25}
          linewidth={1}
        />
      </lineSegments>

      {/* Globe points/nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.045}
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      {/* Highlighted hub points (larger dots at key positions) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={Math.floor(positions.length / 3 / 8)}
            array={positions.slice(0, Math.floor(positions.length / 8))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#3aa371"
          size={0.08}
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>

      {/* Subtle outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.0, 64]} />
        <meshBasicMaterial
          color="#555555"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner structure hints - subtle latitude lines */}
      {[0.6, 1.2, 1.5].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.005, r + 0.005, 64]} />
          <meshBasicMaterial
            color="#666666"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Interaction hint overlay
function InteractionHint() {
  const { viewport } = useThree();

  return null; // Remove any in-scene UI, keep it minimal
}

export function EscrowVault3D({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.4} />
          <directionalLight position={[-5, -5, -5]} intensity={0.2} />
          <Globe />
        </Suspense>
      </Canvas>
    </div>
  );
}
