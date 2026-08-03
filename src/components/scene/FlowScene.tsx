import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useLogistics } from "../../state/LogisticsContext";

const STATUS_COLOR: Record<string, string> = {
  ok: "#34d399",
  warning: "#fb923c",
  critical: "#f8536a",
};

/* ---------------------------------------------------------------------- */
/* Flux courbes entre tours (particules le long d'une courbe de Bézier)   */
/* ---------------------------------------------------------------------- */

interface StreamProps {
  curve: THREE.QuadraticBezierCurve3;
  count: number;
  speed: number;
  color: string;
  size?: number;
}

function CurveStream({ curve, count, speed, color, size = 0.1 }: StreamProps) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.3,
        roughness: 0.3,
        metalness: 0.3,
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
      curve.getPoint(t, mesh.position);
      const fade = Math.sin(t * Math.PI);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.2 + fade * 0.9;
      mesh.scale.setScalar(0.5 + fade * 0.6);
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
          <octahedronGeometry args={[size, 0]} />
        </mesh>
      ))}
    </group>
  );
}

function FlowPath({ curve, color, opacity }: { curve: THREE.QuadraticBezierCurve3; color: string; opacity: number }) {
  const geometry = useMemo(() => {
    const points = curve.getPoints(32);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curve]);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    [color, opacity],
  );
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);
  return <primitive object={line} />;
}

/* ---------------------------------------------------------------------- */
/* Tour de données : hauteur pilotée par la charge réelle (0..~1.4)       */
/* ---------------------------------------------------------------------- */

interface TowerProps {
  position: [number, number, number];
  ratio: number; // 0 = vide, 1 = pleine capacité, >1 = en dépassement
  color: string;
  label: string;
}

const TOWER_BASE_Y = -0.9;
const TOWER_MIN_HEIGHT = 0.55;
const TOWER_MAX_HEIGHT = 2.5;

function Tower({ position, ratio, color, label }: TowerProps) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const displayed = useRef(TOWER_MIN_HEIGHT);
  const overload = ratio > 1;

  const targetHeight = useMemo(
    () =>
      TOWER_MIN_HEIGHT +
      (Math.min(1.4, Math.max(0, ratio)) * (TOWER_MAX_HEIGHT - TOWER_MIN_HEIGHT)) / 1.4,
    [ratio],
  );
  const tint = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state, delta) => {
    displayed.current += (targetHeight - displayed.current) * Math.min(1, delta * 2.2);
    const h = displayed.current;

    if (bodyRef.current) {
      bodyRef.current.scale.y = h;
      bodyRef.current.position.y = TOWER_BASE_Y + h / 2;
      const mat = bodyRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissive.lerp(tint, 0.15);
      mat.emissiveIntensity = overload ? 0.55 + Math.sin(state.clock.elapsedTime * 4) * 0.25 : 0.35;
    }
    if (coreRef.current) {
      coreRef.current.position.y = TOWER_BASE_Y + h + 0.08;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * (overload ? 5 : 2)) * 0.12;
      coreRef.current.scale.setScalar(pulse);
    }
    if (ringRef.current) {
      ringRef.current.position.y = TOWER_BASE_Y + h + 0.08;
      ringRef.current.rotation.z += delta * (overload ? 1.4 : 0.5);
    }
  });

  return (
    <group position={position}>
      {/* socle */}
      <mesh position={[0, TOWER_BASE_Y - 0.04, 0]}>
        <cylinderGeometry args={[0.68, 0.76, 0.08, 6]} />
        <meshStandardMaterial color="#0b1220" emissive={color} emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* corps (prisme hexagonal, hauteur unitaire mise à l'échelle) */}
      <mesh ref={bodyRef} position={[0, TOWER_BASE_Y, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 1, 6, 1, true]} />
        <meshPhysicalMaterial
          color="#0c1c30"
          transmission={0.5}
          roughness={0.2}
          thickness={0.8}
          ior={1.25}
          emissive={color}
          emissiveIntensity={0.35}
          clearcoat={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* coeur lumineux au sommet */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
      </mesh>

      {/* anneau holographique */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.014, 8, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.75} />
        </mesh>
      </group>

      <Html position={[0, TOWER_BASE_Y - 0.55, 0]} center distanceFactor={7} occlude={false}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-white/15 bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-100 backdrop-blur-sm">
          {label}
        </div>
      </Html>
    </group>
  );
}

/* ---------------------------------------------------------------------- */

function Platform({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.04;
  });
  return (
    <group position={[0, -0.98, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.6, 64]} />
        <meshStandardMaterial color="#070c17" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[6.1, 6.18, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[3.2, 3.23, 96]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function Dust() {
  const positions = useMemo(() => {
    const arr = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 13;
      arr[i * 3 + 1] = Math.random() * 2.2 - 0.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    return arr;
  }, []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#7fd9ff" size={0.03} transparent opacity={0.35} sizeAttenuation />
    </points>
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

  const siloRatio = inputs.siloWindowHours > 0 ? derived.siloChargeHours / inputs.siloWindowHours : 0;
  const pickingRatio =
    derived.totalCapacityHours > 0 ? derived.pickingChargeHours / derived.totalCapacityHours : 0;
  const expeditionRatio = Math.min(1.4, derived.occupancyRate / 100);

  const towerPositions: [number, number, number][] = [
    [-4.6, 0, 0],
    [0, 0, 0],
    [4.6, 0, 0],
  ];

  const curve1 = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(towerPositions[0][0] + 0.6, TOWER_BASE_Y + 0.45, 0),
        new THREE.Vector3(-2.3, TOWER_BASE_Y + 1.5, 0),
        new THREE.Vector3(towerPositions[1][0] - 0.6, TOWER_BASE_Y + 0.45, 0),
      ),
    [],
  );
  const curve2 = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(towerPositions[1][0] + 0.6, TOWER_BASE_Y + 0.4, 0),
        new THREE.Vector3(2.3, TOWER_BASE_Y + 1.35, 0),
        new THREE.Vector3(towerPositions[2][0] - 0.6, TOWER_BASE_Y + 0.35, 0),
      ),
    [],
  );

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[-3, 3, 3]} intensity={35} color="#38bdf8" />
      <pointLight position={[3, 3, 2]} intensity={28} color={alertColor} />
      <directionalLight position={[0, 5, 5]} intensity={0.35} />

      <Platform color={alertColor} />
      <Dust />

      <Tower position={towerPositions[0]} ratio={siloRatio} color="#38bdf8" label="Silo" />
      <Tower position={towerPositions[1]} ratio={pickingRatio} color="#22e8ff" label="Picking" />
      <Tower position={towerPositions[2]} ratio={expeditionRatio} color={alertColor} label="Expédition" />

      <FlowPath curve={curve1} color="#38bdf8" opacity={0.25} />
      <FlowPath curve={curve2} color="#22e8ff" opacity={0.25} />
      <CurveStream curve={curve1} count={6} speed={siloSpeed} color="#38bdf8" />
      <CurveStream curve={curve2} count={9} speed={pickingSpeed} color="#22e8ff" size={0.08} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 2.7}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-0.5}
        maxAzimuthAngle={0.5}
      />
    </>
  );
}

export function FlowScene() {
  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl">
      <Canvas camera={{ position: [0, 2.3, 8.5], fov: 26 }} dpr={[1, 1.6]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <fog attach="fog" args={["#05070d", 9, 20]} />
      </Canvas>
    </div>
  );
}
