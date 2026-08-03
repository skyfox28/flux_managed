import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useLogistics } from "../../state/LogisticsContext";

const STATUS_COLOR: Record<string, string> = {
  ok: "#34d399",
  warning: "#fb923c",
  critical: "#f8536a",
};

interface StreamProps {
  start: [number, number, number];
  end: [number, number, number];
  count: number;
  speed: number;
  color: string;
  size?: [number, number, number];
}

function ParticleStream({ start, end, count, speed, color, size = [0.16, 0.12, 0.16] }: StreamProps) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
  const endVec = useMemo(() => new THREE.Vector3(...end), [end]);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.1,
        roughness: 0.3,
        metalness: 0.4,
        transparent: true,
      }),
    [color],
  );

  useFrame(({ clock }) => {
    const t0 = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = i / count;
      const t = (t0 * speed * 0.15 + phase) % 1;
      mesh.position.lerpVectors(startVec, endVec, t);
      const fade = Math.sin(t * Math.PI); // 0 -> 1 -> 0
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.25 + fade * 0.9;
      mesh.scale.setScalar(0.6 + fade * 0.5);
    });
  });

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          material={material}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <boxGeometry args={size} />
        </mesh>
      ))}
    </group>
  );
}

function ScanRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta * 0.8;
      const s = 1 + Math.sin(Date.now() * 0.002) * 0.04;
      ref.current.scale.set(s, s, s);
    }
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
      <torusGeometry args={[0.85, 0.02, 8, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

function Station({
  position,
  label,
  children,
}: {
  position: [number, number, number];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <group position={position}>
      {children}
      <Html position={[0, -1.1, 0]} center distanceFactor={11} occlude={false}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-cyan-300/20 bg-black/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-cyan-200 backdrop-blur-sm">
          {label}
        </div>
      </Html>
    </group>
  );
}

function Scene() {
  const { inputs, derived } = useLogistics();
  const alertColor = STATUS_COLOR[derived.status];

  const siloSpeed = THREE.MathUtils.clamp(inputs.siloCadence / 18, 0.3, 3.5);
  const pickingSpeed = THREE.MathUtils.clamp(
    (inputs.pickingCadence * Math.max(1, derived.totalPreparateurs)) / (400 * 19),
    0.3,
    3.5,
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[-3, 3, 3]} intensity={30} color="#38bdf8" />
      <pointLight position={[3, 3, 2]} intensity={25} color={alertColor} />
      <directionalLight position={[0, 5, 5]} intensity={0.4} />

      <Grid
        position={[0, -1.15, 0]}
        args={[14, 14]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#123047"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#1c4f6e"
        fadeDistance={11}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* SILO — magasin automatique : source du flux (sortie palettes) */}
      <Station position={[-4.6, 0, 0]} label="Silo (sortie)">
        <mesh>
          <cylinderGeometry args={[0.6, 0.7, 1.7, 24]} />
          <meshPhysicalMaterial
            color="#0b2540"
            transmission={0.55}
            roughness={0.15}
            thickness={1.2}
            ior={1.3}
            emissive="#38bdf8"
            emissiveIntensity={0.25}
            clearcoat={1}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.62, 0.72, 1.72, 24, 1, true]} />
          <meshBasicMaterial color="#7fd9ff" wireframe transparent opacity={0.25} />
        </mesh>
      </Station>

      {/* PICKING */}
      <Station position={[0, -0.15, 0]} label="Picking">
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.2, 32]} />
          <meshStandardMaterial
            color="#0e2036"
            emissive="#22e8ff"
            emissiveIntensity={0.3}
            metalness={0.7}
            roughness={0.25}
          />
        </mesh>
        <ScanRing color={alertColor} />
      </Station>

      {/* EXPEDITION */}
      <Station position={[4.6, -0.35, 0]} label="Expédition">
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshStandardMaterial
            color="#3a2411"
            emissive="#fb923c"
            emissiveIntensity={0.6}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      </Station>

      {/* flux : sortie silo (magasin automatique) -> picking */}
      <ParticleStream
        start={[-4.4, 0.15, 0]}
        end={[-0.4, 0.15, 0]}
        count={6}
        speed={siloSpeed}
        color="#38bdf8"
      />
      {/* flux : picking -> expédition (colis) */}
      <ParticleStream
        start={[0.4, 0.05, 0]}
        end={[4.2, -0.15, 0]}
        count={10}
        speed={pickingSpeed}
        color="#22e8ff"
        size={[0.1, 0.08, 0.1]}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-0.5}
        maxAzimuthAngle={0.5}
      />
    </>
  );
}

export function FlowScene() {
  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl">
      <Canvas camera={{ position: [0, 1.9, 9.2], fov: 38 }} dpr={[1, 1.6]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <fog attach="fog" args={["#05070d", 8, 16]} />
      </Canvas>
    </div>
  );
}
