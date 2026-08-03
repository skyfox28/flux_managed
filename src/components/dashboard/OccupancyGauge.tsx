import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useLogistics } from "../../state/LogisticsContext";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { formatHoursMinutes } from "../../lib/format";

const SEGMENTS = 60;
const RADIUS = 1.65;

const STATUS_COLOR: Record<string, string> = {
  ok: "#34d399",
  warning: "#fb923c",
  critical: "#f8536a",
};

interface SegmentInfo {
  angle: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

function GaugeRing({ percent, status }: { percent: number; status: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const displayed = useRef(0);

  const litColor = useMemo(() => new THREE.Color(STATUS_COLOR[status]), [status]);
  const dimColor = useMemo(() => new THREE.Color("#1c2740"), []);

  const segments = useMemo<SegmentInfo[]>(() => {
    return Array.from({ length: SEGMENTS }).map((_, i) => {
      const angle = (i / SEGMENTS) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * RADIUS;
      const y = Math.sin(angle) * RADIUS;
      return {
        angle,
        position: [x, y, 0],
        rotation: [0, 0, angle + Math.PI / 2],
      };
    });
  }, []);

  useFrame((_, delta) => {
    displayed.current += (percent - displayed.current) * Math.min(1, delta * 3);
    const lit = Math.round((displayed.current / 100) * SEGMENTS);

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      const active = i < lit;
      material.color.lerp(active ? litColor : dimColor, 0.18);
      material.emissive.lerp(active ? litColor : new THREE.Color("#000000"), 0.18);
      material.emissiveIntensity = active ? 1.6 : 0.05;
    });

    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.06;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.5, 0, 0]}>
      {segments.map((seg, i) => (
        <mesh
          key={i}
          position={seg.position}
          rotation={seg.rotation}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
        >
          <boxGeometry args={[0.11, 0.3, 0.11]} />
          <meshStandardMaterial
            color="#1c2740"
            emissive="#000000"
            emissiveIntensity={0.05}
            roughness={0.35}
            metalness={0.6}
          />
        </mesh>
      ))}
      {/* track */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[RADIUS, 0.008, 8, 96]} />
        <meshBasicMaterial color="#12203a" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function OccupancyGauge() {
  const { derived } = useLogistics();
  const glow = STATUS_COLOR[derived.status];

  return (
    <div className="relative flex h-full flex-col items-center justify-center">
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-70 blur-2xl transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${glow}33, transparent 65%)`,
        }}
      />
      <div className="relative h-64 w-64 sm:h-72 sm:w-72">
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 40 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.55} />
          <pointLight position={[3, 3, 4]} intensity={40} color={glow} />
          <pointLight position={[-3, -2, 3]} intensity={12} color="#38bdf8" />
          <GaugeRing percent={derived.occupancyRate} status={derived.status} />
          <Html center>
            <div className="pointer-events-none flex w-40 flex-col items-center text-center">
              <span className="font-display text-4xl font-bold tabular-nums text-white text-glow-cyan sm:text-5xl">
                <AnimatedNumber value={Math.round(derived.occupancyRate)} suffix="%" />
              </span>
              <span className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Taux d'occupation
              </span>
            </div>
          </Html>
        </Canvas>
      </div>
      <p className="relative mt-1 text-center text-xs text-slate-400">
        {derived.marginHours >= 0
          ? `Marge disponible : ${formatHoursMinutes(derived.marginHours)}`
          : `Déficit : ${formatHoursMinutes(-derived.marginHours)}`}
      </p>
    </div>
  );
}
