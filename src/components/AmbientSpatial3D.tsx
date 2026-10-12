import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type Ambient3DMode = 'cyber_grid' | 'neural_particles' | 'quantum_horizon' | 'off';

interface AmbientSpatial3DProps {
  mode?: Ambient3DMode;
  onModeChange?: (mode: Ambient3DMode) => void;
  interactiveParallax?: boolean;
}

export default function AmbientSpatial3D({
  mode: controlledMode,
  onModeChange,
  interactiveParallax = true
}: AmbientSpatial3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalMode, setInternalMode] = useState<Ambient3DMode>(() => {
    return (localStorage.getItem('quant_ambient_3d_mode') as Ambient3DMode) || 'cyber_grid';
  });
  const currentMode = controlledMode !== undefined ? controlledMode : internalMode;

  const [fps, setFps] = useState<number>(60);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
  const [depthIntensity, setDepthIntensity] = useState<number>(1.2);
  const [cameraSpeed, setCameraSpeed] = useState<number>(1.0);

  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  const handleModeSelect = (newMode: Ambient3DMode) => {
    setInternalMode(newMode);
    localStorage.setItem('quant_ambient_3d_mode', newMode);
    if (onModeChange) onModeChange(newMode);
  };

  useEffect(() => {
    if (currentMode === 'off') return;
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL not supported for ambient 3D', e);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 28);
    camera.lookAt(0, 0, 0);

    // Root Group for Mouse Parallax
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Grid Mesh for cyber_grid or quantum_horizon
    let gridMesh: THREE.LineSegments | null = null;
    let planeMesh: THREE.Mesh | null = null;
    let particlesMesh: THREE.Points | null = null;
    let floatingCubes: THREE.InstancedMesh | null = null;

    if (currentMode === 'cyber_grid' || currentMode === 'quantum_horizon') {
      const gridHelper = new THREE.GridHelper(
        80,
        currentMode === 'quantum_horizon' ? 60 : 40,
        currentMode === 'quantum_horizon' ? 0x06b6d4 : 0x10b981,
        0x1e293b
      );
      gridHelper.position.y = -6;
      worldGroup.add(gridHelper);
      gridMesh = gridHelper;

      // Add undulating wavy wireframe horizon
      const planeGeo = new THREE.PlaneGeometry(90, 90, 45, 45);
      planeGeo.rotateX(-Math.PI / 2);
      const planeMat = new THREE.MeshBasicMaterial({
        color: currentMode === 'quantum_horizon' ? 0x0284c7 : 0x059669,
        wireframe: true,
        transparent: true,
        opacity: 0.12
      });
      planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.position.y = -6.2;
      worldGroup.add(planeMesh);
    }

    // 2. Neural Floating Particles & Volumetric Nodes
    const particleCount = currentMode === 'neural_particles' ? 650 : 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorA = currentMode === 'quantum_horizon' 
      ? new THREE.Color(0x38bdf8) 
      : new THREE.Color(0x10b981);
    const colorB = currentMode === 'neural_particles'
      ? new THREE.Color(0x818cf8)
      : new THREE.Color(0x06b6d4);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = (Math.random() - 0.5) * 35;
      const z = (Math.random() - 0.5) * 60;
      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      const mixed = colorA.clone().lerp(colorB, Math.random());
      particleColors[i * 3] = mixed.r;
      particleColors[i * 3 + 1] = mixed.g;
      particleColors[i * 3 + 2] = mixed.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    particlesMesh = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particlesMesh);

    // 3. Floating 3D Data Hologram Cubes
    const cubeCount = 28;
    const cubeGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const cubeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    floatingCubes = new THREE.InstancedMesh(cubeGeo, cubeMat, cubeCount);
    const dummy = new THREE.Object3D();
    const cubeInitialData: { x: number; y: number; z: number; rotSpeedX: number; rotSpeedY: number }[] = [];

    for (let i = 0; i < cubeCount; i++) {
      const x = (Math.random() - 0.5) * 55;
      const y = -4 + Math.random() * 18;
      const z = (Math.random() - 0.5) * 45;
      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      floatingCubes.setMatrixAt(i, dummy.matrix);

      cubeInitialData.push({
        x,
        y,
        z,
        rotSpeedX: 0.005 + Math.random() * 0.015,
        rotSpeedY: 0.005 + Math.random() * 0.015
      });
    }
    floatingCubes.instanceMatrix.needsUpdate = true;
    worldGroup.add(floatingCubes);

    // Interactive mouse parallax tracker
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactiveParallax) return;
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseRef.current.targetX = (e.clientX - halfW) / halfW;
      mouseRef.current.targetY = (e.clientY - halfH) / halfH;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animId: number;
    let clock = new THREE.Clock();
    let frameCounter = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime() * cameraSpeed;

      // Calculate FPS every 60 frames
      frameCounter++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCounter * 1000) / (now - lastFpsUpdate)));
        frameCounter = 0;
        lastFpsUpdate = now;
      }

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Parallax rotation of the 3D world group
      worldGroup.rotation.y = mouseRef.current.x * 0.18 * depthIntensity;
      worldGroup.rotation.x = -mouseRef.current.y * 0.12 * depthIntensity;

      // Dynamic wave undulating motion on plane mesh
      if (planeMesh && planeMesh.geometry) {
        const posAttr = planeMesh.geometry.attributes.position;
        const count = posAttr.count;
        for (let i = 0; i < count; i++) {
          const vx = posAttr.getX(i);
          const vz = posAttr.getZ(i);
          // wave equation
          const vy = Math.sin(vx * 0.15 + elapsed * 1.5) * 0.75 + Math.cos(vz * 0.15 + elapsed * 1.2) * 0.6;
          posAttr.setY(i, vy);
        }
        posAttr.needsUpdate = true;
      }

      // Rotate particle cloud gently
      if (particlesMesh) {
        particlesMesh.rotation.y = elapsed * 0.03;
      }

      // Animate floating holographic cubes
      if (floatingCubes) {
        for (let i = 0; i < cubeCount; i++) {
          const meta = cubeInitialData[i];
          dummy.position.set(
            meta.x,
            meta.y + Math.sin(elapsed + i) * 0.8,
            meta.z
          );
          dummy.rotation.x += meta.rotSpeedX;
          dummy.rotation.y += meta.rotSpeedY;
          dummy.updateMatrix();
          floatingCubes.setMatrixAt(i, dummy.matrix);
        }
        floatingCubes.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [currentMode, depthIntensity, cameraSpeed, interactiveParallax]);

  return (
    <>
      {/* 3D WebGL Canvas Layer */}
      <div 
        ref={containerRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-90 transition-opacity duration-1000"
      />

      {/* Ambient 3D Interactive Floating HUD Pill in Bottom-Right Corner */}
      <div className="fixed bottom-4 right-4 z-40 select-none">
        <div className="relative">
          {/* Main Toggle Button */}
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300 hover:text-white shadow-xl backdrop-blur-xl transition-all duration-300 text-[11px] font-mono group"
            title="Interactive 3D Spatial Environment Settings"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform animate-pulse" />
            <span className="font-semibold tracking-wider uppercase text-[10px] text-zinc-400 group-hover:text-cyan-300">3D Space</span>
            <span className="text-[9px] text-zinc-500 font-mono">[{fps} FPS]</span>
          </button>

          {/* Expanded 3D Control Center Popover */}
          {isControlsOpen && (
            <div className="absolute bottom-10 right-0 w-72 p-4 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-2xl text-zinc-200 text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold text-xs uppercase tracking-wider text-cyan-400">3D Spatial Engine</span>
                </div>
                <button
                  onClick={() => setIsControlsOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Mode Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1.5">
                  Spatial Environment
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'cyber_grid', label: 'Cyber Grid', icon: '🌐' },
                      { id: 'quantum_horizon', label: 'Quantum Horizon', icon: '🌌' },
                      { id: 'neural_particles', label: 'Neural Cloud', icon: '✨' },
                      { id: 'off', label: 'Minimal / 2D', icon: '⬛' }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleModeSelect(m.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        currentMode === m.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {currentMode !== 'off' && (
                <>
                  {/* Parallax Depth */}
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>3D Parallax Tilt</span>
                      <span className="font-mono text-cyan-400">{depthIntensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={depthIntensity}
                      onChange={(e) => setDepthIntensity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Animation Speed */}
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Wave Speed</span>
                      <span className="font-mono text-cyan-400">{cameraSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.0"
                      step="0.1"
                      value={cameraSpeed}
                      onChange={(e) => setCameraSpeed(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </>
              )}

              <div className="pt-1 border-t border-zinc-900 text-[9px] text-zinc-500 font-mono flex justify-between">
                <span>WebGL Hardware Accel</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
