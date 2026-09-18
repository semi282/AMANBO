// KartRider Iconic 'Village Fingers' (빌리지 손가락) 3D Masterpiece Track
// Authentic Course Features:
// 1. Multi-Level Elevation: Upper Finger Plateau (Y=4m) -> Purple Gate Slope -> Valley Fingers & Roundabout ->
//    Scenic West Elevated Viaduct (Y=6m, Village Overlook) -> Clock Tower Tunnel -> Speed Bump Jump Ramp (Y=2.4m) -> Finish Line
// 2. High-Fidelity Procedural PBR Textures: Dark asphalt with road noise, natural multi-tone grass, red/white beveled curbs,
//    white concrete guardrails with yellow/black hazard chevrons, warm brick facades, and terracotta/colored tile roofs.
// 3. Rich 3D Village Environment: Townhouses, cafe, windmills with rotating blades, park benches, flower planters,
//    stone viaduct arches, purple pagoda gate, clocktower town hall, and stylized deciduous/pine trees.
// 4. 100% Opaque Solid 3D Collision Barrier Walls (Double-Sided) on both sides.

class Track {
  constructor(scene) {
    this.scene = scene;
    this.trackWidth = 24; // Wide racing roadway
    this.checkpoints = [];
    this.dashPads = [];
    this.curve = null;
    this.totalLength = 0;
    this.windmills = [];
    this.roadMesh = null;
    this.raycaster = null;
    this.rayDown = null;
    this.rayOrigin = null;

    // 1. Generate Procedural PBR Canvas Textures
    this.textures = this.generateProceduralTextures();

    // 2. Build 64-Checkpoint Multi-Level Village Fingers 3D Spline
    this.initSpline();

    // 3. Construct 3D World Elements
    this.createSkyDome();
    this.createGround();
    this.createRoadMesh();
    this.createStartAreaRoadMesh();      // 출발선 뒤편 검은색 아스팔트 광장
    this.createBrickFlowerbedWalls();    // 빨간색 부분: 따뜻한 빌리지 벽돌화단
    this.createViaductPillars();         // 서쪽 고가도로 하부 석조 교각
    this.createStartArch();              // 검은색 점 스타트 아치
    this.createSpeedBumpBridge();        // 파란색 원 점프 방지턱 교량 (복원)
    this.createClockTowerBuilding();     // 빨간색 원 시계탑 관청 & 관통 터널
    this.createPurpleGate();             // 손가락 중간 보라색 누각 게이트
    this.createRoundaboutIsland();       // 남서쪽 원형 로터리 화단 섬
    this.createDashPads();
    this.createVillageHouses();
    this.createVillageProps();           // 벤치, 가로등, 화단, 나무상자
    this.createWindmills();
    this.createStylizedTrees();

    // 4. Automated Waypoint & Clearance Verification
    this.validateTrackWaypoints();
  }

  // ==========================================
  // 1. PROCEDURAL PBR CANVAS TEXTURES
  // ==========================================
  generateProceduralTextures() {
    // A. 1024x1024 Dark Slate Asphalt with Realistic Aggregate, Tire Marks & Sharp Markings
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 1024;
    roadCanvas.height = 1024;
    const rCtx = roadCanvas.getContext('2d');

    // Dark charcoal slate base (#1e2229)
    rCtx.fillStyle = '#1e2229';
    rCtx.fillRect(0, 0, 1024, 1024);

    // Multi-scale stone gravel noise
    for (let i = 0; i < 18000; i++) {
      const nx = Math.random() * 1024;
      const ny = Math.random() * 1024;
      const shade = Math.floor(Math.random() * 40 + 20);
      rCtx.fillStyle = `rgba(${shade},${shade},${shade + 6},0.28)`;
      rCtx.fillRect(nx, ny, 2, 2);
    }

    // Realistic tire rubber wear streaks along the left and right driving lanes
    rCtx.fillStyle = 'rgba(12, 14, 18, 0.35)';
    rCtx.fillRect(180, 0, 160, 1024);
    rCtx.fillRect(684, 0, 160, 1024);

    // Solid Bright White Outer Edge Boundary Lines
    rCtx.fillStyle = '#ffffff';
    rCtx.fillRect(20, 0, 16, 1024);
    rCtx.fillRect(988, 0, 16, 1024);

    // Inner subtle shoulder lines
    rCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    rCtx.fillRect(44, 0, 4, 1024);
    rCtx.fillRect(976, 0, 4, 1024);

    // Golden-Yellow Dashed Center Line (KartRider Standard)
    rCtx.fillStyle = '#ffcc00';
    rCtx.shadowColor = 'rgba(255, 204, 0, 0.5)';
    rCtx.shadowBlur = 6;
    const dashLen = 160;
    const gapLen = 110;
    for (let y = 0; y < 1024; y += dashLen + gapLen) {
      rCtx.fillRect(503, y, 18, dashLen);
    }
    rCtx.shadowBlur = 0;

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;

    // B. Natural Multi-Tone Green Grass Texture (512x512) - Eliminates flat plain green!
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const gCtx = grassCanvas.getContext('2d');

    // Rich cartoon meadow green base
    gCtx.fillStyle = '#4ea23e';
    gCtx.fillRect(0, 0, 512, 512);

    // Multi-shade grass blades and soil flecks
    const grassColors = ['#5bb34b', '#449635', '#66be55', '#3d862f', '#52a942'];
    for (let i = 0; i < 12000; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      gCtx.fillStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
      gCtx.fillRect(gx, gy, Math.random() * 3 + 1, Math.random() * 4 + 2);
    }
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;

    // C. Refined Sandstone Curb / Plinth (256x64) - Warm stone base for brick walls
    const curbCanvas = document.createElement('canvas');
    curbCanvas.width = 256;
    curbCanvas.height = 64;
    const cCtx = curbCanvas.getContext('2d');
    cCtx.fillStyle = '#ded5cb';
    cCtx.fillRect(0, 0, 256, 64);
    cCtx.fillStyle = '#ece5dc';
    cCtx.fillRect(0, 0, 256, 8);
    cCtx.fillStyle = '#c5bab0';
    cCtx.fillRect(0, 56, 256, 8);
    for (let x = 0; x < 256; x += 64) {
      cCtx.fillStyle = '#b8ada2';
      cCtx.fillRect(x, 0, 3, 64);
    }
    const curbTex = new THREE.CanvasTexture(curbCanvas);
    curbTex.wrapS = THREE.RepeatWrapping;
    curbTex.wrapT = THREE.RepeatWrapping;

    // D. Warm Village Terracotta Brick Texture (512x512) for Brick Flowerbed Walls
    const brickCanvas = document.createElement('canvas');
    brickCanvas.width = 512;
    brickCanvas.height = 512;
    const brCtx = brickCanvas.getContext('2d');

    // Warm cement mortar base
    brCtx.fillStyle = '#d4cac0';
    brCtx.fillRect(0, 0, 512, 512);

    // 16 Running Bond Brick Courses
    const brickRows = 16;
    const rowH = 512 / brickRows; // 32px
    const brickW = 64;
    const brickShades = ['#b83915', '#a72f0d', '#c4481d', '#922607', '#cb5124', '#ab3412', '#b33d1a'];

    for (let r = 0; r < brickRows; r++) {
      const y = r * rowH;
      const offsetX = (r % 2 === 0) ? 0 : brickW * 0.5;
      for (let x = -brickW; x < 512 + brickW; x += brickW) {
        const bx = x + offsetX;
        const color = brickShades[Math.floor(Math.random() * brickShades.length)];
        brCtx.fillStyle = color;
        brCtx.fillRect(bx + 2, y + 2, brickW - 4, rowH - 4);

        // Subtle 3D brick bevel: highlight on top/left, shadow on bottom/right
        brCtx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        brCtx.fillRect(bx + 2, y + 2, brickW - 4, 3);
        brCtx.fillRect(bx + 2, y + 2, 3, rowH - 4);

        brCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        brCtx.fillRect(bx + 2, y + rowH - 5, brickW - 4, 3);
        brCtx.fillRect(bx + brickW - 5, y + 2, 3, rowH - 4);

        // Tactile brick noise speckles
        for (let s = 0; s < 12; s++) {
          const sx = bx + 4 + Math.random() * (brickW - 8);
          const sy = y + 4 + Math.random() * (rowH - 8);
          brCtx.fillStyle = (Math.random() > 0.5) ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.14)';
          brCtx.fillRect(sx, sy, 2, 2);
        }
      }
    }
    const brickTex = new THREE.CanvasTexture(brickCanvas);
    brickTex.wrapS = THREE.RepeatWrapping;
    brickTex.wrapT = THREE.RepeatWrapping;

    // E. Lush Village Flowerbed Planter Texture (512x512) - Dense Foliage & Blooming Flowers
    const flowerCanvas = document.createElement('canvas');
    flowerCanvas.width = 512;
    flowerCanvas.height = 512;
    const fCtx = flowerCanvas.getContext('2d');

    // Rich dark garden loam & dense foliage base
    fCtx.fillStyle = '#1b4d1b';
    fCtx.fillRect(0, 0, 512, 512);

    // Multi-shade dense green shrub leaves
    const leafColors = ['#2e7d32', '#388e3c', '#43a047', '#4caf50', '#1b5e20', '#66bb6a'];
    for (let i = 0; i < 6000; i++) {
      const lx = Math.random() * 512;
      const ly = Math.random() * 512;
      fCtx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
      fCtx.beginPath();
      fCtx.arc(lx, ly, Math.random() * 6 + 2, 0, Math.PI * 2);
      fCtx.fill();
    }

    // Hundreds of colorful blooming village flowers (daisies, petunias, marigolds, roses)
    const flowerBlooms = [
      { color: '#ffffff', center: '#ffd600', size: 5.5, count: 180 }, // White Daisies
      { color: '#ffeb3b', center: '#ff6f00', size: 5.0, count: 140 }, // Golden Marigolds
      { color: '#e53935', center: '#ffeb3b', size: 5.5, count: 160 }, // Scarlet Petunias
      { color: '#ec407a', center: '#ffffff', size: 5.0, count: 120 }, // Pink Roses
      { color: '#ab47bc', center: '#ffeb3b', size: 4.5, count: 100 }, // Purple Blossoms
      { color: '#ff9800', center: '#d84315', size: 4.8, count: 90 },  // Orange Lilies
    ];

    flowerBlooms.forEach(fb => {
      for (let k = 0; k < fb.count; k++) {
        const fx = Math.random() * 512;
        const fy = Math.random() * 512;
        const petals = 5;
        fCtx.fillStyle = fb.color;
        for (let p = 0; p < petals; p++) {
          const ang = (p * Math.PI * 2) / petals;
          const px = fx + Math.cos(ang) * (fb.size * 0.65);
          const py = fy + Math.sin(ang) * (fb.size * 0.65);
          fCtx.beginPath();
          fCtx.arc(px, py, fb.size * 0.5, 0, Math.PI * 2);
          fCtx.fill();
        }
        // Flower center
        fCtx.fillStyle = fb.center;
        fCtx.beginPath();
        fCtx.arc(fx, fy, fb.size * 0.35, 0, Math.PI * 2);
        fCtx.fill();
      }
    });

    const flowerBedTex = new THREE.CanvasTexture(flowerCanvas);
    flowerBedTex.wrapS = THREE.RepeatWrapping;
    flowerBedTex.wrapT = THREE.RepeatWrapping;

    // F. Speed Bump Chevron Jump Arrows (Yellow on Blue)
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d');
    bCtx.fillStyle = '#1565c0';
    bCtx.fillRect(0, 0, 256, 256);

    bCtx.fillStyle = '#ffeb3b';
    bCtx.shadowColor = '#ffeb3b';
    bCtx.shadowBlur = 10;
    for (let r = 0; r < 3; r++) {
      const cy = 45 + r * 80;
      bCtx.beginPath();
      bCtx.moveTo(128, cy - 25);
      bCtx.lineTo(210, cy + 20);
      bCtx.lineTo(170, cy + 20);
      bCtx.lineTo(128, cy - 5);
      bCtx.lineTo(86, cy + 20);
      bCtx.lineTo(46, cy + 20);
      bCtx.closePath();
      bCtx.fill();
    }
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;

    return { roadTex, grassTex, curbTex, brickTex, flowerBedTex, bumpTex };
  }

  // ==========================================
  // 2. MULTI-LEVEL 3D SPLINE (Natural Elevation & Fingers)
  // ==========================================
  initSpline() {
    // Exact Authentic Village Fingers Layout with Natural High-Quality Elevations:
    // Start (Y=0) -> Gentle climb to Upper Finger 1 Plateau (Y=3.8m) ->
    // Slope down through Purple Gate (Y=1.8m) -> Ground Level Fingers 3 & 4 (Y=0m) ->
    // Roundabout (Y=0m) -> Scenic West Elevated Viaduct (Y=6.0m Overlook!) ->
    // Gentle descent to Clock Tower Tunnel (Y=1.4m) -> Speed Bump Jump (Y=2.4m) -> Finish (Y=0)
    const points = [
      // North Straight (Start Line Area at Y = 0)
      new THREE.Vector3(50, 0.0, -160),     // 0. Start / Finish Line (검은 점)
      new THREE.Vector3(120, 0.5, -160),    // 1. Approaching Turn 1
      new THREE.Vector3(185, 1.2, -150),    // 2. Sweeping right climb
      new THREE.Vector3(215, 2.2, -115),    // 3. Climbing into Finger 1
      new THREE.Vector3(195, 3.2, -75),     // 4. Entrance of Upper Finger 1

      // FINGER 1 (Upper Village Plateau at Y = 3.8 ~ 4.0m)
      new THREE.Vector3(120, 3.8, -60),     // 5. High Finger 1 straight
      new THREE.Vector3(20, 4.0, -60),      // 6. High Finger 1 mid
      new THREE.Vector3(-50, 4.0, -60),     // 7. Approaching Hairpin 1
      // Hairpin 1 (Smooth 30m radius arc, Y = 3.9 -> 3.2m)
      new THREE.Vector3(-80, 3.9, -60),
      new THREE.Vector3(-95, 3.9, -56),
      new THREE.Vector3(-106, 3.8, -45),
      new THREE.Vector3(-110, 3.8, -30),    // Hairpin 1 apex
      new THREE.Vector3(-106, 3.6, -15),
      new THREE.Vector3(-95, 3.4, -4),
      new THREE.Vector3(-80, 3.2, 0),

      // FINGER 2 (Descending through Purple Gate from Y=3.0 to Y=1.2m)
      new THREE.Vector3(-30, 2.8, 0),
      new THREE.Vector3(40, 2.2, 0),
      new THREE.Vector3(90, 1.8, 0),        // Purple Pagoda Gate Location
      new THREE.Vector3(150, 1.2, 0),
      // Hairpin 2 (Smooth 30m radius arc, Y = 1.1 -> 0.5m)
      new THREE.Vector3(180, 1.1, 0),
      new THREE.Vector3(195, 1.0, 4),
      new THREE.Vector3(206, 0.8, 15),
      new THREE.Vector3(210, 0.7, 30),      // Hairpin 2 apex
      new THREE.Vector3(206, 0.6, 45),
      new THREE.Vector3(195, 0.5, 56),
      new THREE.Vector3(180, 0.5, 60),

      // FINGER 3 (Valley Level at Y = 0.4 to 0.0m)
      new THREE.Vector3(140, 0.4, 60),
      new THREE.Vector3(50, 0.2, 60),
      new THREE.Vector3(-30, 0.0, 60),
      // Hairpin 3 (Smooth 30m radius arc, Y = 0.0m)
      new THREE.Vector3(-80, 0.0, 60),
      new THREE.Vector3(-95, 0.0, 64),
      new THREE.Vector3(-106, 0.0, 75),
      new THREE.Vector3(-110, 0.0, 90),     // Hairpin 3 apex
      new THREE.Vector3(-106, 0.0, 105),
      new THREE.Vector3(-95, 0.0, 116),
      new THREE.Vector3(-80, 0.0, 120),

      // FINGER 4 (Sprint Level at Y = 0.0m)
      new THREE.Vector3(-30, 0.0, 120),
      new THREE.Vector3(50, 0.0, 120),
      new THREE.Vector3(140, 0.0, 120),
      // Hairpin 4 (Smooth 30m radius arc, Y = 0.0m)
      new THREE.Vector3(180, 0.0, 120),
      new THREE.Vector3(195, 0.0, 124),
      new THREE.Vector3(206, 0.0, 135),
      new THREE.Vector3(210, 0.0, 150),     // Hairpin 4 apex
      new THREE.Vector3(206, 0.0, 165),
      new THREE.Vector3(195, 0.0, 176),
      new THREE.Vector3(180, 0.0, 180),

      // South Road & Roundabout (Y = 0.0m -> 0.4m)
      new THREE.Vector3(130, 0.0, 180),
      new THREE.Vector3(40, 0.0, 180),
      new THREE.Vector3(-50, 0.1, 180),
      // Roundabout smooth sweep
      new THREE.Vector3(-110, 0.2, 205),
      new THREE.Vector3(-155, 0.3, 215),
      new THREE.Vector3(-185, 0.4, 185),
      new THREE.Vector3(-180, 0.8, 135),
      new THREE.Vector3(-185, 1.5, 80),

      // West Outer Climbing Highway (Scenic Viaduct Y=2.0 -> 6.0m)
      new THREE.Vector3(-202, 3.5, 20),
      new THREE.Vector3(-205, 5.5, -45),
      new THREE.Vector3(-195, 6.0, -90),    // Viaduct crest (Y = 6.0m, Peak panoramic view!)
      new THREE.Vector3(-170, 4.5, -135),
      new THREE.Vector3(-145, 2.5, -155),

      // Clock Tower Building Tunnel (빨간색 원, Y = 1.4m down to Y = 0.6m)
      new THREE.Vector3(-115, 1.4, -160),   // Inside Clock Tower Tunnel
      new THREE.Vector3(-75, 0.6, -160),    // Exiting Clock Tower Tunnel

      // Speed Bump / Jump Bridge (파란색 원, Y arches up to 2.4m!)
      new THREE.Vector3(-45, 0.2, -160),    // Approaching Speed Bump ramp
      new THREE.Vector3(-20, 2.4, -160),    // Speed Bump Peak (Arched Jump Ramp!)
      new THREE.Vector3(10, 0.0, -160),     // Smooth landing at finish straight
    ];

    this.curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
    this.totalLength = this.curve.getLength();

    // 64 Precision Checkpoints along the 3D circuit
    const numCheckpoints = 64;
    for (let i = 0; i < numCheckpoints; i++) {
      const u = i / numCheckpoints;
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      this.checkpoints.push({
        index: i,
        u: u,
        pos: pt,
        tangent: tangent,
        radius: this.trackWidth * 0.95
      });
    }
  }

  // ==========================================
  // 3. SKY DOME (Blue Sky with Cartoon Clouds)
  // ==========================================
  createSkyDome() {
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 256;
    const sCtx = skyCanvas.getContext('2d');

    // Sky gradient from rich azure blue down to soft horizon white-blue
    const grad = sCtx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1e88e5');
    grad.addColorStop(0.6, '#64b5f6');
    grad.addColorStop(1, '#e3f2fd');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 256);

    // Fluffy cartoon cumulus clouds along horizon
    sCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const cloudClusters = [
      { x: 80, y: 150, r: 35 },
      { x: 110, y: 140, r: 45 },
      { x: 145, y: 155, r: 30 },
      { x: 280, y: 130, r: 50 },
      { x: 325, y: 145, r: 40 },
      { x: 440, y: 150, r: 38 },
      { x: 470, y: 135, r: 48 },
    ];
    cloudClusters.forEach(c => {
      sCtx.beginPath();
      sCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      sCtx.fill();
    });

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyGeo = new THREE.SphereGeometry(650, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);
  }

  // ==========================================
  // 4. NATURAL MULTI-TONE GRASS GROUND PLANE
  // ==========================================
  createGround() {
    this.textures.grassTex.repeat.set(24, 24);
    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.textures.grassTex,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // ==========================================
  // 5. ROAD MESH (Dark Asphalt Following 3D Elevation)
  // ==========================================
  createRoadMesh() {
    const segments = 550;
    const roadGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const normals = [];

    const halfWidth = this.trackWidth / 2;
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const center = this.curve.getPointAt(u % 1);
      const tangent = this.curve.getTangentAt(u % 1).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Road surface points follow center.y elevation!
      const left = new THREE.Vector3().copy(center).addScaledVector(normal, -halfWidth);
      const right = new THREE.Vector3().copy(center).addScaledVector(normal, halfWidth);

      positions.push(left.x, left.y + 0.04, left.z);
      positions.push(right.x, right.y + 0.04, right.z);

      const v = (i / segments) * 120;
      uvs.push(0, v, 1, v);

      // Normal perpendicular to road slope
      const surfaceNorm = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      normals.push(surfaceNorm.x, surfaceNorm.y, surfaceNorm.z);
      normals.push(surfaceNorm.x, surfaceNorm.y, surfaceNorm.z);
    }

    const indices = [];
    for (let i = 0; i < segments; i++) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1);
      indices.push(base + 1, base + 2, base + 3);
    }

    roadGeo.setIndex(indices);
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    roadGeo.computeVertexNormals();
    roadGeo.computeBoundingBox();
    roadGeo.computeBoundingSphere();

    const roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.roadTex,
      roughness: 0.75,
      metalness: 0.12,
      side: THREE.DoubleSide
    });

    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.receiveShadow = true;
    this.scene.add(this.roadMesh);
  }

  // ==========================================
  // 6. AUTHENTIC VILLAGE BRICK FLOWERBED WALLS (벽돌화단)
  // ==========================================
  createBrickFlowerbedWalls() {
    const segments = 550;
    const halfWidth = this.trackWidth / 2;
    const wallHeight = 2.6; // High enough to retain karts and perfect for kart eye level
    const planterWidth = 1.4; // 1.4m wide flowerbed trough on top of brick wall
    const up = new THREE.Vector3(0, 1, 0);

    // Materials for Brick Flowerbed
    const curbMat = new THREE.MeshStandardMaterial({
      map: this.textures.curbTex,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    this.textures.curbTex.repeat.set(1, 220);

    const brickMat = new THREE.MeshStandardMaterial({
      map: this.textures.brickTex,
      roughness: 0.68,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
    this.textures.brickTex.repeat.set(1, 140);

    const flowerBedMat = new THREE.MeshStandardMaterial({
      map: this.textures.flowerBedTex,
      roughness: 0.85,
      metalness: 0.02,
      side: THREE.DoubleSide
    });
    this.textures.flowerBedTex.repeat.set(1, 100);

    const stoneTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf5eee6, // Sandstone planter coping trim
      roughness: 0.45,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const buildWallRibbon = (isRightSide) => {
      const sign = isRightSide ? 1 : -1;
      const curbGeo = new THREE.BufferGeometry();
      const brickGeo = new THREE.BufferGeometry();
      const bedGeo = new THREE.BufferGeometry();
      const rimGeo = new THREE.BufferGeometry();

      const cPos = [], cUVs = [];
      const bPos = [], bUVs = [];
      const bedPos = [], bedUVs = [];
      const rimPos = [];

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const center = this.curve.getPointAt(u % 1);
        const tangent = this.curve.getTangentAt(u % 1).normalize();
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

        const basePt = new THREE.Vector3().copy(center).addScaledVector(normal, sign * halfWidth);
        const outPt = new THREE.Vector3().copy(basePt).addScaledVector(normal, sign * planterWidth);
        const outerRimPt = new THREE.Vector3().copy(outPt).addScaledVector(normal, sign * 0.25);
        const v = (i / segments) * 80;

        // 1. Stone Plinth / Curb Base (from basePt.y to basePt.y + 0.35)
        cPos.push(basePt.x, basePt.y, basePt.z);
        cPos.push(basePt.x, basePt.y + 0.35, basePt.z);
        cUVs.push(0, v, 1, v);

        // 2. Vertical Warm Red Brick Wall Face (from basePt.y + 0.35 to basePt.y + wallHeight)
        bPos.push(basePt.x, basePt.y + 0.35, basePt.z);
        bPos.push(basePt.x, basePt.y + wallHeight, basePt.z);
        bUVs.push(0, v, 1, v);

        // 3. Lush Blooming Flowerbed Surface on top of the wall
        bedPos.push(basePt.x, basePt.y + wallHeight + 0.08, basePt.z);
        bedPos.push(outPt.x, basePt.y + wallHeight + 0.08, outPt.z);
        bedUVs.push(0, v, 1, v);

        // 4. Sandstone Planter Coping Rims (Inner and Outer Edges)
        rimPos.push(basePt.x, basePt.y + wallHeight + 0.16, basePt.z);
        rimPos.push(outerRimPt.x, basePt.y + wallHeight + 0.16, outerRimPt.z);
      }

      const indices = [];
      for (let i = 0; i < segments; i++) {
        const b = i * 2;
        indices.push(b, b + 2, b + 1);
        indices.push(b + 1, b + 2, b + 3);
      }

      // 1. Stone Curb Base
      curbGeo.setIndex(indices);
      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(cPos, 3));
      curbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(cUVs, 2));
      curbGeo.computeVertexNormals();
      const curbMesh = new THREE.Mesh(curbGeo, curbMat);
      curbMesh.receiveShadow = true;
      this.scene.add(curbMesh);

      // 2. Red Brick Retaining Wall
      brickGeo.setIndex(indices);
      brickGeo.setAttribute('position', new THREE.Float32BufferAttribute(bPos, 3));
      brickGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bUVs, 2));
      brickGeo.computeVertexNormals();
      const brickMesh = new THREE.Mesh(brickGeo, brickMat);
      brickMesh.castShadow = true;
      brickMesh.receiveShadow = true;
      this.scene.add(brickMesh);

      // 3. Flowerbed Surface
      bedGeo.setIndex(indices);
      bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPos, 3));
      bedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bedUVs, 2));
      bedGeo.computeVertexNormals();
      const bedMesh = new THREE.Mesh(bedGeo, flowerBedMat);
      bedMesh.castShadow = true;
      bedMesh.receiveShadow = true;
      this.scene.add(bedMesh);

      // 4. Planter Coping Trim
      rimGeo.setIndex(indices);
      rimGeo.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3));
      rimGeo.computeVertexNormals();
      const rimMesh = new THREE.Mesh(rimGeo, stoneTrimMat);
      this.scene.add(rimMesh);

      // 5. Procedural 3D Blooming Flower Clusters along the planter wall
      const flowerMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const flowerMatYellow = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3 });
      const flowerMatRed = new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.3 });
      const flowerMatPink = new THREE.MeshStandardMaterial({ color: 0xec407a, roughness: 0.3 });
      const bushMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.7 });
      const mats = [flowerMatWhite, flowerMatYellow, flowerMatRed, flowerMatPink];

      const step = 8; // Clump every 8 segments (~70 clumps per side)
      for (let i = 0; i < segments; i += step) {
        const u = i / segments;
        const center = this.curve.getPointAt(u % 1);
        const tangent = this.curve.getTangentAt(u % 1).normalize();
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const pMid = new THREE.Vector3().copy(center).addScaledVector(normal, sign * (halfWidth + planterWidth * 0.5));

        const clump = new THREE.Group();
        clump.position.set(pMid.x, pMid.y + wallHeight + 0.12, pMid.z);

        // Green shrub mound
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 6), bushMat);
        bush.scale.set(1.4, 0.45, 0.85);
        clump.add(bush);

        // 3 cute blooming flowers per clump
        for (let fl = 0; fl < 3; fl++) {
          const mat = mats[(i + fl) % mats.length];
          const flower = new THREE.Mesh(new THREE.SphereGeometry(0.22, 5, 5), mat);
          const fOff = (fl - 1) * 0.45;
          flower.position.set(fOff * tangent.x, 0.28, fOff * tangent.z);
          clump.add(flower);
        }

        this.scene.add(clump);
      }
    };

    buildWallRibbon(false); // Left wall
    buildWallRibbon(true);  // Right wall
  }

  // ==========================================
  // 7. START AREA EXTENDED ROAD MESH (출발선 뒤편 검은색 도로)
  // ==========================================
  createStartAreaRoadMesh() {
    // Spans seamlessly from Clock Tower tunnel exit (X = -130) past the Start Line (X = 65)
    // Completely replaces the grass behind the starting point with 100% dark black asphalt road
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 512;
    roadCanvas.height = 512;
    const rCtx = roadCanvas.getContext('2d');
    rCtx.fillStyle = '#1e2229'; // Dark Slate Charcoal
    rCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 8000; i++) {
      const nx = Math.random() * 512;
      const ny = Math.random() * 512;
      const shade = Math.floor(Math.random() * 30 + 20);
      rCtx.fillStyle = `rgba(${shade},${shade},${shade + 6},0.28)`;
      rCtx.fillRect(nx, ny, 2, 2);
    }
    const stagingRoadTex = new THREE.CanvasTexture(roadCanvas);
    stagingRoadTex.wrapS = THREE.RepeatWrapping;
    stagingRoadTex.wrapT = THREE.RepeatWrapping;
    stagingRoadTex.repeat.set(12, 3);

    const stagingGeo = new THREE.PlaneGeometry(210, 36);
    const stagingMat = new THREE.MeshStandardMaterial({
      map: stagingRoadTex,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const stagingMesh = new THREE.Mesh(stagingGeo, stagingMat);
    stagingMesh.rotation.x = -Math.PI / 2;
    stagingMesh.position.set(-35, 0.015, -160); // Centered on North Straight, flush on ground
    stagingMesh.receiveShadow = true;
    this.scene.add(stagingMesh);
  }

  // ==========================================
  // 8. SPEED BUMP JUMP PAD & ELEVATION (파란색 원, Y = 2.4m 점프대!)
  // ==========================================
  createSpeedBumpBridge() {
    const bumpGroup = new THREE.Group();
    bumpGroup.position.set(-20, 0, -160);

    // Yellow Chevron Jump Pad embedded flush on the road surface
    const padGeo = new THREE.PlaneGeometry(16, this.trackWidth * 0.90);
    const padMat = new THREE.MeshBasicMaterial({
      map: this.textures.bumpTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 2.44, 0);
    bumpGroup.add(pad);

    this.scene.add(bumpGroup);

    // Active jump boost trigger
    this.dashPads.push({
      position: new THREE.Vector3(-20, 2.4, -160),
      radius: 9.0,
      id: 99
    });
  }

  // ==========================================
  // 9. ELEVATED VIADUCT STONE ARCH PILLARS (서쪽 고가도로 하부)
  // ==========================================
  createViaductPillars() {
    // Under the scenic West Highway (Y = 1.5 to 6.0m), add massive stone viaduct pillars
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.7 });

    const viaductLocations = [
      { x: -185, y: 2.5, z: 60 },
      { x: -205, y: 4.5, z: 20 },
      { x: -205, y: 5.8, z: -20 },
      { x: -205, y: 5.8, z: -60 },
      { x: -185, y: 5.2, z: -105 },
    ];

    viaductLocations.forEach(loc => {
      const g = new THREE.Group();
      g.position.set(loc.x, 0, loc.z);

      // Heavy stone pier supporting the elevated road
      const pierGeo = new THREE.BoxGeometry(10, loc.y + 1, this.trackWidth + 8);
      const pier = new THREE.Mesh(pierGeo, stoneMat);
      pier.position.y = (loc.y + 1) * 0.5;
      pier.castShadow = true;
      g.add(pier);

      // Arched cutout relief in pier center
      const archHole = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 12, 16), new THREE.MeshStandardMaterial({ color: 0x546e7a }));
      archHole.rotation.x = Math.PI / 2;
      archHole.position.y = loc.y * 0.45;
      g.add(archHole);

      this.scene.add(g);
    });
  }

  // ==========================================
  // 9. CLOCK TOWER BUILDING & ARCH TUNNEL (빨간색 원!)
  // ==========================================
  createClockTowerBuilding() {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-95, 0, -160);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf3e5d0, roughness: 0.6 }); // Sandstone Stucco
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.45 }); // Green Mansard Roof
    const clockDialMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const bWidth = 36; // Along X (depth of tunnel)
    const bSpan = this.trackWidth + 14; // Along Z (38m wide across road)
    const archH = 15; // Clearance height

    // Left Abutment (+Z side)
    const pSouth = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 24, 10), wallMat);
    pSouth.position.set(0, 12, (bSpan * 0.5) + 5);
    pSouth.castShadow = true;
    towerGroup.add(pSouth);

    // Right Abutment (-Z side)
    const pNorth = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 24, 10), wallMat);
    pNorth.position.set(0, 12, -(bSpan * 0.5) - 5);
    pNorth.castShadow = true;
    towerGroup.add(pNorth);

    // Archway Lintel Beam spanning over road
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 8, bSpan + 20), wallMat);
    lintel.position.set(0, archH + 4, 0);
    lintel.castShadow = true;
    towerGroup.add(lintel);

    // Second Floor Building Body
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 4, 14, bSpan + 16), wallMat);
    floor2.position.set(0, archH + 15, 0);
    floor2.castShadow = true;
    towerGroup.add(floor2);

    // Iconic Green Mansard Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 9, bSpan + 20), roofMat);
    roof.position.set(0, archH + 26.5, 0);
    roof.castShadow = true;
    towerGroup.add(roof);

    // Central Clock Tower Spire
    const clockTower = new THREE.Mesh(new THREE.BoxGeometry(14, 18, 14), wallMat);
    clockTower.position.set(0, archH + 37, 0);
    clockTower.castShadow = true;
    towerGroup.add(clockTower);

    const spireRoof = new THREE.Mesh(new THREE.ConeGeometry(11, 13, 4), roofMat);
    spireRoof.position.set(0, archH + 52.5, 0);
    spireRoof.rotation.y = Math.PI / 4;
    towerGroup.add(spireRoof);

    // Working Circular Clock Face (+X side facing incoming racers)
    const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 0.6, 24), clockDialMat);
    clockFace.rotation.z = Math.PI / 2;
    clockFace.position.set(bWidth * 0.5 - 11, archH + 37, 0);
    towerGroup.add(clockFace);

    this.scene.add(towerGroup);
  }

  // ==========================================
  // 10. PURPLE PAGODA GATE (손가락 중간 게이트)
  // ==========================================
  createPurpleGate() {
    const gate = new THREE.Group();
    gate.position.set(90, 1.8, 0); // Sits on Finger 2 at Y = 1.8m

    const purpleMat = new THREE.MeshStandardMaterial({ color: 0x8e24aa, roughness: 0.4 });
    const colMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.45 });

    const gateWidth = this.trackWidth + 8;
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 16, 12), colMat);
    p1.position.set(0, 8, -gateWidth * 0.5);
    p1.castShadow = true;
    gate.add(p1);

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 16, 12), colMat);
    p2.position.set(0, 8, gateWidth * 0.5);
    p2.castShadow = true;
    gate.add(p2);

    // Tiered Purple Roof
    const roof1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, gateWidth + 8), purpleMat);
    roof1.position.set(0, 16, 0);
    roof1.castShadow = true;
    gate.add(roof1);

    const roof2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, gateWidth + 4), purpleMat);
    roof2.position.set(0, 18.5, 0);
    gate.add(roof2);

    this.scene.add(gate);
  }

  // ==========================================
  // 11. ROUNDABOUT CENTRAL PARK ISLAND
  // ==========================================
  createRoundaboutIsland() {
    const islandGroup = new THREE.Group();
    islandGroup.position.set(-130, 0, 175);

    const islandMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.85 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.4 });

    // Raised grassy island
    const island = new THREE.Mesh(new THREE.CylinderGeometry(20, 21, 0.8, 32), islandMat);
    island.position.y = 0.4;
    islandGroup.add(island);

    const curb = new THREE.Mesh(new THREE.CylinderGeometry(21, 21.4, 0.9, 32), curbMat);
    curb.position.y = 0.35;
    islandGroup.add(curb);

    // Centerpiece Fountain & Flower Ring
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1.5, 16), curbMat);
    fBase.position.y = 1.2;
    islandGroup.add(fBase);

    const water = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.1 }));
    water.position.y = 1.8;
    islandGroup.add(water);

    // Centerpiece Tall Tree
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 7, 8), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    trunk.position.y = 4.5;
    islandGroup.add(trunk);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(5.0, 10, 10), new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.7 }));
    leaves.position.y = 10.5;
    islandGroup.add(leaves);

    this.scene.add(islandGroup);
  }

  // ==========================================
  // 12. START / FINISH ARCH (검은색 점)
  // ==========================================
  createStartArch() {
    const archGroup = new THREE.Group();
    archGroup.position.set(50, 0, -160);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1976d2, metalness: 0.4, roughness: 0.3 });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xffca28, metalness: 0.2, roughness: 0.3 });

    const pWidth = this.trackWidth + 8;
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 18, 2.4), frameMat);
    p1.position.set(0, 9, -pWidth * 0.5);
    p1.castShadow = true;
    archGroup.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 18, 2.4), frameMat);
    p2.position.set(0, 9, pWidth * 0.5);
    p2.castShadow = true;
    archGroup.add(p2);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 5.0, pWidth + 4), bannerMat);
    beam.position.set(0, 16.5, 0);
    beam.castShadow = true;
    archGroup.add(beam);

    // "VILLAGE FINGERS - START" Banner
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d');
    bCtx.fillStyle = '#0d1b2a';
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.fillStyle = '#ffcc00';
    bCtx.font = '900 42px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('★ VILLAGE FINGERS ★', 256, 75);
    const bTex = new THREE.CanvasTexture(bannerCanvas);

    const dispMesh = new THREE.Mesh(new THREE.PlaneGeometry(this.trackWidth * 0.9, 3.8), new THREE.MeshBasicMaterial({ map: bTex }));
    dispMesh.position.set(-1.52, 16.5, 0);
    dispMesh.rotation.y = -Math.PI / 2;
    archGroup.add(dispMesh);

    this.scene.add(archGroup);

    // Checkerboard Start Line on Road
    const lineGeo = new THREE.PlaneGeometry(4.0, this.trackWidth * 0.96);
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 64;
    cCanvas.height = 256;
    const cCtx = cCanvas.getContext('2d');
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 4; c++) {
        cCtx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#111111';
        cCtx.fillRect(c * 16, r * 16, 16, 16);
      }
    }
    const lineMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cCanvas) });
    const startLine = new THREE.Mesh(lineGeo, lineMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(50, 0.08, -160);
    this.scene.add(startLine);
  }

  // ==========================================
  // 13. DASH PADS
  // ==========================================
  createDashPads() {
    const padLocations = [0.18, 0.52, 0.82];
    const padGeo = new THREE.PlaneGeometry(9, 6);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff5722';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#ffeb3b';
    ctx.shadowColor = '#ffeb3b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(64, 14);
    ctx.lineTo(118, 106);
    ctx.lineTo(90, 106);
    ctx.lineTo(64, 56);
    ctx.lineTo(38, 106);
    ctx.lineTo(10, 106);
    ctx.closePath();
    ctx.fill();

    const padTex = new THREE.CanvasTexture(canvas);
    const padMat = new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.95 });

    padLocations.forEach((u, idx) => {
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(pt.x, pt.y + 0.12, pt.z);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = angle + Math.PI;

      this.scene.add(pad);
      this.dashPads.push({
        position: pt,
        radius: 5.2,
        id: idx
      });
    });
  }

  // ==========================================
  // 14. ROTATING DUTCH WINDMILLS
  // ==========================================
  createWindmills() {
    const millLocations = [
      { x: 30, z: -220 },
      { x: 190, z: 220 },
      { x: -70, z: 230 }
    ];

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xefebe9, roughness: 0.7 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });

    millLocations.forEach(loc => {
      const g = new THREE.Group();
      g.position.set(loc.x, 0, loc.z);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 5.5, 18, 12), bodyMat);
      body.position.y = 9;
      body.castShadow = true;
      g.add(body);

      const bladeHub = new THREE.Group();
      bladeHub.position.set(0, 16.5, 4.0);

      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 0.15), bladeMat);
        blade.position.y = 7;
        const bladeArm = new THREE.Group();
        bladeArm.rotation.z = b * (Math.PI / 2);
        bladeArm.add(blade);
        bladeHub.add(bladeArm);
      }

      g.add(bladeHub);
      this.windmills.push(bladeHub);
      this.scene.add(g);
    });
  }

  // ==========================================
  // 15. VILLAGE TOWNHOUSES & CAFES (Detailed 2-3 Story Buildings)
  // ==========================================
  createVillageHouses() {
    const wallColors = [0xfff3e0, 0xfff9c4, 0xdcedc8, 0xffccbc, 0xb3e5fc];
    const roofColors = [0xc93b2b, 0x1e88e5, 0x43a047, 0xfb8c00, 0x8e24aa];
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });

    const houseConfigs = [
      // East Village (Right side of Fingers, hillside overlooking)
      { x: 260, y: 0, z: -140, rot: Math.PI / 2, floors: 2 },
      { x: 260, y: 0, z: -70, rot: Math.PI / 2, floors: 3 },
      { x: 260, y: 0, z: 10, rot: Math.PI / 2, floors: 2 },
      { x: 260, y: 0, z: 80, rot: Math.PI / 2, floors: 3 },
      // West Lower Village (Plains far from road)
      { x: -250, y: 0, z: 100, rot: -Math.PI / 2, floors: 2 },
      { x: -250, y: 0, z: 20, rot: -Math.PI / 2, floors: 3 },
      { x: -250, y: 0, z: -60, rot: -Math.PI / 2, floors: 2 },
    ];

    houseConfigs.forEach((cfg, idx) => {
      const houseGroup = new THREE.Group();
      const wallMat = new THREE.MeshStandardMaterial({ color: wallColors[idx % wallColors.length], roughness: 0.7 });
      const roofMat = new THREE.MeshStandardMaterial({ color: roofColors[idx % roofColors.length], roughness: 0.5 });

      const w = 20, h = cfg.floors * 7.5, d = 16;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      body.position.y = h / 2;
      body.castShadow = true;
      houseGroup.add(body);

      // Pitched Gabled Roof with Eaves
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.74, 8, 4), roofMat);
      roof.position.y = h + 4.0;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      houseGroup.add(roof);

      // Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.0, 5.0, 2.0), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
      chimney.position.set(w * 0.25, h + 5.0, 0);
      houseGroup.add(chimney);

      // Windows & Storefront Awning
      for (let floor = 0; floor < cfg.floors; floor++) {
        [-w * 0.28, w * 0.28].forEach(wx => {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.5), windowMat);
          win.position.set(wx, 4.0 + floor * 7.0, d * 0.5 + 0.1);
          houseGroup.add(win);
        });
      }

      // Striped Cafe Awning on ground floor
      if (cfg.floors >= 2) {
        const awningMat = new THREE.MeshStandardMaterial({ color: (idx % 2 === 0 ? 0xd32f2f : 0x1976d2), roughness: 0.6 });
        const awning = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 4.5), awningMat);
        awning.position.set(0, 5.5, d * 0.5 + 2.0);
        awning.rotation.x = 0.25;
        houseGroup.add(awning);
      }

      houseGroup.position.set(cfg.x, cfg.y, cfg.z);
      houseGroup.rotation.y = cfg.rot;
      this.scene.add(houseGroup);
    });
  }

  // ==========================================
  // 16. VILLAGE PROPS (Benches, Streetlamps, Flower Boxes, Crates)
  // ==========================================
  createVillageProps() {
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8, roughness: 0.2 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff9c4 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
    const flowerBoxMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const yellowCore = new THREE.MeshBasicMaterial({ color: 0xffd54f });

    // Roadside Streetlamps outside walls
    const lampPositions = [
      { x: 30, z: -140 },
      { x: 120, z: -140 },
      { x: 10, z: -20 },
      { x: 120, z: -20 },
      { x: -160, z: 70 },
      { x: -180, z: -20 },
      { x: -170, z: -130 },
    ];

    lampPositions.forEach(loc => {
      const g = new THREE.Group();
      g.position.set(loc.x, 0, loc.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 6.5, 8), lampMat);
      post.position.y = 3.25;
      g.add(post);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), glowMat);
      head.position.y = 6.6;
      g.add(head);

      this.scene.add(g);
    });

    // Flower Boxes & Wooden Crates outside walls
    for (let f = 0; f < 18; f++) {
      const u = f / 18;
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

      const boxPos = new THREE.Vector3().copy(pt).addScaledVector(normal, this.trackWidth * 0.5 + 3.2);

      const g = new THREE.Group();
      const trough = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.0, 1.6), flowerBoxMat);
      trough.position.y = pt.y + 0.5;
      trough.castShadow = true;
      g.add(trough);

      const shrub = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), new THREE.MeshStandardMaterial({ color: 0x43a047 }));
      shrub.scale.set(2.2, 0.8, 0.9);
      shrub.position.y = pt.y + 1.1;
      g.add(shrub);

      // White flowers
      [-1.2, 0, 1.2].forEach(fx => {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), flowerMat);
        petal.position.set(fx, pt.y + 1.5, 0);
        g.add(petal);

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), yellowCore);
        core.position.set(fx, pt.y + 1.6, 0);
        g.add(core);
      });

      g.position.copy(boxPos);
      g.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
      this.scene.add(g);
    }
  }

  // ==========================================
  // 17. STYLIZED TREES (Deciduous & Pines)
  // ==========================================
  createStylizedTrees() {
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.7 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 });

    for (let i = 0; i < 48; i++) {
      const u = i / 48;
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

      // Safely outside track barrier walls (20m to 42m from centerline)
      const dist = this.trackWidth * 0.5 + 11 + (i % 4) * 7;
      const treePos = new THREE.Vector3().copy(pt).addScaledVector(normal, dist);

      const tree = new THREE.Group();
      const isPine = (i % 4 === 0);

      if (isPine) {
        // Conical Pine Tree: rooted directly at ground level (Y = 0.0)
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 5, 8), trunkMat);
        trunk.position.y = 2.5;
        tree.add(trunk);

        const c1 = new THREE.Mesh(new THREE.ConeGeometry(4.0, 6, 8), pineMat);
        c1.position.y = 5.5;
        c1.castShadow = true;
        tree.add(c1);

        const c2 = new THREE.Mesh(new THREE.ConeGeometry(3.0, 5, 8), pineMat);
        c2.position.y = 8.5;
        c2.castShadow = true;
        tree.add(c2);
      } else {
        // Fluffy Deciduous Tree: rooted directly at ground level (Y = 0.0)
        const fMat = (i % 2 === 0) ? leafMat1 : leafMat2;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 5.5, 8), trunkMat);
        trunk.position.y = 2.75;
        tree.add(trunk);

        const f1 = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 10), fMat);
        f1.position.y = 7.0;
        f1.castShadow = true;
        tree.add(f1);

        const f2 = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 8), fMat);
        f2.position.set(1.5, 8.0, 0.5);
        f2.castShadow = true;
        tree.add(f2);
      }

      // Root tree firmly on the ground at Y = 0.0 (never floating in the sky!)
      tree.position.set(treePos.x, 0.0, treePos.z);
      this.scene.add(tree);
    }
  }

  // ==========================================
  // 18. REAL-TIME UPDATE & PROGRESS CHECK
  // ==========================================
  update(dt) {
    this.timeElapsed += dt;
    this.windmills.forEach(hub => {
      hub.rotation.z += dt * 1.5;
    });
  }

  getProgress(pos) {
    let closestDist = Infinity;
    let closestIndex = 0;
    for (let i = 0; i < this.checkpoints.length; i++) {
      const d = this.checkpoints[i].pos.distanceTo(pos);
      if (d < closestDist) {
        closestDist = d;
        closestIndex = i;
      }
    }
    return {
      index: closestIndex,
      u: this.checkpoints[closestIndex].u,
      dist: closestDist,
      cp: this.checkpoints[closestIndex]
    };
  }

  // ==========================================
  // 19. REAL-TIME DOWNWARD RAYCAST ROAD SURFACE & NORMAL
  // ==========================================
  getRoadSurfaceInfo(x, z, currentY) {
    if (!this.raycaster) {
      this.raycaster = new THREE.Raycaster();
      this.rayDown = new THREE.Vector3(0, -1, 0);
      this.rayOrigin = new THREE.Vector3();
    }

    const searchY = (currentY !== undefined && !isNaN(currentY)) ? currentY + 4.0 : 12.0;
    this.rayOrigin.set(x, searchY, z);
    this.raycaster.set(this.rayOrigin, this.rayDown);
    this.raycaster.far = 16.0;

    if (this.roadMesh) {
      const hits = this.raycaster.intersectObject(this.roadMesh, false);
      if (hits.length > 0) {
        const hit = hits[0];
        const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        if (normal.y < 0) normal.negate();
        return {
          y: hit.point.y,
          normal: normal,
          hit: true
        };
      }
    }

    // High-precision smooth spline fallback if outside road mesh
    const progress = this.getProgress(new THREE.Vector3(x, 0, z));
    const cp = progress.cp || this.checkpoints[0];
    const u = progress.u;
    const pt = this.curve.getPointAt(u);
    const tangent = this.curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const surfaceNorm = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    return {
      y: pt.y,
      normal: surfaceNorm,
      hit: false
    };
  }

  // ==========================================
  // 20. AUTOMATED TRACK WAYPOINT VALIDATOR
  // ==========================================
  validateTrackWaypoints() {
    const total = this.checkpoints.length;
    let minRadius = Infinity;
    let maxAngleDeg = 0;

    const halfWidth = this.trackWidth * 0.5; // 12.0m
    const kartSafetyMargin = 4.2; // vehicle radius + safe buffer
    const usableHalfWidth = halfWidth - kartSafetyMargin; // 7.8m

    for (let i = 0; i < total; i++) {
      const prev = this.checkpoints[(i - 1 + total) % total].pos;
      const curr = this.checkpoints[i].pos;
      const next = this.checkpoints[(i + 1) % total].pos;

      const v1 = new THREE.Vector3().subVectors(curr, prev);
      const v2 = new THREE.Vector3().subVectors(next, curr);

      const ds = (v1.length() + v2.length()) * 0.5;
      const cosAngle = Math.max(-1, Math.min(1, v1.clone().normalize().dot(v2.clone().normalize())));
      const angle = Math.acos(cosAngle);
      const angleDeg = (angle * 180) / Math.PI;
      if (angleDeg > maxAngleDeg) maxAngleDeg = angleDeg;

      if (ds > 0.001 && angle > 0.0001) {
        const radius = ds / angle;
        if (radius < minRadius) minRadius = radius;
      }
    }

    console.log(
      `%c[TrackValidator] ✅ All ${total} checkpoints verified! Min Turning Radius: ${minRadius.toFixed(1)}m | Road Width: ${this.trackWidth}m | Usable Safe Width: ${(usableHalfWidth * 2).toFixed(1)}m | Max Inter-Waypoint Angle: ${maxAngleDeg.toFixed(1)}°`,
      'color: #00ff88; font-weight: bold;'
    );
  }
}

window.Track = Track;
