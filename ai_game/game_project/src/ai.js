// AI Rival Racers System for KartRider Web
// Features Multi-State Navigation, Distributed Racing Lines, Pre-Corner Speed Governance,
// Dynamic Lookahead, and Autonomous Wall Collision Recovery

class AIRival {
  constructor(scene, track, config) {
    this.name = config.name || 'Rival';
    this.charType = config.charType || 'tori';
    this.kart = new Kart(scene, false, this.charType);
    this.track = track;

    // Personality & Performance parameters
    this.skillLevel = config.skill || 0.90;
    this.baseSpeedFactor = config.speedFactor || 0.96;
    this.baseLaneOffset = config.laneOffset || 0;
    this.targetOffset = this.baseLaneOffset;

    // Dynamic Navigation & State Machine
    // States: 'NORMAL_RACING', 'FOLLOWING', 'AVOIDING', 'OVERTAKING', 'RECOVERING_FROM_COLLISION'
    this.state = 'NORMAL_RACING';
    this.boostCooldown = 4.0 + Math.random() * 5.0;

    // Wall Collision Recovery System
    this.stuckTimer = 0;
    this.recoveryPhase = 0; // 1: Reverse, 2: Accelerate to Center
    this.recoveryTimer = 0;
    this.lastPosition = new THREE.Vector3();

    // Lap progress tracking
    this.currentLap = 1;
    this.lastCheckpointIndex = 0;
    this.checkpointsPassed = 0;
    this.finished = false;
    this.finishTime = 0;

    this.initGridPosition(config.gridIndex || 1);
    this.lastPosition.copy(this.kart.position);
  }

  initGridPosition(gridIndex) {
    const row = Math.floor(gridIndex / 2) + 1;
    const side = (gridIndex % 2 === 0 ? 1 : -1);

    const startPt = this.track.curve.getPointAt(0);
    const startTangent = this.track.curve.getTangentAt(0).normalize();
    const normal = new THREE.Vector3(-startTangent.z, 0, startTangent.x);

    const pos = new THREE.Vector3().copy(startPt)
      .addScaledVector(startTangent, -row * 8.5)
      .addScaledVector(normal, side * 5.2);

    this.kart.position.copy(pos);
    const surface = this.track.getRoadSurfaceInfo(pos.x, pos.z, pos.y);
    this.kart.position.y = surface.y + this.kart.wheelGroundOffset;
    this.kart.setHeading(Math.atan2(-startTangent.x, -startTangent.z));
    this.kart.updateVisuals(0);
  }

  update(dt, allKarts) {
    if (this.finished) {
      this.kart.inputs.up = false;
      this.kart.inputs.down = true;
      this.kart.inputs.steerValue = 0;
      this.kart.update(dt, this.track);
      return;
    }

    this.drive(dt, allKarts);
    this.kart.update(dt, this.track);
    this.updateLapProgress();
  }

  drive(dt, allKarts) {
    const kart = this.kart;
    const progress = this.track.getProgress(kart.position);
    const cp = progress.cp || this.track.checkpoints[0];
    const tangent = cp.tangent;
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // 1. Calculate lateral distance from track centerline
    const offsetVec = new THREE.Vector3().subVectors(kart.position, cp.pos);
    offsetVec.y = 0;
    const lateralDist = offsetVec.dot(normal);
    const maxHalfWidth = (this.track.trackWidth * 0.5) - 1.4; // 10.6m
    const isNearWall = Math.abs(lateralDist) > (maxHalfWidth - 1.6);

    // 2. WALL COLLISION & STUCK RECOVERY SYSTEM
    if (this.state !== 'RECOVERING_FROM_COLLISION') {
      const distMoved = kart.position.distanceTo(this.lastPosition);
      if (isNearWall && Math.abs(kart.speed) < 6.0 && distMoved < 1.0) {
        this.stuckTimer += dt;
        if (this.stuckTimer > 0.8) {
          // ENTER RECOVERY STATE
          this.state = 'RECOVERING_FROM_COLLISION';
          this.recoveryPhase = 1;
          this.recoveryTimer = 0.9;
        }
      } else {
        this.stuckTimer = Math.max(0, this.stuckTimer - dt * 2.0);
      }
    }
    this.lastPosition.copy(kart.position);

    // If currently recovering from wall collision:
    if (this.state === 'RECOVERING_FROM_COLLISION') {
      if (this.recoveryPhase === 1) {
        // Phase 1: Reverse gear and steer away from wall
        kart.inputs.up = false;
        kart.inputs.down = true;
        kart.inputs.drift = false;
        kart.inputs.boost = false;

        // If stuck on left wall (lateralDist > 0), reverse steer left (+1.0) so rear swings left and front points right (towards center)
        const reverseSteer = (lateralDist > 0 ? 1.0 : -1.0);
        kart.inputs.steerValue = reverseSteer;
        kart.inputs.left = (reverseSteer > 0.1);
        kart.inputs.right = (reverseSteer < -0.1);

        this.recoveryTimer -= dt;
        if (this.recoveryTimer <= 0) {
          this.recoveryPhase = 2;
          this.recoveryTimer = 1.4;
        }
        return;
      } else if (this.recoveryPhase === 2) {
        // Phase 2: Forward acceleration towards track center checkpoint
        kart.inputs.down = false;
        kart.inputs.up = true;
        kart.inputs.drift = false;

        const targetU = (progress.u + 0.02) % 1.0;
        const targetPt = this.track.curve.getPointAt(targetU);
        const toTarget = new THREE.Vector3().subVectors(targetPt, kart.position);
        const desiredHeading = Math.atan2(-toTarget.x, -toTarget.z);
        let angleDiff = desiredHeading - kart.heading;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const steer = Math.max(-1.0, Math.min(1.0, angleDiff * 2.5));
        kart.inputs.steerValue = steer;
        kart.inputs.left = (steer > 0.08);
        kart.inputs.right = (steer < -0.08);

        this.recoveryTimer -= dt;
        if (Math.abs(lateralDist) < 6.0 || this.recoveryTimer <= 0) {
          this.state = 'NORMAL_RACING';
          this.stuckTimer = 0;
        }
        return;
      }
    }

    // 3. CURVATURE PRE-DETECTION & DYNAMIC LOOKAHEAD
    // Sample upcoming tangent horizontally (X, Z plane) to detect corners ahead of time (ignoring hill grade)
    const lookaheadSampleU = (progress.u + 0.025) % 1.0;
    const futureTangent = this.track.curve.getTangentAt(lookaheadSampleU).normalize();
    const t1 = new THREE.Vector2(tangent.x, tangent.z).normalize();
    const t2 = new THREE.Vector2(futureTangent.x, futureTangent.z).normalize();
    const curvatureAngle = Math.acos(Math.max(-1, Math.min(1, t1.dot(t2))));
    const isUpcomingSharpCorner = (curvatureAngle > 0.12);

    // Dynamic Lookahead Distance (Shorter on sharp corners to avoid cutting through walls!)
    const lookAheadDist = isUpcomingSharpCorner ? 18.0 : 42.0;
    const lookAheadU = lookAheadDist / this.track.totalLength;
    const targetU = (progress.u + lookAheadU) % 1.0;
    const targetPt = this.track.curve.getPointAt(targetU);
    const targetTangent = this.track.curve.getTangentAt(targetU).normalize();
    const targetNormal = new THREE.Vector3(-targetTangent.z, 0, targetTangent.x).normalize();

    // 4. DISTRIBUTED RACING LINES WITH INNER-WALL SAFETY MARGIN
    // On sharp hairpins, clamp lane offset closer to center to guarantee >= 4.2m wall clearance
    const maxSafeOffset = isUpcomingSharpCorner ? 1.4 : 3.6;
    let desiredOffset = Math.max(-maxSafeOffset, Math.min(maxSafeOffset, this.baseLaneOffset));

    // 5. INTER-VEHICLE COLLISION AVOIDANCE & FOLLOWING STATE
    let leaderAhead = null;
    let minLeaderDist = 13.0;

    allKarts.forEach(other => {
      if (other === kart) return;
      const toOther = new THREE.Vector3().subVectors(other.position, kart.position);
      toOther.y = 0;

      // Projection along kart heading
      const forwardDist = -toOther.x * Math.sin(kart.heading) - toOther.z * Math.cos(kart.heading);
      const sideDist = toOther.x * Math.cos(kart.heading) - toOther.z * Math.sin(kart.heading);

      if (forwardDist > 0.5 && forwardDist < minLeaderDist && Math.abs(sideDist) < 3.8) {
        minLeaderDist = forwardDist;
        leaderAhead = { kart: other, fwd: forwardDist, side: sideDist };
      }
    });

    if (leaderAhead) {
      if (isUpcomingSharpCorner) {
        // Sharp curve: follow leader safely, do not dive into inner wall
        this.state = 'FOLLOWING';
      } else {
        // Straightaway: change lane to overtake
        this.state = 'OVERTAKING';
        const overtakeDir = (leaderAhead.side >= 0 ? -1 : 1);
        desiredOffset = Math.max(-maxSafeOffset, Math.min(maxSafeOffset, desiredOffset + overtakeDir * 2.8));
      }
    } else {
      this.state = 'NORMAL_RACING';
    }

    this.targetOffset = THREE.MathUtils.lerp(this.targetOffset, desiredOffset, dt * 4.0);
    targetPt.addScaledVector(targetNormal, this.targetOffset);

    // 6. PROPORTIONAL STEERING
    const toTarget = new THREE.Vector3().subVectors(targetPt, kart.position);
    const desiredHeading = Math.atan2(-toTarget.x, -toTarget.z);

    let angleDiff = desiredHeading - kart.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const steerProportional = Math.max(-1.0, Math.min(1.0, angleDiff * 2.2));
    kart.inputs.steerValue = steerProportional;
    kart.inputs.left = (steerProportional > 0.08);
    kart.inputs.right = (steerProportional < -0.08);

    // 7. PRE-CORNER SPEED GOVERNANCE & DRIFT
    const isDriftingCorner = isUpcomingSharpCorner && Math.abs(angleDiff) > 0.28 && kart.speed > 22.0;
    kart.inputs.drift = isDriftingCorner;

    let targetSpeed = kart.baseMaxSpeed * this.baseSpeedFactor;
    if (isUpcomingSharpCorner) {
      // Governed cornering entry speed
      targetSpeed = 30.0 * this.skillLevel;
    }
    if (this.state === 'FOLLOWING' && leaderAhead) {
      targetSpeed = Math.min(targetSpeed, Math.max(12.0, leaderAhead.kart.speed * 0.95));
    }

    if (kart.speed < targetSpeed) {
      kart.inputs.up = true;
      kart.inputs.down = false;
    } else if (kart.speed > targetSpeed + 5.0) {
      // Active braking before sharp corner entry
      kart.inputs.up = false;
      kart.inputs.down = true;
    } else {
      kart.inputs.up = false;
      kart.inputs.down = false;
    }

    // 8. BOOSTER USAGE (Only on straightaways when well aligned!)
    this.boostCooldown -= dt;
    if (this.boostCooldown <= 0) {
      if (kart.boosters > 0 && !isUpcomingSharpCorner && Math.abs(angleDiff) < 0.12) {
        kart.inputs.boost = true;
        this.boostCooldown = 6.0 + Math.random() * 6.0;
      }
    }
  }

  updateLapProgress() {
    const progress = this.track.getProgress(this.kart.position);
    const cpIndex = progress.index;
    const totalCP = this.track.checkpoints.length;

    const diff = (cpIndex - this.lastCheckpointIndex + totalCP) % totalCP;
    if (diff > 0 && diff <= 6) {
      this.checkpointsPassed += diff;
      this.lastCheckpointIndex = cpIndex;

      if (cpIndex === 0 && this.checkpointsPassed > totalCP * 0.75) {
        this.currentLap++;
        this.checkpointsPassed = 0;
        if (this.currentLap > 3) {
          this.finished = true;
        }
      }
    }
  }

  getTotalDistance() {
    return (this.currentLap - 1) * this.track.totalLength +
      (this.checkpointsPassed / this.track.checkpoints.length) * this.track.totalLength;
  }
}

window.AIRival = AIRival;
