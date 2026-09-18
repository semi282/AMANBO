// 4 Original SD Character Models (Leo, Tori, Luna, Kai)
// Correct 3D Forward Facing (-Z) Geometry and Cockpit Animation System

class SDCharacter {
  constructor(charType = 'leo') {
    this.type = charType;
    this.mesh = new THREE.Group();
    
    // Animation Bones
    this.headGroup = null;
    this.torsoGroup = null;
    this.leftArm = null;
    this.rightArm = null;
    this.steeringWheel = null;

    // Dynamics
    this.currentLean = 0;
    this.currentPitch = 0;

    this.charConfig = this.getConfig(charType);
    this.buildModel();
  }

  getConfig(type) {
    const configs = {
      leo: {
        id: 'leo',
        name: '레오 (Leo)',
        title: '에너제틱 스피더',
        primaryColor: 0x0077ff,   // Cobalt Blue
        secondaryColor: 0xffd700, // Lemon Gold
        skinColor: 0xffdfc4,
        suitColor: 0x0d47a1,
        visorColor: 0x00f2fe,
        helmetStyle: 'winged'
      },
      tori: {
        id: 'tori',
        name: '토리 (Tori)',
        title: '트릭 드리프터',
        primaryColor: 0xff6b35,   // Coral Orange
        secondaryColor: 0xffe66d, // Sunshine Yellow
        skinColor: 0xffe0bd,
        suitColor: 0xd84315,
        visorColor: 0x222222,
        helmetStyle: 'goggle_cap'
      },
      luna: {
        id: 'luna',
        name: '루나 (Luna)',
        title: '부드러운 코너링',
        primaryColor: 0xff80ab,   // Pastel Pink
        secondaryColor: 0x69f0ae, // Mint Green
        skinColor: 0xfff0e1,
        suitColor: 0xf06292,
        visorColor: 0x4fc3f7,
        helmetStyle: 'blossom'
      },
      kai: {
        id: 'kai',
        name: '카이 (Kai)',
        title: '하이테크 레이서',
        primaryColor: 0x7c4dff,   // Deep Violet
        secondaryColor: 0xb0bec5, // Metallic Silver
        skinColor: 0xf5d0b5,
        suitColor: 0x311b92,
        visorColor: 0x18ffff,
        helmetStyle: 'tech_visor'
      }
    };
    return configs[type] || configs.leo;
  }

  buildModel() {
    const cfg = this.charConfig;

    const skinMat = new THREE.MeshStandardMaterial({ color: cfg.skinColor, roughness: 0.6 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: cfg.primaryColor, roughness: 0.3, metalness: 0.4 });
    const accentMat = new THREE.MeshStandardMaterial({ color: cfg.secondaryColor, roughness: 0.3, metalness: 0.5 });
    const suitMat = new THREE.MeshStandardMaterial({ color: cfg.suitColor, roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

    // 1. Torso Group (Front is -Z, Back is +Z)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.45, 0);

    // Torso body
    const torsoGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.72, 16);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.castShadow = true;
    this.torsoGroup.add(torso);

    // Chest Stripe (On FRONT facing -Z)
    const stripeGeo = new THREE.BoxGeometry(0.45, 0.72, 0.12);
    const stripe = new THREE.Mesh(stripeGeo, accentMat);
    stripe.position.set(0, 0, -0.46);
    this.torsoGroup.add(stripe);

    // Seated Legs (Extending forward -Z)
    const legGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12);
    legGeo.rotateX(-Math.PI / 2.5);
    const leftLeg = new THREE.Mesh(legGeo, suitMat);
    leftLeg.position.set(-0.28, -0.25, -0.28);
    const rightLeg = new THREE.Mesh(legGeo, suitMat);
    rightLeg.position.set(0.28, -0.25, -0.28);
    this.torsoGroup.add(leftLeg);
    this.torsoGroup.add(rightLeg);

    // 2. Head Group (Centered at y = 0.85)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.85, 0);

    // Main Head Sphere
    const headGeo = new THREE.SphereGeometry(0.72, 24, 24);
    const head = new THREE.Mesh(headGeo, helmetMat);
    head.scale.set(1.15, 1.05, 1.1);
    head.castShadow = true;
    this.headGroup.add(head);

    // Face Plane (On FRONT facing directly -Z)
    const faceTex = this.createFaceTexture(cfg);
    const faceGeo = new THREE.PlaneGeometry(0.85, 0.65);
    const faceMat = new THREE.MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      depthWrite: false
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 0.05, -0.74); // Directly on front surface
    this.headGroup.add(face);

    // Helmet Styles & Ornaments (Facing -Z)
    this.buildHelmetOrnaments(cfg, helmetMat, accentMat, darkMat);

    this.torsoGroup.add(this.headGroup);

    // 3. Arms & Steering Wheel (In front of chest, towards -Z)
    this.buildArmsAndWheel(suitMat, skinMat, darkMat);

    this.mesh.add(this.torsoGroup);
  }

  buildHelmetOrnaments(cfg, helmetMat, accentMat, darkMat) {
    if (cfg.helmetStyle === 'winged') {
      const wingGeo = new THREE.BoxGeometry(0.1, 0.28, 0.55);
      const leftWing = new THREE.Mesh(wingGeo, accentMat);
      leftWing.position.set(-0.85, 0.25, 0);
      leftWing.rotation.z = -0.3;
      const rightWing = new THREE.Mesh(wingGeo, accentMat);
      rightWing.position.set(0.85, 0.25, 0);
      rightWing.rotation.z = 0.3;
      this.headGroup.add(leftWing);
      this.headGroup.add(rightWing);

    } else if (cfg.helmetStyle === 'goggle_cap') {
      // Goggles on FRONT (-Z)
      const goggleFrameGeo = new THREE.TorusGeometry(0.22, 0.06, 8, 16);
      const g1 = new THREE.Mesh(goggleFrameGeo, accentMat);
      g1.position.set(-0.32, 0.35, -0.72);
      const g2 = new THREE.Mesh(goggleFrameGeo, accentMat);
      g2.position.set(0.32, 0.35, -0.72);
      this.headGroup.add(g1);
      this.headGroup.add(g2);

      // Ears on top sides
      const earGeo = new THREE.SphereGeometry(0.24, 12, 12);
      const e1 = new THREE.Mesh(earGeo, helmetMat);
      e1.position.set(-0.75, 0.6, 0);
      const e2 = new THREE.Mesh(earGeo, helmetMat);
      e2.position.set(0.75, 0.6, 0);
      this.headGroup.add(e1);
      this.headGroup.add(e2);

    } else if (cfg.helmetStyle === 'blossom') {
      // Cap Brim extending to FRONT (-Z)
      const brimGeo = new THREE.BoxGeometry(0.9, 0.08, 0.45);
      const brim = new THREE.Mesh(brimGeo, accentMat);
      brim.position.set(0, 0.35, -0.72);
      brim.rotation.x = -0.15;
      this.headGroup.add(brim);

      // Blossom Badge on front
      const flowerGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 8);
      flowerGeo.rotateX(Math.PI / 2);
      const flower = new THREE.Mesh(flowerGeo, accentMat);
      flower.position.set(0, 0.62, -0.72);
      this.headGroup.add(flower);

    } else if (cfg.helmetStyle === 'tech_visor') {
      // Sleek Curved Visor on FRONT (-Z)
      const visorGeo = new THREE.BoxGeometry(1.2, 0.35, 0.35);
      const techVisorMat = new THREE.MeshStandardMaterial({
        color: cfg.visorColor,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x003344
      });
      const visor = new THREE.Mesh(visorGeo, techVisorMat);
      visor.position.set(0, 0.15, -0.65);
      this.headGroup.add(visor);
    }
  }

  buildArmsAndWheel(suitMat, skinMat, darkMat) {
    // Steering Wheel in front of chest (at z = -0.85)
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(0, 0.4, -0.8);
    wheelGroup.rotation.x = 0.25;

    const rimGeo = new THREE.TorusGeometry(0.32, 0.05, 8, 20);
    const rim = new THREE.Mesh(rimGeo, darkMat);
    wheelGroup.add(rim);

    const spokeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const spoke = new THREE.Mesh(spokeGeo, darkMat);
    wheelGroup.add(spoke);
    this.torsoGroup.add(wheelGroup);
    this.steeringWheel = wheelGroup;

    // Arms reaching forward to steering wheel
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 10);
    armGeo.rotateX(-0.8);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 0.2, -0.2);
    armGeo.rotateZ(-0.25);
    const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
    this.leftArm.add(leftArmMesh);
    this.torsoGroup.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 0.2, -0.2);
    const rArmGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 10);
    rArmGeo.rotateX(-0.8);
    rArmGeo.rotateZ(0.25);
    const rightArmMesh = new THREE.Mesh(rArmGeo, suitMat);
    this.rightArm.add(rightArmMesh);
    this.torsoGroup.add(this.rightArm);
  }

  createFaceTexture(cfg) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 192);

    ctx.fillStyle = '#1a1a1a';

    if (cfg.id === 'leo') {
      // Sparkling lively eyes
      ctx.beginPath();
      ctx.ellipse(75, 85, 18, 26, 0, 0, Math.PI * 2);
      ctx.ellipse(181, 85, 18, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(70, 75, 7, 0, Math.PI * 2);
      ctx.arc(176, 75, 7, 0, Math.PI * 2);
      ctx.fill();

      // Cheerful smile
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 115, 24, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();

    } else if (cfg.id === 'tori') {
      // Left eye open, right eye cheeky wink
      ctx.beginPath();
      ctx.ellipse(75, 85, 18, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(71, 78, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(181, 90, 18, 1.15 * Math.PI, 1.85 * Math.PI, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(128, 118, 26, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();

    } else if (cfg.id === 'luna') {
      // Cute round eyes & blush
      ctx.beginPath();
      ctx.arc(78, 85, 20, 0, Math.PI * 2);
      ctx.arc(178, 85, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(74, 78, 8, 0, Math.PI * 2);
      ctx.arc(174, 78, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 105, 180, 0.55)';
      ctx.beginPath();
      ctx.ellipse(55, 112, 16, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(201, 112, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(128, 120, 16, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();

    } else if (cfg.id === 'kai') {
      // Sharp determined racer eyes
      ctx.beginPath();
      ctx.moveTo(55, 90);
      ctx.lineTo(100, 80);
      ctx.lineTo(100, 94);
      ctx.closePath();
      ctx.moveTo(201, 90);
      ctx.lineTo(156, 80);
      ctx.lineTo(156, 94);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(110, 125);
      ctx.quadraticCurveTo(135, 130, 150, 115);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // Animation Update
  update(dt, kartSpeed, steerInput, isDrifting, driftDir, isBoosting, isBraking) {
    if (!this.torsoGroup || !this.headGroup) return;

    // 1. Steering Wheel Rotation
    let targetSteer = 0;
    if (steerInput < 0) targetSteer = 0.55;  // Left
    if (steerInput > 0) targetSteer = -0.55; // Right

    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = THREE.MathUtils.lerp(this.steeringWheel.rotation.z, targetSteer, dt * 12);
    }

    // 2. Drift Body Lean (Leaning into corner apex)
    let targetRoll = 0;
    if (isDrifting && driftDir !== 0) {
      targetRoll = driftDir * 0.42;
    } else {
      targetRoll = -targetSteer * 0.2;
    }
    this.currentLean = THREE.MathUtils.lerp(this.currentLean, targetRoll, dt * 8);
    this.torsoGroup.rotation.z = this.currentLean;

    // 3. Acceleration & Booster Pitch
    let targetPitch = 0;
    if (isBoosting) {
      targetPitch = 0.25; // Pushed back into seat by rocket thrust
    } else if (isBraking) {
      targetPitch = -0.3; // Forward pitch under braking
    } else if (kartSpeed > 20) {
      targetPitch = 0.06;
    }
    this.currentPitch = THREE.MathUtils.lerp(this.currentPitch, targetPitch, dt * 6);
    this.torsoGroup.rotation.x = this.currentPitch;

    // Head turning
    this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, targetSteer * 0.35, dt * 10);
  }
}

window.SDCharacter = SDCharacter;
