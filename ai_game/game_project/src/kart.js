// 3D Kart Model, Arcade Drift Physics, and SD Character Integration

class Kart {
  constructor(scene, isPlayer = false, charType = 'leo') {
    this.scene = scene;
    this.isPlayer = isPlayer;
    this.charType = charType;

    // Movement & Physics
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = -Math.PI / 2; // Default facing East (+X)
    this.chassisAngle = -Math.PI / 2;
    this.speed = 0;
    
    // Performance Tuning
    this.baseMaxSpeed = 48; // ~145 km/h
    this.boostMaxSpeed = 74; // ~225 km/h
    this.driftMaxSpeed = 34; // ~105 km/h (drift deceleration limit)
    this.accel = 32;
    this.decel = 20;
    this.brake = 45;
    this.turnRate = 2.4;

    // Drift & Booster Mechanics
    this.isDrifting = false;
    this.driftDir = 0;
    this.driftSlip = 0;
    this.boostGauge = 0;
    this.boosters = 0;
    this.isBoosting = false;
    this.boostTimeRemaining = 0;
    this.dashBoostRemaining = 0;
    this.pitch = 0;
    this.surfaceRoll = 0;
    this.wheelGroundOffset = 0.02; // Exact wheel contact alignment on asphalt
    this.verticalVelocity = 0;

    // Inputs
    this.inputs = {
      up: false,
      down: false,
      left: false,
      right: false,
      steerValue: 0,
      drift: false,
      boost: false,
      reset: false
    };

    // Entities
    this.mesh = null;
    this.character = null;
    this.wheels = [];
    this.exhaustFlames = [];
    this.smokeParticles = [];

    this.createModel();
    this.initParticles();
    this.setHeading(this.heading);
  }

  createModel() {
    this.mesh = new THREE.Group();

    // Mount 3D Animated SD Character (Facing -Z)
    this.character = new SDCharacter(this.charType);
    const cfg = this.character.charConfig;

    // Kart Body Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: cfg.primaryColor,
      roughness: 0.25,
      metalness: 0.6,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: cfg.secondaryColor,
      roughness: 0.3,
      metalness: 0.4
    });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, roughness: 0.1, transmission: 0.6, transparent: true });

    // Main Chassis
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.7, 4.0);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    this.mesh.add(chassis);

    // Nose Cone (At FRONT: -Z)
    const noseGeo = new THREE.CylinderGeometry(1.2, 1.4, 1.8, 12);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.5, -2.2);
    nose.scale.set(0.9, 1, 0.6);
    nose.castShadow = true;
    this.mesh.add(nose);

    // Accent Stripe
    const stripeGeo = new THREE.BoxGeometry(0.6, 0.72, 1.9);
    const stripe = new THREE.Mesh(stripeGeo, accentMat);
    stripe.position.set(0, 0.52, -2.1);
    this.mesh.add(stripe);

    // Front Bumper (At FRONT: -Z)
    const bumperGeo = new THREE.BoxGeometry(2.8, 0.3, 0.8);
    const bumper = new THREE.Mesh(bumperGeo, blackMat);
    bumper.position.set(0, 0.35, -2.6);
    bumper.castShadow = true;
    this.mesh.add(bumper);

    // Windshield
    const shieldGeo = new THREE.BoxGeometry(1.8, 0.6, 0.1);
    const shield = new THREE.Mesh(shieldGeo, glassMat);
    shield.position.set(0, 1.15, -0.8);
    shield.rotation.x = 0.4;
    this.mesh.add(shield);

    // Side Pods
    const podGeo = new THREE.BoxGeometry(0.5, 0.6, 2.4);
    const leftPod = new THREE.Mesh(podGeo, bodyMat);
    leftPod.position.set(-1.4, 0.5, 0);
    leftPod.castShadow = true;
    this.mesh.add(leftPod);

    const rightPod = new THREE.Mesh(podGeo, bodyMat);
    rightPod.position.set(1.4, 0.5, 0);
    rightPod.castShadow = true;
    this.mesh.add(rightPod);

    // Rear Spoiler (At BACK: +Z)
    const spoilerGeo = new THREE.BoxGeometry(2.6, 0.15, 0.8);
    const spoiler = new THREE.Mesh(spoilerGeo, accentMat);
    spoiler.position.set(0, 1.6, 2.0);
    spoiler.castShadow = true;
    this.mesh.add(spoiler);

    // Spoiler Struts
    const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8);
    const s1 = new THREE.Mesh(strutGeo, chromeMat);
    s1.position.set(-0.8, 1.2, 2.0);
    const s2 = new THREE.Mesh(strutGeo, chromeMat);
    s2.position.set(0.8, 1.2, 2.0);
    this.mesh.add(s1);
    this.mesh.add(s2);

    // Mount SD Character in cockpit seat facing -Z
    this.character.mesh.position.set(0, 0.35, 0.1);
    this.mesh.add(this.character.mesh);

    // Exhaust Pipes (At BACK: +Z)
    const exhaustGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 12);
    const ex1 = new THREE.Mesh(exhaustGeo, chromeMat);
    ex1.rotation.x = Math.PI / 2;
    ex1.position.set(-0.6, 0.5, 2.2);
    const ex2 = new THREE.Mesh(exhaustGeo, chromeMat);
    ex2.rotation.x = Math.PI / 2;
    ex2.position.set(0.6, 0.5, 2.2);
    this.mesh.add(ex1);
    this.mesh.add(ex2);

    // Booster Exhaust Flames (At BACK: +Z)
    const flameGeo = new THREE.ConeGeometry(0.38, 2.0, 12);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.95
    });
    const f1 = new THREE.Mesh(flameGeo, flameMat);
    f1.rotation.x = -Math.PI / 2;
    f1.position.set(-0.6, 0.5, 3.3);
    f1.visible = false;
    const f2 = new THREE.Mesh(flameGeo, flameMat);
    f2.rotation.x = -Math.PI / 2;
    f2.position.set(0.6, 0.5, 3.3);
    f2.visible = false;
    this.mesh.add(f1);
    this.mesh.add(f2);
    this.exhaustFlames = [f1, f2];

    // Wheels
    const wheelPositions = [
      { x: -1.4, y: 0.45, z: -1.4, isFront: true },
      { x: 1.4, y: 0.45, z: -1.4, isFront: true },
      { x: -1.45, y: 0.5, z: 1.5, isFront: false },
      { x: 1.45, y: 0.5, z: 1.5, isFront: false }
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: cfg.secondaryColor, metalness: 0.8, roughness: 0.2 });

    this.wheels = [];
    wheelPositions.forEach(p => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(p.x, p.y, p.z);

      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.46, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      this.mesh.add(wheelGroup);
      this.wheels.push({
        group: wheelGroup,
        tireMesh: tire,
        isFront: p.isFront
      });
    });

    this.scene.add(this.mesh);
  }

  initParticles() {
    this.smokeGroup = new THREE.Group();
    const smokeGeo = new THREE.SphereGeometry(0.3, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.4 });
    
    for (let i = 0; i < 30; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.smokeGroup.add(p);
      this.smokeParticles.push({
        mesh: p,
        life: 0,
        maxLife: 0.5,
        vel: new THREE.Vector3()
      });
    }
    this.scene.add(this.smokeGroup);
  }

  emitSmoke(pos) {
    const p = this.smokeParticles.find(sp => !sp.mesh.visible);
    if (!p) return;
    p.mesh.visible = true;
    p.mesh.position.copy(pos);
    p.life = p.maxLife;
    p.vel.set((Math.random() - 0.5) * 2, Math.random() * 1.5 + 0.5, (Math.random() - 0.5) * 2);
    p.mesh.scale.setScalar(0.6 + Math.random() * 0.4);
  }

  updateParticles(dt) {
    this.smokeParticles.forEach(p => {
      if (p.mesh.visible) {
        p.life -= dt;
        if (p.life <= 0) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.vel, dt);
          p.mesh.scale.addScalar(dt * 1.5);
          p.mesh.material.opacity = (p.life / p.maxLife) * 0.4;
        }
      }
    });

    if (this.isBoosting || this.dashBoostRemaining > 0) {
      const s = 1.0 + Math.sin(Date.now() * 0.05) * 0.3;
      this.exhaustFlames.forEach(f => {
        f.visible = true;
        f.scale.set(s, s * (1.2 + Math.random() * 0.4), s);
      });
    } else {
      this.exhaustFlames.forEach(f => { f.visible = false; });
    }
  }

  update(dt, track) {
    this.handleControls(dt);
    this.applyPhysics(dt, track);
    this.updateVisuals(dt);
    this.updateParticles(dt);

    if (this.character) {
      let steerInput = 0;
      if (this.inputs.left) steerInput -= 1;
      if (this.inputs.right) steerInput += 1;

      const isBoosting = this.isBoosting || this.dashBoostRemaining > 0;
      this.character.update(
        dt,
        this.speed,
        steerInput,
        this.isDrifting,
        this.driftDir,
        isBoosting,
        this.inputs.down
      );
    }
  }

  handleControls(dt) {
    const input = this.inputs;

    // Explicit Booster Activation only
    if (input.boost && this.boosters > 0 && !this.isBoosting) {
      this.activateBooster();
      input.boost = false;
    }

    if (this.isBoosting) {
      this.boostTimeRemaining -= dt;
      if (this.boostTimeRemaining <= 0) {
        this.isBoosting = false;
      }
    }
    if (this.dashBoostRemaining > 0) {
      this.dashBoostRemaining -= dt;
    }

    // Steering
    let steerDir = 0;
    if (input.left) steerDir += 1;
    if (input.right) steerDir -= 1;
    if (input.steerValue !== undefined && input.steerValue !== 0) {
      steerDir = input.steerValue;
    }

    // Drift Detection (Shift + Steering)
    const wantsDrift = input.drift && (steerDir !== 0) && (this.speed > 16);

    // Max speed calculation
    let currentMaxSpeed = this.baseMaxSpeed;
    if (this.isBoosting) {
      currentMaxSpeed = this.boostMaxSpeed;
    } else if (this.dashBoostRemaining > 0) {
      currentMaxSpeed = this.boostMaxSpeed * 0.95;
    } else if (wantsDrift) {
      // DRIFT DECELERATION: Drifting caps top speed and induces sliding friction!
      currentMaxSpeed = this.driftMaxSpeed;
    }

    // Acceleration & Braking with Drift Friction
    if (input.up) {
      let a = (this.isBoosting ? this.accel * 2.5 : this.accel);
      if (wantsDrift) {
        // Drift resistance slows down acceleration
        a *= 0.4;
      }
      if (this.speed > currentMaxSpeed) {
        // Naturally decelerate towards drift cap
        this.speed = Math.max(currentMaxSpeed, this.speed - 22 * dt);
      } else {
        this.speed = Math.min(this.speed + a * dt, currentMaxSpeed);
      }
    } else if (input.down) {
      if (this.speed > 0) {
        this.speed = Math.max(this.speed - this.brake * dt, 0);
      } else {
        this.speed = Math.max(this.speed - this.accel * 0.6 * dt, -16);
      }
    } else {
      // Natural rolling friction
      if (this.speed > 0) {
        this.speed = Math.max(this.speed - this.decel * dt, 0);
      } else if (this.speed < 0) {
        this.speed = Math.min(this.speed + this.decel * dt, 0);
      }
    }

    // Drift Dynamics & Slip
    if (wantsDrift) {
      if (!this.isDrifting) {
        this.isDrifting = true;
        this.driftDir = steerDir;
        if (this.isPlayer && window.soundSystem) {
          window.soundSystem.setDriftVolume(0.85);
        }
      }

      // Drift Slip Angle
      const targetSlip = this.driftDir * 0.45;
      this.driftSlip = THREE.MathUtils.lerp(this.driftSlip, targetSlip, dt * 6);
      this.heading += this.driftDir * this.turnRate * 1.3 * dt;

      // Charge Booster Gauge
      const charge = (this.speed / this.baseMaxSpeed) * 36 * dt;
      this.boostGauge = Math.min(100, this.boostGauge + charge);

      if (this.boostGauge >= 100) {
        if (this.boosters < 2) {
          this.boosters++;
          if (this.isPlayer && window.soundSystem) {
            window.soundSystem.playBoosterEarned();
          }
        }
        this.boostGauge = 0;
      }

      // Tire smoke
      if (Math.random() < 0.7) {
        const backLeft = new THREE.Vector3(-1.3, 0.2, 1.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.chassisAngle).add(this.position);
        const backRight = new THREE.Vector3(1.3, 0.2, 1.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.chassisAngle).add(this.position);
        this.emitSmoke(backLeft);
        this.emitSmoke(backRight);
      }

    } else {
      // Not drifting: smoothly recover
      if (this.isDrifting) {
        this.isDrifting = false;
        if (this.isPlayer && window.soundSystem) {
          window.soundSystem.setDriftVolume(0);
        }
        // NOTE: No automatic mini-boost here to prevent unwanted boosting!
      }

      if (steerDir !== 0 && Math.abs(this.speed) > 0.2) {
        const factor = (this.speed >= 0 ? 1 : -1);
        this.heading += steerDir * this.turnRate * factor * dt;
      }

      this.driftSlip = THREE.MathUtils.lerp(this.driftSlip, 0, dt * 10);
    }
  }

  activateBooster() {
    this.boosters--;
    this.isBoosting = true;
    this.boostTimeRemaining = 3.2;
    this.speed = Math.max(this.speed, this.boostMaxSpeed * 0.85);

    if (this.isPlayer && window.soundSystem) {
      window.soundSystem.playBooster();
    }
  }

  triggerDashPad() {
    this.speed = this.boostMaxSpeed;
    this.dashBoostRemaining = 1.4;
    if (this.isPlayer && window.soundSystem) {
      window.soundSystem.playDashPad();
    }
  }

  applyPhysics(dt, track) {
    const fwd = new THREE.Vector3(
      -Math.sin(this.heading),
      0,
      -Math.cos(this.heading)
    );

    this.velocity.copy(fwd).multiplyScalar(this.speed);
    this.position.addScaledVector(this.velocity, dt);

    if (track) {
      // 1. Real-time downward Raycast against actual 3D road surface mesh
      const surface = track.getRoadSurfaceInfo(this.position.x, this.position.z, this.position.y);
      const targetY = surface.y + this.wheelGroundOffset;

      // Suspension tracking: strictly prevent sinking below asphalt, smooth hover recovery
      if (this.position.y < targetY) {
        this.position.y = targetY;
        this.verticalVelocity = 0;
      } else {
        this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, dt * 25);
      }

      // 2. Pitch & Roll orientation from 3D road surface normal
      const norm = surface.normal;
      const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

      // Slope incline along kart heading (forward -sin H, 0, -cos H)
      const fwdSlope = -fwd.x * norm.x - fwd.z * norm.z;
      const targetPitch = Math.max(-0.40, Math.min(0.40, fwdSlope));
      this.pitch = THREE.MathUtils.lerp(this.pitch || 0, targetPitch, dt * 15);

      // Lateral banking along right vector
      const latSlope = right.x * norm.x + right.z * norm.z;
      const targetRoll = Math.max(-0.25, Math.min(0.25, latSlope));
      this.surfaceRoll = THREE.MathUtils.lerp(this.surfaceRoll || 0, targetRoll, dt * 15);

      // 3. Track Boundary & Wall Collision
      const progress = track.getProgress(this.position);
      const cp = progress.cp;
      if (cp) {
        const tangent = cp.tangent;
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const offsetVec = new THREE.Vector3().subVectors(this.position, cp.pos);
        offsetVec.y = 0;
        const lateralDist = offsetVec.dot(normal);
        const maxHalfWidth = (track.trackWidth * 0.5) - 1.4; // 10.6m

        if (Math.abs(lateralDist) > maxHalfWidth) {
          // Wall Collision: clamp position inside track boundary
          const clampedDist = Math.sign(lateralDist) * maxHalfWidth;
          this.position.x = cp.pos.x + normal.x * clampedDist;
          this.position.z = cp.pos.z + normal.z * clampedDist;

          // Wall impact friction & speed penalty (preserve reverse capability!)
          if (this.speed > 0) {
            this.speed = Math.max(0, this.speed * 0.88);
          } else {
            this.speed = Math.min(0, this.speed * 0.88);
          }

          // Deflect heading slightly away from wall
          const steerAway = (lateralDist > 0 ? 1 : -1) * 0.85 * dt;
          this.heading += steerAway;

          if (this.isPlayer) {
            this.emitSmoke(this.position);
          }
        }
      }

      track.dashPads.forEach(pad => {
        if (this.position.distanceTo(pad.position) < pad.radius) {
          if (this.dashBoostRemaining <= 0) {
            this.triggerDashPad();
          }
        }
      });
    }

    this.chassisAngle = this.heading + this.driftSlip;
  }

  updateVisuals(dt) {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.chassisAngle;
    this.mesh.rotation.x = this.pitch || 0;

    const roll = (this.surfaceRoll || 0) + (-this.driftSlip * 0.35);
    this.mesh.rotation.z = roll;

    const wheelRotSpeed = (this.speed / 0.5) * dt;
    this.wheels.forEach(w => {
      w.tireMesh.rotation.x += wheelRotSpeed;
      if (w.isFront) {
        let steerAngle = 0;
        if (this.inputs.left) steerAngle = 0.35;
        if (this.inputs.right) steerAngle = -0.35;
        if (this.inputs.steerValue !== undefined && this.inputs.steerValue !== 0) {
          steerAngle = this.inputs.steerValue * 0.35;
        }
        w.group.rotation.y = steerAngle;
      }
    });
  }

  setHeading(angle) {
    this.heading = angle;
    this.chassisAngle = angle;
    this.driftSlip = 0;
    this.pitch = 0;
    this.surfaceRoll = 0;
    if (this.mesh) {
      this.mesh.rotation.y = angle;
      this.mesh.rotation.x = 0;
      this.mesh.rotation.z = 0;
    }
  }

  resetToTrack(track) {
    if (!track) return;
    const progress = track.getProgress(this.position);
    const cp = track.checkpoints[progress.index];
    this.position.copy(cp.pos);
    const surface = track.getRoadSurfaceInfo(this.position.x, this.position.z, cp.pos.y);
    this.position.y = surface.y + this.wheelGroundOffset;
    this.speed = 0;
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.surfaceRoll = 0;
    this.setHeading(Math.atan2(-cp.tangent.x, -cp.tangent.z));
  }
}

window.Kart = Kart;
