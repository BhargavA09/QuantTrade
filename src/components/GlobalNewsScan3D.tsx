import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import {
  Globe,
  Radio,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Compass,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  Cpu,
  BarChart3,
  Sliders,
  DollarSign,
  Box,
  Share2,
  ChevronDown,
  ChevronUp,
  Gauge,
  Percent,
  Settings2,
  RotateCcw,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';
import { StockData } from '../types';
import { portfolioManager } from '../services/PortfolioManager';
import {
  fetchGlobalNewsScan,
  analyzeCustomNewsShock,
  GlobalNewsEvent,
  GlobalNewsScanResponse
} from '../services/api';
import {
  calculateAdvancedProjection,
  ProjectionModelType,
  ProjectionEngineResult,
  ProjectionDataPoint,
  ProjectionMetrics
} from '../utils/projectionEngine';

export interface GlobalNewsScan3DProps {
  data?: StockData;
  allData?: Record<string, StockData>;
  onApplyShockToStrategy?: (shockEvent: GlobalNewsEvent) => void;
  className?: string;
}

// Major continent outline polygons for 3D sphere projection
const CONTINENT_LANDMASSES = [
  // North America
  [[-125, 48], [-120, 38], [-115, 30], [-105, 20], [-95, 18], [-80, 25], [-75, 35], [-70, 45], [-60, 50], [-70, 60], [-100, 65], [-120, 60], [-125, 48]],
  // South America
  [[-80, 8], [-75, -5], [-70, -20], [-65, -35], [-55, -40], [-45, -25], [-35, -5], [-50, 0], [-70, 10], [-80, 8]],
  // Europe
  [[-10, 36], [0, 42], [5, 48], [15, 55], [25, 60], [30, 70], [20, 65], [10, 58], [2, 50], [-5, 44], [-10, 36]],
  // Africa
  [[-15, 30], [-5, 35], [10, 37], [25, 32], [35, 25], [45, 12], [50, 0], [40, -15], [30, -30], [20, -34], [15, -20], [10, 5], [0, 5], [-15, 15], [-15, 30]],
  // Asia
  [[35, 35], [50, 45], [70, 55], [90, 65], [120, 60], [140, 50], [130, 35], [120, 25], [105, 15], [90, 20], [75, 10], [65, 25], [50, 25], [35, 35]],
  // Australia
  [[115, -22], [125, -35], [135, -35], [150, -30], [145, -15], [130, -12], [115, -22]]
];

export default function GlobalNewsScan3D({
  data,
  allData,
  onApplyShockToStrategy,
  className
}: GlobalNewsScan3DProps) {
  // News scan state
  const [newsEvents, setNewsEvents] = useState<GlobalNewsEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('scan-news-01');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Interactive 3D Visualization Modes
  const [vizMode, setVizMode] = useState<'three_globe' | 'three_surface' | 'canvas_radar'>('three_globe');
  const [globeTheme, setGlobeTheme] = useState<'hologram' | 'matrix' | 'neon' | 'tactical'>('hologram');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.25);
  const [globeZoom, setGlobeZoom] = useState<number>(1.0);

  // Custom Headline Shock Input State
  const [customHeadline, setCustomHeadline] = useState<string>('');
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState<boolean>(false);

  // Drag interaction and smooth camera glide refs
  const [globeYaw, setGlobeYaw] = useState<number>(-120);
  const [globePitch, setGlobePitch] = useState<number>(20);
  const curYawRef = useRef<number>(-120);
  const curPitchRef = useRef<number>(20);
  const targetYawRef = useRef<number>(-120);
  const targetPitchRef = useRef<number>(20);
  const isGlidingRef = useRef<boolean>(false);
  const dragVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Advanced Quantitative Projection Algorithm Controls
  const [projectionModel, setProjectionModel] = useState<ProjectionModelType>('merton_jump_diffusion');
  const [confidenceSigma, setConfidenceSigma] = useState<1 | 2 | 3>(2); // 1 = 68%, 2 = 95%, 3 = 99%
  const [viewUnit, setViewUnit] = useState<'dollar' | 'percent'>('dollar');
  const [isQuantTunerOpen, setIsQuantTunerOpen] = useState<boolean>(false);
  const [quantParams, setQuantParams] = useState({
    meanReversionSpeed: 0.15,
    recoveryHalfLife: 14,
    liquidityAbsorption: 0.70,
    jumpIntensity: 0.12,
    horizonDays: 30
  });

  // Hovered node tooltip for Three.js raycasting
  const [hoveredEvent, setHoveredEvent] = useState<GlobalNewsEvent | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Fetch news scan on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchGlobalNewsScan()
      .then((res: GlobalNewsScanResponse) => {
        if (isMounted) {
          setNewsEvents(res.events);
          if (res.events.length > 0) {
            setSelectedEventId(res.events[0].id);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNewsEvents(FALLBACK_NEWS_EVENTS);
          setSelectedEventId(FALLBACK_NEWS_EVENTS[0].id);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Selected news item
  const selectedEvent = useMemo(() => {
    return newsEvents.find(e => e.id === selectedEventId) || newsEvents[0] || FALLBACK_NEWS_EVENTS[0];
  }, [newsEvents, selectedEventId]);

  // When selected event changes, smoothly glide 3D camera to coordinate
  useEffect(() => {
    if (selectedEvent) {
      targetYawRef.current = -selectedEvent.lng - 90;
      targetPitchRef.current = Math.max(-50, Math.min(50, selectedEvent.lat));
      isGlidingRef.current = true;
      dragVelocityRef.current = { x: 0, y: 0 };

      // Sync default half-life if event provides it
      if (selectedEvent.projectionLineShift?.recoveryHalfLifeDays) {
        setQuantParams(prev => ({
          ...prev,
          recoveryHalfLife: selectedEvent.projectionLineShift.recoveryHalfLifeDays
        }));
      }
    }
  }, [selectedEventId]);

  // Periodic auto-scan refresh
  useEffect(() => {
    if (!isAutoScanning) return;
    const interval = setInterval(() => {
      fetchGlobalNewsScan()
        .then((res) => {
          setNewsEvents(prev => {
            // Keep any user-analyzed custom events at the top
            const customOnes = prev.filter(e => e.id.startsWith('custom-'));
            const freshIds = new Set(res.events.map(e => e.id));
            const retainedCustom = customOnes.filter(c => !freshIds.has(c.id));
            return [...retainedCustom, ...res.events];
          });
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [isAutoScanning]);

  // --------------------------------------------------------------------------
  // THREE.JS 3D WEBGL ENGINE IMPLEMENTATION (Globe & Shock Volatility Surface)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (vizMode === 'canvas_radar') return;
    const container = threeMountRef.current;
    if (!container) return;

    // Clean any prior canvas children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 460;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 280);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      // Graceful fallback to 2D canvas if WebGL initialization fails
      setVizMode('canvas_radar');
      return;
    }

    // WebGL Context Lost & Restored Safety
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setVizMode('canvas_radar');
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xc084fc, 1.8);
    dirLight1.position.set(200, 150, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x22d3ee, 1.2);
    dirLight2.position.set(-200, -100, -100);
    scene.add(dirLight2);

    // Color themes mapping
    const themeColors = {
      hologram: { main: 0xa855f7, rim: 0xc084fc, arc: 0x22d3ee, grid: 0x6b21a8 },
      matrix: { main: 0x10b981, rim: 0x34d399, arc: 0x059669, grid: 0x064e3b },
      neon: { main: 0xf43f5e, rim: 0xfb7185, arc: 0xfbbf24, grid: 0x881337 },
      tactical: { main: 0x38bdf8, rim: 0x7dd3fc, arc: 0x0284c7, grid: 0x1e3a8a }
    }[globeTheme];

    // Groups for Globe vs Surface
    const globeGroup = new THREE.Group();
    const surfaceGroup = new THREE.Group();
    scene.add(globeGroup);
    scene.add(surfaceGroup);

    // Interactive Pins Array for Raycasting
    const pinMeshes: { mesh: THREE.Mesh; event: GlobalNewsEvent }[] = [];

    if (vizMode === 'three_globe') {
      globeGroup.visible = true;
      surfaceGroup.visible = false;

      // 3. 3D Earth Sphere Body
      const sphereRadius = 80;
      const sphereGeo = new THREE.SphereGeometry(sphereRadius, 48, 48);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a12,
        roughness: 0.8,
        metalness: 0.3,
        wireframe: false
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      globeGroup.add(sphereMesh);

      // Wireframe Latitude/Longitude Cage
      const wireGeo = new THREE.SphereGeometry(sphereRadius + 0.3, 24, 16);
      const wireMat = new THREE.MeshBasicMaterial({
        color: themeColors.grid,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      globeGroup.add(wireMesh);

      // Atmospheric Glow Outer Sphere
      const atmoGeo = new THREE.SphereGeometry(sphereRadius * 1.08, 32, 32);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: themeColors.rim,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      globeGroup.add(atmoMesh);

      // Spherical coordinate helper (lat, lng) -> Vector3
      const latLngToVector3 = (lat: number, lng: number, radius: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
      };

      // Draw Continents outlines as 3D lines
      CONTINENT_LANDMASSES.forEach(polygon => {
        const points = polygon.map(([lng, lat]) => latLngToVector3(lat, lng, sphereRadius + 0.5));
        if (points.length > 2) {
          points.push(points[0]); // close loop
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: themeColors.main,
            transparent: true,
            opacity: 0.75,
            linewidth: 1.5
          });
          const line = new THREE.Line(lineGeo, lineMat);
          globeGroup.add(line);
        }
      });

      // 4. Draw 3D News Pins & Pulsing Beacons
      newsEvents.forEach(evt => {
        const pos = latLngToVector3(evt.lat, evt.lng, sphereRadius);
        const normal = pos.clone().normalize();

        // Pin stem (cylinder)
        const pinHeight = evt.id === selectedEventId ? 14 : 9;
        const pinGeo = new THREE.CylinderGeometry(0.8, 0.4, pinHeight, 8);
        const pinColor = evt.severity === 'critical' ? 0xf43f5e : evt.id === selectedEventId ? themeColors.rim : themeColors.main;
        const pinMat = new THREE.MeshStandardMaterial({
          color: pinColor,
          emissive: pinColor,
          emissiveIntensity: 0.6,
          roughness: 0.3
        });
        const pin = new THREE.Mesh(pinGeo, pinMat);

        // Position & orient outward along sphere normal
        pin.position.copy(pos.clone().add(normal.clone().multiplyScalar(pinHeight / 2)));
        pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        globeGroup.add(pin);
        pinMeshes.push({ mesh: pin, event: evt });

        // Pulsing Crown Ring
        const ringGeo = new THREE.RingGeometry(2.5, 4.0, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: pinColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos.clone().add(normal.clone().multiplyScalar(pinHeight + 0.5)));
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        globeGroup.add(ring);
      });

      // 5. Draw 3D Great Circle Shock Arc (from selected news event to connected exchange hub)
      if (selectedEvent) {
        const p1 = latLngToVector3(selectedEvent.lat, selectedEvent.lng, sphereRadius + 1);
        const p2 = latLngToVector3(selectedEvent.connectedHub.lat, selectedEvent.connectedHub.lng, sphereRadius + 1);

        // Control point elevated above sphere
        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const elevation = 35;
        const cp = midPoint.clone().normalize().multiplyScalar(sphereRadius + elevation);

        const curve = new THREE.QuadraticBezierCurve3(p1, cp, p2);
        const curvePoints = curve.getPoints(50);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const arcMat = new THREE.LineBasicMaterial({
          color: themeColors.arc,
          linewidth: 2.5,
          transparent: true,
          opacity: 0.95
        });
        const arcLine = new THREE.Line(arcGeo, arcMat);
        globeGroup.add(arcLine);

        // Traveling shock pulse sphere
        const pulseSphereGeo = new THREE.SphereGeometry(2.2, 12, 12);
        const pulseSphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pulseSphere = new THREE.Mesh(pulseSphereGeo, pulseSphereMat);
        globeGroup.add(pulseSphere);

        // Animate traveling pulse
        const pulseInterval = setInterval(() => {
          const t = (Date.now() % 2200) / 2200;
          const currentPt = curve.getPoint(t);
          pulseSphere.position.copy(currentPt);
        }, 16);

        // Clear interval on unmount
        const originalCleanup = () => clearInterval(pulseInterval);
        return () => {
          originalCleanup();
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
          renderer.dispose();
        };
      }
    } else if (vizMode === 'three_surface') {
      globeGroup.visible = false;
      surfaceGroup.visible = true;

      // 3D Volatility Shock Surface (Parametric Landscape of Price Delta vs Days vs Volatility)
      const gridX = 30; // 30 days
      const gridY = 20; // Volatility steps
      const surfGeo = new THREE.PlaneGeometry(160, 120, gridX, gridY);
      const posAttr = surfGeo.attributes.position;

      const baseMove = selectedEvent ? selectedEvent.impactedTickers[0]?.expectedMovePct || 3 : 3;
      const decay = selectedEvent ? selectedEvent.projectionLineShift.recoveryHalfLifeDays || 14 : 14;

      for (let i = 0; i < posAttr.count; i++) {
        const xVal = posAttr.getX(i); // horizon days mapped to space
        const yVal = posAttr.getY(i); // volatility magnitude mapped to space
        
        const normDay = (xVal + 80) / 160 * 30;
        const normVol = (yVal + 60) / 120 * 2.5;

        // Wave elevation representing price shock magnitude
        const zElevation = baseMove * Math.exp(-normDay / decay) * normVol * 2.5 + Math.sin(normDay * 0.4) * 2;
        posAttr.setZ(i, zElevation);
      }
      surfGeo.computeVertexNormals();

      const surfMat = new THREE.MeshStandardMaterial({
        color: themeColors.main,
        roughness: 0.35,
        metalness: 0.7,
        wireframe: false,
        side: THREE.DoubleSide
      });
      const surfMesh = new THREE.Mesh(surfGeo, surfMat);
      surfMesh.rotation.x = -Math.PI / 3;
      surfaceGroup.add(surfMesh);

      // Wireframe overlay on top of surface
      const surfWireMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const surfWire = new THREE.Mesh(surfGeo, surfWireMat);
      surfWire.rotation.x = -Math.PI / 3;
      surfaceGroup.add(surfWire);
    }

    // 6. Ultra-Smooth Animation Render Loop with Inertial Glide & Orbit Controller
    const renderLoop = () => {
      animFrameRef.current = requestAnimationFrame(renderLoop);

      if (isGlidingRef.current) {
        // Smooth spherical glide to selected news epicenter with shortest circular path
        let deltaYaw = ((targetYawRef.current - curYawRef.current + 180) % 360) - 180;
        if (deltaYaw < -180) deltaYaw += 360;
        curYawRef.current += deltaYaw * 0.075;
        curPitchRef.current += (targetPitchRef.current - curPitchRef.current) * 0.075;

        if (Math.abs(deltaYaw) < 0.15 && Math.abs(targetPitchRef.current - curPitchRef.current) < 0.15) {
          isGlidingRef.current = false;
        }
      } else if (!isDraggingRef.current) {
        // Inertial release momentum with friction decay
        if (Math.abs(dragVelocityRef.current.x) > 0.01 || Math.abs(dragVelocityRef.current.y) > 0.01) {
          curYawRef.current = (curYawRef.current + dragVelocityRef.current.x) % 360;
          curPitchRef.current = Math.max(-65, Math.min(65, curPitchRef.current + dragVelocityRef.current.y));
          dragVelocityRef.current.x *= 0.92;
          dragVelocityRef.current.y *= 0.92;
        } else if (isAutoRotating) {
          curYawRef.current = (curYawRef.current + rotationSpeed) % 360;
        }
      }

      const curYaw = curYawRef.current;
      const curPitch = curPitchRef.current;

      if (vizMode === 'three_globe') {
        globeGroup.rotation.y = (curYaw * Math.PI) / 180;
        globeGroup.rotation.x = (curPitch * Math.PI) / 180;
        globeGroup.scale.set(globeZoom, globeZoom, globeZoom);
      } else if (vizMode === 'three_surface') {
        surfaceGroup.rotation.z = (curYaw * 0.3 * Math.PI) / 180;
        surfaceGroup.scale.set(globeZoom, globeZoom, globeZoom);
      }

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    // 7. Raycaster Mouse Interaction on 3D Pins
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleContainerMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (vizMode === 'three_globe') {
        raycaster.setFromCamera(mouseVec, camera);
        const intersects = raycaster.intersectObjects(pinMeshes.map(p => p.mesh));

        if (intersects.length > 0) {
          const hit = pinMeshes.find(p => p.mesh === intersects[0].object);
          if (hit) {
            setHoveredEvent(hit.event);
            setHoverScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        } else {
          setHoveredEvent(null);
          setHoverScreenPos(null);
        }
      }
    };

    const handleContainerClick = () => {
      if (hoveredEvent) {
        setSelectedEventId(hoveredEvent.id);
        showToast(`Selected 3D Station: ${hoveredEvent.city} (${hoveredEvent.country})`);
      }
    };

    container.addEventListener('mousemove', handleContainerMouseMove);
    container.addEventListener('click', handleContainerClick);

    // Clean up
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousemove', handleContainerMouseMove);
      container.removeEventListener('click', handleContainerClick);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.dispose();
    };
  }, [vizMode, globeTheme, isAutoRotating, rotationSpeed, globeZoom, newsEvents, selectedEventId, selectedEvent]);

  // --------------------------------------------------------------------------
  // 2D CANVAS FALLBACK RADAR ENGINE (Always active as backup or low-power mode)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (vizMode !== 'canvas_radar') return;
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localYaw = globeYaw;

    const render = () => {
      if (isAutoRotating && !isDraggingRef.current) {
        localYaw = (localYaw + rotationSpeed) % 360;
        setGlobeYaw(localYaw);
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = (Math.min(width, height) / 2 - 30) * globeZoom;

      ctx.clearRect(0, 0, width, height);

      // Gradient Sphere Base
      const sphereGrad = ctx.createRadialGradient(
        centerX - radius * 0.35,
        centerY - radius * 0.35,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      sphereGrad.addColorStop(0, '#18181b');
      sphereGrad.addColorStop(0.7, '#09090b');
      sphereGrad.addColorStop(1, '#000000');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 3D Cartesian spherical transformation
      const radPitch = (globePitch * Math.PI) / 180;
      const radYaw = (localYaw * Math.PI) / 180;

      const project3D = (lat: number, lng: number) => {
        const phi = (lat * Math.PI) / 180;
        const lambda = (lng * Math.PI) / 180 + radYaw;
        const x3d = radius * Math.cos(phi) * Math.sin(lambda);
        const y3d = -radius * Math.sin(phi);
        const z3d = radius * Math.cos(phi) * Math.cos(lambda);
        const yTilted = y3d * Math.cos(radPitch) - z3d * Math.sin(radPitch);
        const zTilted = y3d * Math.sin(radPitch) + z3d * Math.cos(radPitch);
        return {
          x: centerX + x3d,
          y: centerY + yTilted,
          z: zTilted,
          isFront: zTilted >= 0
        };
      };

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 0.8;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 10) {
          const pt = project3D(lat, lng);
          if (pt.isFront) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Draw Continents
      ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
      ctx.lineWidth = 1;

      CONTINENT_LANDMASSES.forEach(polygon => {
        ctx.beginPath();
        let first = true;
        let visibleCount = 0;
        polygon.forEach(([lng, lat]) => {
          const pt = project3D(lat, lng);
          if (pt.isFront) {
            visibleCount++;
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        });
        if (visibleCount > 2) {
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      // Draw Transmission Great Circle Arcs
      if (selectedEvent) {
        const sourcePt = project3D(selectedEvent.lat, selectedEvent.lng);
        const hubPt = project3D(selectedEvent.connectedHub.lat, selectedEvent.connectedHub.lng);
        if (sourcePt.isFront || hubPt.isFront) {
          ctx.beginPath();
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.2;
          ctx.setLineDash([4, 4]);
          const cpX = (sourcePt.x + hubPt.x) / 2;
          const cpY = Math.min(sourcePt.y, hubPt.y) - 30;
          ctx.moveTo(sourcePt.x, sourcePt.y);
          ctx.quadraticCurveTo(cpX, cpY, hubPt.x, hubPt.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw News Station Nodes
      newsEvents.forEach(evt => {
        const pt = project3D(evt.lat, evt.lng);
        if (!pt.isFront) return;
        const isSelected = evt.id === selectedEventId;
        const pinRadius = isSelected ? 6.5 : 4.5;
        ctx.fillStyle = evt.severity === 'critical' ? '#f43f5e' : isSelected ? '#c084fc' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pinRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#a1a1aa';
        ctx.fillText(evt.city, pt.x + 8, pt.y + 3);
      });

      // Outer Atmosphere Rim
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [vizMode, globeYaw, globePitch, globeZoom, isAutoRotating, rotationSpeed, newsEvents, selectedEventId, selectedEvent]);

  // Mouse drag handlers for orbit with kinetic velocity tracking
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    isGlidingRef.current = false;
    dragVelocityRef.current = { x: 0, y: 0 };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    isGlidingRef.current = false;
    dragVelocityRef.current = { x: deltaX * 0.45, y: -deltaY * 0.45 };
    curYawRef.current = (curYawRef.current + deltaX * 0.5) % 360;
    curPitchRef.current = Math.max(-65, Math.min(65, curPitchRef.current - deltaY * 0.5));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // --------------------------------------------------------------------------
  // ADVANCED QUANTITATIVE PROJECTION ENGINE: Multi-Regime Forward Trajectory
  // --------------------------------------------------------------------------
  const projectionEngineResult = useMemo<ProjectionEngineResult | null>(() => {
    if (!selectedEvent) return null;
    const basePrice = selectedEvent.impactedTickers[0]?.baselineTarget || 140;
    const shift = selectedEvent.projectionLineShift;
    const expectedMove = selectedEvent.impactedTickers[0]?.expectedMovePct || 3.0;

    return calculateAdvancedProjection({
      basePrice,
      expectedMovePct: expectedMove,
      baselineSlope: shift.baselineSlope || 0.03,
      recoveryHalfLifeDays: quantParams.recoveryHalfLife || shift.recoveryHalfLifeDays || 14,
      volatilityMultiplier: shift.volatilityMultiplier || 1.15,
      horizonDays: quantParams.horizonDays,
      meanReversionSpeed: quantParams.meanReversionSpeed,
      liquidityAbsorption: quantParams.liquidityAbsorption,
      jumpIntensity: quantParams.jumpIntensity,
      confidenceSigma: confidenceSigma,
      modelType: projectionModel
    });
  }, [selectedEvent, quantParams, confidenceSigma, projectionModel]);

  const projectionChartData = useMemo(() => {
    if (!projectionEngineResult) return [];
    return projectionEngineResult.timeline.map(pt => ({
      day: pt.dayLabel,
      dayNum: pt.dayNum,
      baseline: viewUnit === 'percent' ? 0 : pt.baseline,
      shocked: viewUnit === 'percent' ? pt.shockDeltaPct : pt.shocked,
      upperCone: viewUnit === 'percent' ? Number((((pt.upperCone - pt.baseline) / pt.baseline) * 100).toFixed(2)) : pt.upperCone,
      lowerCone: viewUnit === 'percent' ? Number((((pt.lowerCone - pt.baseline) / pt.baseline) * 100).toFixed(2)) : pt.lowerCone,
      innerUpperCone: viewUnit === 'percent' ? Number((((pt.innerUpperCone - pt.baseline) / pt.baseline) * 100).toFixed(2)) : pt.innerUpperCone,
      innerLowerCone: viewUnit === 'percent' ? Number((((pt.innerLowerCone - pt.baseline) / pt.baseline) * 100).toFixed(2)) : pt.innerLowerCone,
      shockDeltaPct: pt.shockDeltaPct,
      volatilityEst: pt.volatilityEst,
      rawBaseline: pt.baseline,
      rawShocked: pt.shocked
    }));
  }, [projectionEngineResult, viewUnit]);

  // Apply shock parameters to active strategy in portfolioManager
  const handleApplyShock = () => {
    if (!selectedEvent) return;
    const topAsset = selectedEvent.impactedTickers[0];

    const active = portfolioManager.getActiveStrategy();
    if (active) {
      portfolioManager.deployStrategy({
        ...active,
        name: `${active.name} [Shocked: ${selectedEvent.city}]`,
        parameters: {
          ...active.parameters,
          stopLossPct: Number((0.04 * selectedEvent.projectionLineShift.volatilityMultiplier).toFixed(3)),
          takeProfitPct: Number((0.08 * (1 + Math.abs(topAsset.expectedMovePct) / 100)).toFixed(3))
        }
      });
    }

    if (onApplyShockToStrategy) {
      onApplyShockToStrategy(selectedEvent);
    }

    showToast(`Deployed shock parameters for ${selectedEvent.city} to live strategy execution core!`);
  };

  // Analyze custom breaking news headline
  const handleAnalyzeCustomHeadline = async (headlineText?: string) => {
    const text = headlineText || customHeadline;
    if (!text.trim()) {
      showToast('Please type a global news headline to scan.');
      return;
    }

    setIsAnalyzingCustom(true);
    try {
      const res = await analyzeCustomNewsShock({ headline: text.trim() });
      if (res.success && res.event) {
        setNewsEvents(prev => [res.event, ...prev]);
        setSelectedEventId(res.event.id);
        setCustomHeadline('');
        showToast(`Flash radar scan complete: Mapped to ${res.event.city} (${res.event.sentiment.toUpperCase()})`);
      }
    } catch {
      showToast('Failed to analyze headline. Using local fallback engine.');
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  // Filtered news events list
  const filteredEvents = useMemo(() => {
    return newsEvents.filter(evt => {
      if (categoryFilter !== 'ALL' && evt.category !== categoryFilter) return false;
      if (severityFilter !== 'ALL' && evt.severity !== severityFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          evt.headline.toLowerCase().includes(q) ||
          evt.city.toLowerCase().includes(q) ||
          evt.country.toLowerCase().includes(q) ||
          evt.impactedTickers.some(t => t.symbol.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [newsEvents, categoryFilter, severityFilter, searchFilter]);

  return (
    <div className={cn("space-y-6 text-zinc-100", className)}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-zinc-900 border border-purple-500/50 text-purple-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold font-mono backdrop-blur-md"
          >
            <CheckCircle2 size={16} className="text-purple-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3D News Scan Header Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-purple-950/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Globe size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white">
                    3D Global News Scan & Market Projection Shock Engine
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Interactive 3D WebGL
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Worldwide continuous news scanner projecting macroeconomic shockwaves, transmission channels, and forward target price line deviations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick HUD Metrics & Auto-Scan Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs font-mono">
              <button
                onClick={() => setIsAutoScanning(!isAutoScanning)}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5",
                  isAutoScanning ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-zinc-400 hover:text-white"
                )}
              >
                <Radio size={13} className={cn(isAutoScanning && "animate-pulse")} />
                {isAutoScanning ? "Auto-Scanning Active" : "Scanner Paused"}
              </button>

              <button
                onClick={() => {
                  setIsLoading(true);
                  fetchGlobalNewsScan()
                    .then(res => {
                      setNewsEvents(res.events);
                      setIsLoading(false);
                      showToast(`Scanned ${res.events.length} worldwide stations.`);
                    })
                    .catch(() => setIsLoading(false));
                }}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-500/20"
              >
                <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
                Scan Now
              </button>
            </div>
          </div>
        </div>

        {/* Live Flash Intelligence Scanner & Custom Headline Injector */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              Flash News Scanner & Real-Time Impact Projection Generator
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Type any breaking global event to immediately simulate market transmission
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyzeCustomHeadline();
                }}
                placeholder="e.g. Taiwan expands advanced 2nm AI packaging capacity, reducing hyperscaler server delivery latency..."
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/80 shadow-inner"
              />
            </div>

            <button
              onClick={() => handleAnalyzeCustomHeadline()}
              disabled={isAnalyzingCustom}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 shrink-0"
            >
              {isAnalyzingCustom ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              <span>Scan & Project Shock</span>
            </button>
          </div>

          {/* Quick preset headline tags */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-zinc-400">
            <span className="shrink-0 text-[10px] uppercase font-bold text-zinc-500">Quick Scenarios:</span>
            {[
              "Taiwan TSMC 2nm Foundry Expansion",
              "Federal Reserve Neutral Policy Rate Shift",
              "Strait of Hormuz Tanker Transit Disruption",
              "European Central Bank Frankfurt Rate Hold",
              "Bank of Japan Yen Carry Trade Adjustment"
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setCustomHeadline(preset);
                  handleAnalyzeCustomHeadline(preset);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-[11px] font-medium"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Global Canvas & Interactive Transmission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive 3D Holographic Globe & Surface (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Interactive 3D Spatial Radar
              </span>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                (Orbit: Drag | Zoom: Wheel / Buttons)
              </span>
            </div>

            {/* 3D Mode Selector: Globe vs Shock Surface vs Radar Canvas */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[10px] font-mono">
                <button
                  onClick={() => setVizMode('three_globe')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1",
                    vizMode === 'three_globe' ? "bg-cyan-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Globe size={11} />
                  <span>3D Globe</span>
                </button>
                <button
                  onClick={() => setVizMode('three_surface')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1",
                    vizMode === 'three_surface' ? "bg-purple-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Box size={11} />
                  <span>Shock Surface</span>
                </button>
                <button
                  onClick={() => setVizMode('canvas_radar')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1",
                    vizMode === 'canvas_radar' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Activity size={11} />
                  <span>2D Radar</span>
                </button>
              </div>

              {/* Spin Toggle */}
              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-bold transition-all border",
                  isAutoRotating ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                )}
                title="Toggle Auto-Rotation"
              >
                {isAutoRotating ? "Spinning" : "Locked"}
              </button>
            </div>
          </div>

          {/* 3D Viewport Area */}
          <div 
            className="relative w-full h-[460px] flex items-center justify-center cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden bg-black/60 border border-zinc-800/60"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {vizMode === 'canvas_radar' ? (
              <canvas
                ref={canvas2DRef}
                width={700}
                height={460}
                className="w-full h-full object-contain"
              />
            ) : (
              <div 
                ref={threeMountRef} 
                className="w-full h-full select-none"
              />
            )}

            {/* Orbit HUD Overlay Badges */}
            <div className="absolute bottom-3 left-3 bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-400 space-y-0.5 pointer-events-none">
              <div>Yaw: {globeYaw.toFixed(1)}° · Pitch: {globePitch.toFixed(1)}°</div>
              <div className="text-cyan-400 font-bold">
                Focus: {selectedEvent?.city || 'Taipei'}, {selectedEvent?.country || 'Taiwan'}
              </div>
            </div>

            {/* Transmission Arc Info Tag */}
            <div className="absolute top-3 right-3 bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-400 pointer-events-none">
              <span className="text-purple-400 font-bold">Beaming Shock Arc ➔ </span>
              <span className="text-white">{selectedEvent?.connectedHub.name}</span>
            </div>

            {/* Three.js Pin Hover Tooltip */}
            {hoveredEvent && hoverScreenPos && (
              <div 
                className="absolute z-20 pointer-events-none bg-zinc-900/95 border border-purple-500/60 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md font-mono text-[11px] max-w-xs transition-all"
                style={{
                  left: Math.min(hoverScreenPos.x + 12, 420),
                  top: Math.max(hoverScreenPos.y - 40, 10)
                }}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                  <span className="text-cyan-400 flex items-center gap-1">
                    <MapPin size={11} /> {hoveredEvent.city}, {hoveredEvent.country}
                  </span>
                  <span className={cn(hoveredEvent.severity === 'critical' ? 'text-rose-400' : 'text-amber-400')}>
                    {hoveredEvent.severity.toUpperCase()}
                  </span>
                </div>
                <div className="font-sans text-xs font-bold text-white mt-0.5 line-clamp-1">
                  {hoveredEvent.headline}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Affects: {hoveredEvent.impactedTickers.map(t => `${t.symbol} (${t.expectedMovePct >= 0 ? '+' : ''}${t.expectedMovePct}%)`).join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Zoom & Orbit Bar */}
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Zoom:</span>
              <button
                onClick={() => setGlobeZoom(z => Math.min(1.5, z + 0.1))}
                className="px-2.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors"
              >
                +
              </button>
              <button
                onClick={() => setGlobeZoom(z => Math.max(0.6, z - 0.1))}
                className="px-2.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors"
              >
                -
              </button>
              <span className="font-mono text-[11px] text-zinc-300">{(globeZoom * 100).toFixed(0)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Theme:</span>
              {(['hologram', 'matrix', 'neon', 'tactical'] as const).map(theme => (
                <button
                  key={theme}
                  onClick={() => setGlobeTheme(theme)}
                  className={cn(
                    "px-2 py-0.5 rounded uppercase font-bold transition-all text-[10px]",
                    globeTheme === theme ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {theme}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Speed:</span>
              {[0.1, 0.25, 0.6].map(spd => (
                <button
                  key={spd}
                  onClick={() => setRotationSpeed(spd)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono",
                    rotationSpeed === spd ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected News Impact & Market Projection Curve (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Active News Event Card with 3D Perspective Tilt */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                "font-mono font-bold uppercase tracking-wider text-[11px]",
                selectedEvent.severity === 'critical' ? "text-rose-400" : "text-amber-400"
              )}>
                {selectedEvent.severity.toUpperCase()} IMPACT
              </span>
              <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                <Clock size={12} />
                <span>{selectedEvent.source}</span>
              </span>
            </div>

            <h3 className="text-base font-black text-white leading-tight">
              {selectedEvent.headline}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {selectedEvent.summary}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-zinc-800 text-zinc-400">
              <div className="flex items-center gap-1">
                <MapPin size={13} className="text-cyan-400" />
                <span>{selectedEvent.city}, {selectedEvent.country}</span>
              </div>
              <span className={cn("font-bold", selectedEvent.sentiment === 'bullish' ? "text-emerald-400" : "text-rose-400")}>
                Sentiment: {(selectedEvent.sentimentScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Advanced Quantitative Market Projection Terminal */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-xl">
            {/* Header: Title, Active Ticker, Unit & Quant Settings */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-cyan-400" />
                    Quantitative Forward Projection Shock Engine
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Multi-regime stochastic trajectory with dynamic volatility envelope.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Unit Toggle: Dollar vs Pct */}
                <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
                  <button
                    onClick={() => setViewUnit('dollar')}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-bold transition-all",
                      viewUnit === 'dollar' ? "bg-cyan-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                    )}
                    title="View Absolute Dollar Trajectory"
                  >
                    $ Price
                  </button>
                  <button
                    onClick={() => setViewUnit('percent')}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-bold transition-all",
                      viewUnit === 'percent' ? "bg-cyan-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                    )}
                    title="View Percentage Return Trajectory"
                  >
                    % Delta
                  </button>
                </div>

                {/* Quant Tuning Drawer Toggle */}
                <button
                  onClick={() => setIsQuantTunerOpen(!isQuantTunerOpen)}
                  className={cn(
                    "p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 font-mono font-bold",
                    isQuantTunerOpen
                      ? "bg-purple-600/30 border-purple-500/60 text-purple-300"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  )}
                  title="Configure Quantitative Algorithm Parameters"
                >
                  <Settings2 size={13} />
                  <span className="text-[10px]">Tuner</span>
                </button>
              </div>
            </div>

            {/* Model Selector Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Model:</span>
              {[
                { id: 'merton_jump_diffusion', label: 'Merton Jump OU', desc: 'Jump diffusion with mean-reverting drift' },
                { id: 'garch_term_structure', label: 'GARCH(1,1)', desc: 'Mean-reverting volatility term structure' },
                { id: 'liquidity_microstructure', label: 'Liquidity Micro', desc: 'Order book depth & absorption' },
                { id: 'monte_carlo_ensemble', label: 'MC Ensemble', desc: '1,000-path probabilistic median' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setProjectionModel(m.id as ProjectionModelType)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border",
                    projectionModel === m.id
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-sm shadow-cyan-500/20"
                      : "bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                  title={m.desc}
                >
                  {m.label}
                </button>
              ))}

              {/* Confidence Sigma */}
              <div className="ml-auto flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
                {([1, 2, 3] as const).map(sig => (
                  <button
                    key={sig}
                    onClick={() => setConfidenceSigma(sig)}
                    className={cn(
                      "px-2 py-0.5 rounded-md font-bold transition-all",
                      confidenceSigma === sig ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    title={`${sig}-Sigma statistical confidence envelope (${sig === 1 ? '68%' : sig === 2 ? '95%' : '99%'})`}
                  >
                    {sig === 1 ? '68%' : sig === 2 ? '95%' : '99%'}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Quantitative Tuning Drawer */}
            <AnimatePresence>
              {isQuantTunerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-3.5 space-y-3 font-mono text-[11px]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
                    <span className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Gauge size={13} />
                      Algorithmic Calibration Controls
                    </span>
                    <button
                      onClick={() => setQuantParams({
                        meanReversionSpeed: 0.15,
                        recoveryHalfLife: selectedEvent?.projectionLineShift?.recoveryHalfLifeDays || 14,
                        liquidityAbsorption: 0.70,
                        jumpIntensity: 0.12,
                        horizonDays: 30
                      })}
                      className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Mean Reversion Speed (kappa) */}
                    <div>
                      <div className="flex justify-between text-zinc-400 text-[10px] mb-1">
                        <span>Mean Reversion Pull (κ)</span>
                        <span className="text-cyan-400 font-bold">{quantParams.meanReversionSpeed.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.40"
                        step="0.01"
                        value={quantParams.meanReversionSpeed}
                        onChange={(e) => setQuantParams(p => ({ ...p, meanReversionSpeed: parseFloat(e.target.value) }))}
                        className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Shock Half-Life (days) */}
                    <div>
                      <div className="flex justify-between text-zinc-400 text-[10px] mb-1">
                        <span>Impulse Half-Life (τ₁/₂)</span>
                        <span className="text-cyan-400 font-bold">{quantParams.recoveryHalfLife} days</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="45"
                        step="1"
                        value={quantParams.recoveryHalfLife}
                        onChange={(e) => setQuantParams(p => ({ ...p, recoveryHalfLife: parseInt(e.target.value) }))}
                        className="w-full accent-cyan-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Liquidity Absorption Factor (gamma) */}
                    <div>
                      <div className="flex justify-between text-zinc-400 text-[10px] mb-1">
                        <span>Order Book Absorption (γ)</span>
                        <span className="text-purple-400 font-bold">{(quantParams.liquidityAbsorption * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.20"
                        max="0.95"
                        step="0.05"
                        value={quantParams.liquidityAbsorption}
                        onChange={(e) => setQuantParams(p => ({ ...p, liquidityAbsorption: parseFloat(e.target.value) }))}
                        className="w-full accent-purple-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Jump Arrival Intensity (lambda) */}
                    <div>
                      <div className="flex justify-between text-zinc-400 text-[10px] mb-1">
                        <span>Jump Intensity (λ)</span>
                        <span className="text-purple-400 font-bold">{quantParams.jumpIntensity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="0.40"
                        step="0.02"
                        value={quantParams.jumpIntensity}
                        onChange={(e) => setQuantParams(p => ({ ...p, jumpIntensity: parseFloat(e.target.value) }))}
                        className="w-full accent-purple-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Institutional Shock Analytics Badges Strip */}
            {projectionEngineResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                <div className="bg-zinc-950/70 border border-zinc-800/80 p-2 rounded-xl">
                  <div className="text-zinc-500 uppercase tracking-wider text-[9px]">Peak Impact</div>
                  <div className="font-bold text-white text-xs mt-0.5">
                    {projectionEngineResult.metrics.peakMovePct >= 0 ? '+' : ''}{projectionEngineResult.metrics.peakMovePct}%
                    <span className="text-zinc-400 text-[10px] ml-1">@ T+{projectionEngineResult.metrics.peakImpactDay}d</span>
                  </div>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 p-2 rounded-xl">
                  <div className="text-zinc-500 uppercase tracking-wider text-[9px]">Equilibrium Target</div>
                  <div className="font-bold text-cyan-300 text-xs mt-0.5">
                    ${projectionEngineResult.metrics.equilibriumPrice.toFixed(2)}
                  </div>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 p-2 rounded-xl">
                  <div className="text-zinc-500 uppercase tracking-wider text-[9px]">Absorption Ratio</div>
                  <div className="font-bold text-emerald-400 text-xs mt-0.5">
                    {projectionEngineResult.metrics.reversionRatioPct}% Retraced
                  </div>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 p-2 rounded-xl">
                  <div className="text-zinc-500 uppercase tracking-wider text-[9px]">95% VaR Dollar / %</div>
                  <div className="font-bold text-purple-300 text-xs mt-0.5">
                    ±${projectionEngineResult.metrics.var95Dollar.toFixed(2)} ({projectionEngineResult.metrics.var95Pct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}

            {/* Recharts Forward Projection Curve with Ultra-Smooth Monotone Splines */}
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionChartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="outerConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="innerConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#71717a" 
                    tick={{ fontSize: 9, fill: '#71717a' }}
                    interval={3}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#71717a" 
                    tick={{ fontSize: 9, fill: '#71717a' }}
                    tickFormatter={(val: number) => viewUnit === 'percent' ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}%` : `$${val.toFixed(0)}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0]?.payload;
                      if (!pt) return null;
                      return (
                        <div className="bg-zinc-950/95 border border-zinc-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl font-mono text-[11px] space-y-1.5 min-w-[210px]">
                          <div className="flex items-center justify-between pb-1 border-b border-zinc-800 text-xs font-bold">
                            <span className="text-cyan-400">{label}</span>
                            <span className="text-zinc-400">Vol: {pt.volatilityEst}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Baseline Drift:</span>
                            <span className="text-zinc-200 font-bold">${pt.rawBaseline.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-400">Shocked Target:</span>
                            <span className="text-cyan-300 font-bold">${pt.rawShocked.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>Projected Delta:</span>
                            <span className="font-bold">{pt.shockDeltaPct >= 0 ? '+' : ''}{pt.shockDeltaPct}%</span>
                          </div>
                          <div className="flex justify-between text-purple-400 pt-0.5 border-t border-zinc-900 text-[10px]">
                            <span>{confidenceSigma * 34}% Band:</span>
                            <span>
                              {viewUnit === 'percent'
                                ? `[${pt.lowerCone}% to ${pt.upperCone}%]`
                                : `[$${pt.lowerCone} - $${pt.upperCone}]`}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* Outer Confidence Envelope */}
                  <Area
                    type="monotone"
                    dataKey="upperCone"
                    stroke="none"
                    fill="url(#outerConeGrad)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerCone"
                    stroke="none"
                    fill="url(#outerConeGrad)"
                    isAnimationActive={false}
                  />
                  {/* Inner 1-Sigma Confidence Envelope */}
                  <Area
                    type="monotone"
                    dataKey="innerUpperCone"
                    stroke="none"
                    fill="url(#innerConeGrad)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="innerLowerCone"
                    stroke="none"
                    fill="url(#innerConeGrad)"
                    isAnimationActive={false}
                  />
                  {/* Baseline Projection */}
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#71717a"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Counterfactual Baseline"
                  />
                  {/* News Shocked Trajectory Line */}
                  <Line
                    type="monotone"
                    dataKey="shocked"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={false}
                    name="News Shocked Trajectory"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* CTA Button to Apply Shock to Strategy */}
            <button
              onClick={handleApplyShock}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Zap size={14} className="animate-pulse" />
              Apply {projectionEngineResult?.metrics.modelName || 'MJD-OU'} Parameters to Active Execution Engine
            </button>
          </div>

          {/* Impacted Market Assets Matrix */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
              Directly Impacted Market Tickers
            </h4>

            <div className="divide-y divide-zinc-800/80">
              {selectedEvent.impactedTickers.map((t) => (
                <div key={t.symbol} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{t.symbol}</span>
                      <span className="text-[10px] text-zinc-500 font-normal truncate max-w-[120px]">{t.name}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[220px]">
                      {t.transmissionReason}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className={cn(
                      "font-black text-xs",
                      t.expectedMovePct >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {t.expectedMovePct >= 0 ? '+' : ''}{t.expectedMovePct}%
                    </span>
                    <div className="text-[10px] text-zinc-400">
                      ${t.baselineTarget.toFixed(1)} ➔ ${t.shockedTarget.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Worldwide News Scanner Radar Feed Table */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Activity size={18} className="text-cyan-400" />
              Worldwide Scanned News Wire & Transmission Radar
            </h3>
            <p className="text-xs text-zinc-400">
              Select any event to immediately orient the 3D globe and calculate the market projection impact.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1">
              <Search size={12} className="text-zinc-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by city, headline, or ticker..."
                className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-48"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-zinc-300 font-bold outline-none"
            >
              <option value="ALL">All Sectors</option>
              <option value="Semiconductors & AI">Semiconductors & AI</option>
              <option value="Central Banks & Rates">Central Banks & Rates</option>
              <option value="Energy & Commodities">Energy & Commodities</option>
              <option value="Currencies & Debt">Currencies & Debt</option>
              <option value="Supply Chain & Shipping">Supply Chain & Shipping</option>
            </select>
          </div>
        </div>

        {/* News Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Headline</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Impacted Assets</th>
                <th className="py-2.5 px-3 text-right">3D Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredEvents.map(evt => {
                const isSelected = evt.id === selectedEventId;
                return (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected ? "bg-purple-600/15" : "hover:bg-zinc-800/40"
                    )}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <MapPin size={12} className="text-cyan-400" />
                        <span>{evt.city}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{evt.country}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400">
                      {evt.category}
                    </td>
                    <td className="py-2.5 px-3 max-w-md">
                      <div className="font-bold text-zinc-200 truncate">{evt.headline}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{evt.summary}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={cn(
                        "font-mono text-[10px] font-bold uppercase",
                        evt.severity === 'critical' ? "text-rose-400" : "text-amber-400"
                      )}>
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-zinc-300">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {evt.impactedTickers.slice(0, 3).map(t => (
                          <span
                            key={t.symbol}
                            className={cn(
                              "font-bold text-[11px]",
                              t.expectedMovePct >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}
                          >
                            {t.symbol} {t.expectedMovePct >= 0 ? '+' : ''}{t.expectedMovePct}%
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(evt.id);
                        }}
                        className={cn(
                          "px-3 py-1 rounded-xl text-xs font-bold transition-all",
                          isSelected ? "bg-purple-600 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        )}
                      >
                        {isSelected ? "Active Focus" : "Focus in 3D"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Fallback items if API is initializing
const FALLBACK_NEWS_EVENTS: GlobalNewsEvent[] = [
  {
    id: "scan-news-01",
    headline: "Taiwan Foundry Clusters Ramp Advanced 2nm Packaging Lines Ahead of AI Server Surge",
    summary: "Leading wafer fabrication hubs in Hsinchu & Tainan confirm 28% yield acceleration for next-gen hyperscaler accelerator chips.",
    timestamp: new Date().toISOString(),
    source: "Taipei Tech Digest",
    city: "Taipei",
    country: "Taiwan",
    region: "Asia-Pacific",
    lat: 25.033,
    lng: 121.5654,
    category: "Semiconductors & AI",
    severity: "critical",
    sentiment: "bullish",
    sentimentScore: 0.88,
    impactedTickers: [
      { symbol: "NVDA", name: "NVIDIA Corp.", expectedMovePct: 4.2, baselineTarget: 138.5, shockedTarget: 144.3, transmissionReason: "Primary beneficiary of advanced packaging substrate throughput." },
      { symbol: "TSM", name: "Taiwan Semiconductor", expectedMovePct: 4.8, baselineTarget: 188.0, shockedTarget: 197.0, transmissionReason: "Margin expansion on 2nm packaging volume." }
    ],
    projectionLineShift: {
      baselineSlope: 0.04,
      shockedSlope: 0.12,
      volatilityMultiplier: 1.25,
      horizonDays: 30,
      recoveryHalfLifeDays: 14
    },
    connectedHub: { name: "Silicon Valley / San Francisco", lat: 37.7749, lng: -122.4194 }
  }
];
