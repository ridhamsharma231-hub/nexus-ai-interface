import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

/* ─────────────────────────────────────────────
   OrbScene — rendered inside the R3F Canvas.
   Gets the orbState prop to drive animations.
   ───────────────────────────────────────────── */

// Map state → target material/animation values
const STATE_CONFIG = {
  idle:    { emissiveIntensity: 0.4,  distort: 0.28, speed: 1.2,  particleSpeed: 0.3, color: '#0a1a2e', emissive: '#0c3a5a' },
  active:  { emissiveIntensity: 0.6,  distort: 0.34, speed: 1.5,  particleSpeed: 0.5, color: '#0a1a30', emissive: '#0d4a70' },
  loading: { emissiveIntensity: 0.9,  distort: 0.55, speed: 3.0,  particleSpeed: 1.4, color: '#061525', emissive: '#0b4878' },
  success: { emissiveIntensity: 0.65, distort: 0.2,  speed: 0.8,  particleSpeed: 0.3, color: '#041a10', emissive: '#0a4a28' },
  error:   { emissiveIntensity: 0.5,  distort: 0.18, speed: 0.7,  particleSpeed: 0.2, color: '#1a0606', emissive: '#5a1010' },
}

// Lerp helper
function lerp(a, b, t) { return a + (b - a) * t }

/* ─── Inner core — the bright energy nucleus ─── */
function CoreSphere({ orbState }) {
  const meshRef = useRef()
  const matRef = useRef()
  const cfg = STATE_CONFIG[orbState] ?? STATE_CONFIG.idle

  const baseColor = useMemo(() => new THREE.Color(
    orbState === 'success' ? '#00e080' :
    orbState === 'error'   ? '#f05050' :
    orbState === 'loading' ? '#20a8ff' :
    '#22d3ee'
  ), [orbState])

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return
    const t = state.clock.elapsedTime
    // Breathing scale
    const targetScale = orbState === 'loading'
      ? 0.36 + Math.sin(t * 3.5) * 0.06
      : 0.32 + Math.sin(t * 0.9) * 0.025
    meshRef.current.scale.setScalar(
      lerp(meshRef.current.scale.x, targetScale, delta * 4)
    )
    // Emissive intensity
    const targetEI = cfg.emissiveIntensity + (orbState === 'loading' ? Math.sin(t * 4) * 0.2 : 0)
    matRef.current.emissiveIntensity = lerp(matRef.current.emissiveIntensity, targetEI, delta * 3)
    // Color lerp
    matRef.current.emissive.lerp(baseColor, delta * 2.5)
  })

  return (
    <mesh ref={meshRef} scale={0.32}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        ref={matRef}
        color="#060c18"
        emissive={baseColor}
        emissiveIntensity={cfg.emissiveIntensity}
        roughness={0.1}
        metalness={0.05}
        transparent
        opacity={0.95}
      />
    </mesh>
  )
}

/* ─── Outer shell — translucent, distorted ─── */
function OuterShell({ orbState }) {
  const meshRef = useRef()
  const matRef = useRef()
  const cfg = STATE_CONFIG[orbState] ?? STATE_CONFIG.idle

  const shellColor = useMemo(() => new THREE.Color(
    orbState === 'success' ? '#00c06a' :
    orbState === 'error'   ? '#d04040' :
    '#22d3ee'
  ), [orbState])

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return
    const t = state.clock.elapsedTime
    // Slow rotation
    meshRef.current.rotation.y += delta * (orbState === 'loading' ? 0.4 : 0.08)
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.06
    // Emissive color
    matRef.current.emissive.lerp(shellColor, delta * 1.5)
    matRef.current.emissiveIntensity = lerp(
      matRef.current.emissiveIntensity,
      orbState === 'loading' ? 0.12 + Math.sin(t * 2.5) * 0.05 : 0.06,
      delta * 2
    )
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1}>
      <MeshDistortMaterial
        ref={matRef}
        color="#050d1a"
        emissive={shellColor}
        emissiveIntensity={0.06}
        distort={cfg.distort}
        speed={cfg.speed}
        roughness={0.05}
        metalness={0.15}
        transparent
        opacity={0.55}
        side={THREE.FrontSide}
        depthWrite={false}
      />
    </Sphere>
  )
}

/* ─── Orbital particle ring ─── */
function ParticleRing({ orbState }) {
  const pointsRef = useRef()
  const PARTICLE_COUNT = 180

  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const phases = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2
      const radius = 1.28 + (Math.random() - 0.5) * 0.22
      const ySpread = (Math.random() - 0.5) * 0.18
      positions[i * 3]     = Math.cos(angle) * radius
      positions[i * 3 + 1] = ySpread
      positions[i * 3 + 2] = Math.sin(angle) * radius
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, phases }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))
    return geo
  }, [positions])

  const particleColor = useMemo(() => {
    if (orbState === 'success') return new THREE.Color('#34d399')
    if (orbState === 'error')   return new THREE.Color('#f87171')
    if (orbState === 'loading') return new THREE.Color('#60c8ff')
    return new THREE.Color('#22d3ee')
  }, [orbState])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const t = state.clock.elapsedTime
    const cfg = STATE_CONFIG[orbState] ?? STATE_CONFIG.idle
    const posAttr = pointsRef.current.geometry.attributes.position

    pointsRef.current.rotation.y += delta * cfg.particleSpeed * 0.25

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phase = phases[i]
      const origX = positions[i * 3]
      const origZ = positions[i * 3 + 2]
      const radius = Math.sqrt(origX * origX + origZ * origZ)
      const angle = Math.atan2(origZ, origX) + t * cfg.particleSpeed * 0.08

      posAttr.setX(i, Math.cos(angle) * radius)
      posAttr.setZ(i, Math.sin(angle) * radius)
      posAttr.setY(i, positions[i * 3 + 1] + Math.sin(t * 1.8 + phase) * 0.04)
    }
    posAttr.needsUpdate = true

    // Color
    pointsRef.current.material.color.lerp(particleColor, delta * 2)
    const targetOpacity = orbState === 'loading' ? 0.7 : orbState === 'idle' ? 0.35 : 0.55
    pointsRef.current.material.opacity = lerp(pointsRef.current.material.opacity, targetOpacity, delta * 3)
    const targetSize = orbState === 'loading' ? 0.022 : 0.016
    pointsRef.current.material.size = lerp(pointsRef.current.material.size, targetSize, delta * 3)
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={particleColor}
        size={0.016}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ─── Secondary halo ring ─── */
function HaloRing({ orbState }) {
  const ringRef = useRef()
  const matRef = useRef()

  const ringColor = useMemo(() => {
    if (orbState === 'success') return new THREE.Color('#34d399')
    if (orbState === 'error')   return new THREE.Color('#f87171')
    return new THREE.Color('#22d3ee')
  }, [orbState])

  useFrame((state, delta) => {
    if (!ringRef.current || !matRef.current) return
    ringRef.current.rotation.z += delta * 0.04
    ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05
    matRef.current.color.lerp(ringColor, delta * 1.5)
    const targetOpacity = orbState === 'loading' ? 0.22 : 0.10
    matRef.current.opacity = lerp(matRef.current.opacity, targetOpacity, delta * 2)
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.38, 0.004, 8, 180]} />
      <meshBasicMaterial ref={matRef} color="#22d3ee" transparent opacity={0.10} depthWrite={false} />
    </mesh>
  )
}

/* ─── Scene lights ─── */
function SceneLights({ orbState }) {
  const light1Ref = useRef()
  const light2Ref = useRef()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (light1Ref.current) {
      const targetIntensity = orbState === 'loading' ? 1.8 + Math.sin(t * 3) * 0.4 : 0.8
      light1Ref.current.intensity = lerp(light1Ref.current.intensity, targetIntensity, delta * 2)
    }
  })

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight ref={light1Ref} position={[0, 2, 2]} color="#22d3ee" intensity={0.8} />
      <pointLight ref={light2Ref} position={[-2, -1, 1]} color="#8b5cf6" intensity={0.35} />
      <pointLight position={[2, -1, -1]} color="#3b82f6" intensity={0.2} />
    </>
  )
}

/* ─── Scene root ─── */
function OrbScene({ orbState }) {
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    // Gentle hover breathe
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.03
    // Subtle tilt
    groupRef.current.rotation.z = Math.sin(t * 0.25) * 0.015
  })

  return (
    <group ref={groupRef}>
      <SceneLights orbState={orbState} />
      <OuterShell orbState={orbState} />
      <CoreSphere orbState={orbState} />
      <ParticleRing orbState={orbState} />
      <HaloRing orbState={orbState} />
    </group>
  )
}

/* ─── WebGL fallback ─── */
function OrbFallback({ orbState }) {
  return (
    <div
      className={`orb-fallback orb-fallback-${orbState}`}
      role="img"
      aria-label={`NEXUS orb — ${orbState}`}
    >
      <div className="orb-fallback-inner" />
    </div>
  )
}

/* ─────────────────────────────────────────────
   Orb3D — public component
   Checks WebGL support, renders Canvas or fallback.
   ───────────────────────────────────────────── */
function Orb3D({ orbState = 'idle' }) {
  const ariaMap = {
    idle:    'NEXUS spatial orb — ready',
    active:  'NEXUS spatial orb — listening',
    loading: 'NEXUS spatial orb — processing',
    success: 'NEXUS spatial orb — complete',
    error:   'NEXUS spatial orb — error',
  }

  // WebGL check
  const hasWebGL = useMemo(() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch { return false }
  }, [])

  if (!hasWebGL) return <OrbFallback orbState={orbState} />

  return (
    <div
      className="orb3d-container"
      role="img"
      aria-label={ariaMap[orbState] ?? ariaMap.idle}
    >
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <OrbScene orbState={orbState} />
      </Canvas>
    </div>
  )
}

export default Orb3D
