"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Stars } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DEFAULT_THEME, readTheme, THEME_EVENT, type ThemeColors } from "@/lib/theme";

/** Tracks the live CSS-variable theme so the 3D scene recolors instantly. */
function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_THEME);

  useEffect(() => {
    const sync = () => setColors(readTheme());
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  return colors;
}

function CoreOrb({ colors }: { colors: ThemeColors }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * 0.12;
    // Gentle parallax toward the cursor
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, state.pointer.y * 0.22, 0.04);
    g.position.x = THREE.MathUtils.lerp(g.position.x, state.pointer.x * 0.5, 0.04);
    g.position.y = THREE.MathUtils.lerp(g.position.y, state.pointer.y * 0.3, 0.04);
  });

  return (
    <group ref={group}>
      <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.1}>
        {/* Morphing liquid core */}
        <mesh>
          <icosahedronGeometry args={[1.9, 24]} />
          <MeshDistortMaterial
            color={colors.primary}
            emissive={colors.primary}
            emissiveIntensity={0.25}
            roughness={0.18}
            metalness={0.85}
            distort={0.42}
            speed={1.8}
          />
        </mesh>

        {/* Wireframe shell */}
        <mesh scale={1.45}>
          <icosahedronGeometry args={[1.9, 2]} />
          <meshBasicMaterial
            color={colors.secondary}
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Orbital rings */}
        <mesh rotation={[Math.PI / 2.4, 0.4, 0]}>
          <torusGeometry args={[3.1, 0.016, 16, 160]} />
          <meshBasicMaterial color={colors.secondary} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 1.9, -0.5, 0.7]}>
          <torusGeometry args={[3.7, 0.009, 16, 160]} />
          <meshBasicMaterial color={colors.accent} transparent opacity={0.35} />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene() {
  const colors = useThemeColors();

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      className="!pointer-events-none"
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 4, 8]} intensity={1.6} decay={0} color={colors.secondary} />
      <pointLight position={[-6, -3, 6]} intensity={1.3} decay={0} color={colors.primary} />
      <CoreOrb colors={colors} />
      <Sparkles count={90} scale={9} size={2.2} speed={0.35} color={colors.secondary} opacity={0.55} />
      <Stars radius={70} depth={40} count={2200} factor={3.2} saturation={0} fade speed={0.8} />
    </Canvas>
  );
}
