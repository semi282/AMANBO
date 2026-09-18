// Main Game Controller for KartRider Web
// Features 4 SD Characters, Village Canal Circuit, and Robust Countdown

class KartRiderGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('bg-canvas');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.state = 'MENU';
    this.selectedChar = 'leo';

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Game Entities
    this.track = null;
    this.player = null;
    this.aiRivals = [];
    this.allKarts = [];

    // Progress
    this.totalLaps = 3;
    this.playerLap = 1;
    this.playerCheckpointsPassed = 0;
    this.playerLastCheckpointIndex = 0;
    this.raceStartTime = 0;
    this.lapStartTime = 0;
    this.lapTimes = [];
    this.bestLapTime = Infinity;
    this.maxSpeedRecorded = 0;
    this.currentRank = 1;

    // UI Cache
    this.ui = {
      hud: document.getElementById('hud'),
      rankNum: document.getElementById('rank-num'),
      rankSuffix: document.getElementById('rank-suffix'),
      currentLap: document.getElementById('current-lap'),
      totalLaps: document.getElementById('total-laps'),
      lapTimer: document.getElementById('lap-timer'),
      speedVal: document.getElementById('speed-value'),
      speedFill: document.getElementById('speed-meter-fill'),
      boostGaugeFill: document.getElementById('boost-gauge-fill'),
      gaugePercent: document.getElementById('gauge-percent'),
      slot0: document.getElementById('slot-0'),
      slot1: document.getElementById('slot-1'),
      speedLines: document.getElementById('speed-lines'),
      boostOverlay: document.getElementById('boost-overlay'),
      countdownOverlay: document.getElementById('countdown-overlay'),
      countdownNumber: document.getElementById('countdown-number'),
      startScreen: document.getElementById('start-screen'),
      finishScreen: document.getElementById('finish-screen'),
      alertBanner: document.getElementById('alert-banner'),
      alertText: document.getElementById('alert-text'),
      btnStart: document.getElementById('btn-start'),
      btnRestart: document.getElementById('btn-restart'),
      statTotal: document.getElementById('stat-total-time'),
      statBest: document.getElementById('stat-best-lap'),
      statMaxSpeed: document.getElementById('stat-max-speed'),
      finalRankBadge: document.getElementById('final-rank-badge'),
      finalRankText: document.getElementById('final-rank-text'),
      charCards: document.querySelectorAll('.char-card'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      soundIcon: document.getElementById('sound-icon'),
      soundLabel: document.getElementById('sound-label'),
    };

    this.initThree();
    this.initWorld();
    this.initInputs();
    this.initUIListeners();

    requestAnimationFrame(this.animate.bind(this));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x82c8f0);
    this.scene.fog = new THREE.FogExp2(0x9bd7f5, 0.0025);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Initial camera position sitting directly behind player at start line looking East (+X, down the road)
    this.camera.position.set(40, 4.0, -160);
    this.camera.lookAt(70, 1.2, -160);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.70);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xcce7ff, 0x557733, 0.55);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.25);
    sunLight.position.set(120, 220, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 650;
    const d = 260;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initWorld() {
    // 1. High-Quality Village Canal Track (Drift Aesthetic)
    this.track = new Track(this.scene);

    // 2. Setup Racers with Selected Character
    this.setupRacers(this.selectedChar);
  }

  setupRacers(playerChar) {
    if (this.player && this.player.mesh) this.scene.remove(this.player.mesh);
    this.aiRivals.forEach(ai => {
      if (ai.kart && ai.kart.mesh) this.scene.remove(ai.kart.mesh);
    });

    const allChars = ['leo', 'tori', 'luna', 'kai'];
    const aiChars = allChars.filter(c => c !== playerChar);

    // Player positioned on North Straight facing East (+X, towards Fingers)
    this.player = new Kart(this.scene, true, playerChar);
    this.player.position.set(50, 0.0, -160);
    const surface = this.track.getRoadSurfaceInfo(50, -160, 0);
    this.player.position.y = surface.y + this.player.wheelGroundOffset;
    this.player.setHeading(-Math.PI / 2); // Facing East (+X)
    this.player.updateVisuals(0);

    // 3 AI Rivals staggered behind start line with distributed racing lines
    const rivalConfigs = [
      { name: aiChars[0].toUpperCase(), charType: aiChars[0], skill: 0.95, speedFactor: 0.98, laneOffset: 0, gridIndex: 2 },
      { name: aiChars[1].toUpperCase(), charType: aiChars[1], skill: 0.91, speedFactor: 0.95, laneOffset: -3.2, gridIndex: 3 },
      { name: aiChars[2].toUpperCase(), charType: aiChars[2], skill: 0.88, speedFactor: 0.93, laneOffset: 3.2, gridIndex: 4 }
    ];

    this.aiRivals = rivalConfigs.map(cfg => new AIRival(this.scene, this.track, cfg));
    this.allKarts = [this.player, ...this.aiRivals.map(r => r.kart)];

    this.alignCameraBehindPlayer();
  }

  alignCameraBehindPlayer() {
    const pPos = this.player.position;
    const heading = this.player.heading;
    const baseDist = 8.5;
    const baseHeight = 3.6;

    const behind = new THREE.Vector3(
      Math.sin(heading) * baseDist,
      baseHeight,
      Math.cos(heading) * baseDist
    );
    this.camera.position.copy(pPos).add(behind);

    const lookTarget = new THREE.Vector3().copy(pPos).add(new THREE.Vector3(
      -Math.sin(heading) * 8,
      1.2,
      -Math.cos(heading) * 8
    ));
    this.camera.lookAt(lookTarget);
  }

  initInputs() {
    // One-time gesture listener to unlock browser audio & autoplay BGM seamlessly
    const unlockAudio = () => {
      if (window.soundSystem) {
        window.soundSystem.init();
        window.soundSystem.playBGM();
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    window.addEventListener('keydown', (e) => {
      const code = e.code;

      // M Key: Sound / BGM Mute Toggle
      if (code === 'KeyM') {
        this.toggleSound();
        return;
      }

      if (this.state === 'MENU' && (code === 'Space' || code === 'Enter')) {
        if (window.soundSystem) {
          window.soundSystem.init();
          window.soundSystem.playBGM();
        }
        this.startCountdown();
        return;
      }

      if (this.state === 'RACING') {
        if (code === 'KeyW' || code === 'ArrowUp') this.player.inputs.up = true;
        if (code === 'KeyS' || code === 'ArrowDown') this.player.inputs.down = true;
        if (code === 'KeyA' || code === 'ArrowLeft') this.player.inputs.left = true;
        if (code === 'KeyD' || code === 'ArrowRight') this.player.inputs.right = true;
        if (code === 'ShiftLeft' || code === 'ShiftRight') this.player.inputs.drift = true;
        if (code === 'ControlLeft' || code === 'ControlRight' || code === 'Space') {
          this.player.inputs.boost = true;
        }
        if (code === 'KeyR') {
          this.player.resetToTrack(this.track);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.player.inputs.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.player.inputs.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.player.inputs.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.player.inputs.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.player.inputs.drift = false;
      if (code === 'ControlLeft' || code === 'ControlRight' || code === 'Space') {
        this.player.inputs.boost = false;
      }
    });

    // Touch Controls
    const bindTouch = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.player.inputs[key] = true;
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.player.inputs[key] = false;
      });
      btn.addEventListener('mousedown', () => { this.player.inputs[key] = true; });
      btn.addEventListener('mouseup', () => { this.player.inputs[key] = false; });
      btn.addEventListener('mouseleave', () => { this.player.inputs[key] = false; });
    };

    bindTouch('btn-up', 'up');
    bindTouch('btn-down', 'down');
    bindTouch('btn-left', 'left');
    bindTouch('btn-right', 'right');
    bindTouch('btn-drift', 'drift');
    bindTouch('btn-boost', 'boost');
  }

  toggleSound() {
    if (!window.soundSystem) return;
    const isMuted = window.soundSystem.toggleMute();
    if (this.ui.btnSoundToggle) {
      if (isMuted) {
        this.ui.btnSoundToggle.classList.add('muted');
        if (this.ui.soundIcon) this.ui.soundIcon.textContent = '🔇';
        if (this.ui.soundLabel) this.ui.soundLabel.textContent = 'MUTE';
      } else {
        this.ui.btnSoundToggle.classList.remove('muted');
        if (this.ui.soundIcon) this.ui.soundIcon.textContent = '🔊';
        if (this.ui.soundLabel) this.ui.soundLabel.textContent = 'BGM ON';
      }
    }
  }

  initUIListeners() {
    if (this.ui.btnSoundToggle) {
      this.ui.btnSoundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSound();
      });
    }

    this.ui.charCards.forEach(card => {
      card.addEventListener('click', () => {
        if (window.soundSystem) {
          window.soundSystem.init();
          window.soundSystem.playBGM();
        }
        this.ui.charCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const charId = card.getAttribute('data-char');
        this.selectedChar = charId;
        this.setupRacers(this.selectedChar);
      });
    });

    this.ui.btnStart.addEventListener('click', () => {
      if (window.soundSystem) {
        window.soundSystem.init();
        window.soundSystem.playBGM();
      }
      this.startCountdown();
    });

    this.ui.btnRestart.addEventListener('click', () => {
      if (window.soundSystem) {
        window.soundSystem.playBGM();
      }
      this.resetRace();
      this.startCountdown();
    });
  }

  startCountdown() {
    if (this.state === 'COUNTDOWN' || this.state === 'RACING') return;
    this.state = 'COUNTDOWN';

    this.ui.startScreen.classList.add('hidden');
    this.ui.finishScreen.classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
    this.ui.countdownOverlay.classList.remove('hidden');

    this.alignCameraBehindPlayer();

    const steps = [
      { label: '3', cls: 'count-3', isGo: false },
      { label: '2', cls: 'count-2', isGo: false },
      { label: '1', cls: 'count-1', isGo: false },
      { label: 'GO!', cls: 'count-go', isGo: true },
    ];

    let stepIndex = 0;

    const showStep = () => {
      if (stepIndex >= steps.length) {
        this.ui.countdownOverlay.classList.add('hidden');
        return;
      }

      const step = steps[stepIndex];
      const el = this.ui.countdownNumber;

      // Update text and force DOM reflow so each count pops visibly!
      el.textContent = step.label;
      el.className = `countdown-number ${step.cls}`;
      void el.offsetWidth; // Force CSS reflow
      el.classList.add('count-pop');

      try {
        if (window.soundSystem) {
          window.soundSystem.playCountdown(step.isGo);
        }
      } catch (err) {
        console.warn('Audio play error:', err);
      }

      if (step.isGo) {
        this.state = 'RACING';
        this.raceStartTime = performance.now();
        this.lapStartTime = performance.now();
        setTimeout(() => {
          this.ui.countdownOverlay.classList.add('hidden');
        }, 900);
      } else {
        stepIndex++;
        setTimeout(showStep, 1000);
      }
    };

    showStep();
  }

  resetRace() {
    this.playerLap = 1;
    this.playerCheckpointsPassed = 0;
    this.playerLastCheckpointIndex = 0;
    this.lapTimes = [];
    this.bestLapTime = Infinity;
    this.maxSpeedRecorded = 0;

    // Reset Player facing East (+X, towards Fingers)
    this.player.position.set(50, 0.0, -160);
    const surface = this.track.getRoadSurfaceInfo(50, -160, 0);
    this.player.position.y = surface.y + this.player.wheelGroundOffset;
    this.player.speed = 0;
    this.player.velocity.set(0, 0, 0);
    this.player.setHeading(-Math.PI / 2);
    this.player.boostGauge = 0;
    this.player.boosters = 0;
    this.player.isBoosting = false;

    // Reset AI
    this.aiRivals.forEach((r, idx) => {
      r.currentLap = 1;
      r.checkpointsPassed = 0;
      r.lastCheckpointIndex = 0;
      r.finished = false;
      r.kart.speed = 0;
      r.kart.boosters = 0;
      r.initGridPosition(idx + 2);
    });

    this.alignCameraBehindPlayer();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const dt = Math.min(this.clock.getDelta(), 0.1);

    this.track.update(dt);

    if (this.state === 'RACING') {
      this.player.update(dt, this.track);
      this.aiRivals.forEach(ai => ai.update(dt, this.allKarts));

      // Mutual physical push separation between karts (prevents clustering and overlap)
      const nKarts = this.allKarts.length;
      for (let i = 0; i < nKarts; i++) {
        for (let j = i + 1; j < nKarts; j++) {
          const k1 = this.allKarts[i];
          const k2 = this.allKarts[j];
          const dist = k1.position.distanceTo(k2.position);
          const minDist = 2.8;
          if (dist < minDist && dist > 0.01) {
            const overlap = (minDist - dist) * 0.5;
            const push = new THREE.Vector3().subVectors(k1.position, k2.position).normalize();
            push.y = 0;
            k1.position.addScaledVector(push, overlap);
            k2.position.addScaledVector(push, -overlap);
          }
        }
      }

      this.updateRaceLogic();

      if (window.soundSystem) {
        const speedRatio = Math.abs(this.player.speed) / this.player.baseMaxSpeed;
        window.soundSystem.updateEngine(speedRatio, this.player.inputs.up);
      }
    } else if (this.state === 'COUNTDOWN' || this.state === 'MENU') {
      if (window.soundSystem) {
        window.soundSystem.updateEngine(0.08, false);
      }
    }

    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.state === 'RACING' || this.state === 'COUNTDOWN') {
      this.drawMinimap();
      this.updateHUD();
    }
  }

  updateCamera(dt) {
    const pPos = this.player.position;
    const heading = this.player.chassisAngle;

    const isBoosting = this.player.isBoosting || this.player.dashBoostRemaining > 0;
    const baseDist = isBoosting ? 9.8 : 8.2;
    const baseHeight = isBoosting ? 3.4 : 3.8;

    const behind = new THREE.Vector3(
      Math.sin(heading) * baseDist,
      baseHeight,
      Math.cos(heading) * baseDist
    );
    const targetCamPos = new THREE.Vector3().copy(pPos).add(behind);

    this.camera.position.lerp(targetCamPos, dt * 8.5);

    const lookTarget = new THREE.Vector3().copy(pPos).add(new THREE.Vector3(
      -Math.sin(heading) * 6,
      1.2,
      -Math.cos(heading) * 6
    ));
    this.camera.lookAt(lookTarget);

    const targetFOV = isBoosting ? 78 : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 5);
    this.camera.updateProjectionMatrix();
  }

  updateRaceLogic() {
    const progress = this.track.getProgress(this.player.position);
    const cpIndex = progress.index;
    const totalCP = this.track.checkpoints.length;

    const diff = (cpIndex - this.playerLastCheckpointIndex + totalCP) % totalCP;
    if (diff > 0 && diff <= 6) {
      this.playerCheckpointsPassed += diff;
      this.playerLastCheckpointIndex = cpIndex;

      if (cpIndex === 0 && this.playerCheckpointsPassed > totalCP * 0.75) {
        const now = performance.now();
        const lapTime = (now - this.lapStartTime) / 1000;
        this.lapTimes.push(lapTime);
        if (lapTime < this.bestLapTime) this.bestLapTime = lapTime;
        this.lapStartTime = now;

        this.playerLap++;
        this.playerCheckpointsPassed = 0;

        if (this.playerLap > this.totalLaps) {
          this.finishRace();
        } else {
          this.showAlert(`LAP ${this.playerLap}!`);
        }
      }
    }

    const playerTotalDist = (this.playerLap - 1) * this.track.totalLength +
      (this.playerCheckpointsPassed / totalCP) * this.track.totalLength;

    let rank = 1;
    this.aiRivals.forEach(ai => {
      if (ai.getTotalDistance() > playerTotalDist) {
        rank++;
      }
    });
    this.currentRank = rank;

    const kmh = Math.round(Math.abs(this.player.speed) * 3.0);
    if (kmh > this.maxSpeedRecorded) this.maxSpeedRecorded = kmh;
  }

  finishRace() {
    this.state = 'FINISHED';
    const totalTime = (performance.now() - this.raceStartTime) / 1000;

    if (window.soundSystem) {
      window.soundSystem.setDriftVolume(0);
      window.soundSystem.updateEngine(0, false);
      window.soundSystem.playFinishFanfare();
    }

    this.ui.finishScreen.classList.remove('hidden');
    this.ui.finalRankBadge.textContent = `${this.currentRank}${this.getSuffix(this.currentRank)}`;
    this.ui.finalRankText.textContent = (this.currentRank === 1) ? '🎉 우승을 차지했습니다! (1위)' : `${this.currentRank}위로 완주했습니다!`;
    this.ui.statTotal.textContent = this.formatTime(totalTime);
    this.ui.statBest.textContent = this.formatTime(this.bestLapTime === Infinity ? totalTime : this.bestLapTime);
    this.ui.statMaxSpeed.textContent = `${this.maxSpeedRecorded} km/h`;
  }

  updateHUD() {
    const kmh = Math.round(Math.abs(this.player.speed) * 3.0);
    this.ui.speedVal.textContent = kmh;

    const speedRatio = Math.min(kmh / 230, 1.0);
    const offset = 364 - (speedRatio * 270);
    this.ui.speedFill.style.strokeDashoffset = offset;

    const pct = Math.round(this.player.boostGauge);
    this.ui.boostGaugeFill.style.width = `${pct}%`;
    this.ui.gaugePercent.textContent = `${pct}%`;

    const boosters = this.player.boosters;
    this.ui.slot0.className = `slot ${boosters >= 1 ? 'ready' : 'empty'}`;
    this.ui.slot1.className = `slot ${boosters >= 2 ? 'ready' : 'empty'}`;

    this.ui.rankNum.textContent = this.currentRank;
    this.ui.rankSuffix.textContent = this.getSuffix(this.currentRank);
    this.ui.currentLap.textContent = Math.min(this.playerLap, this.totalLaps);

    if (this.state === 'RACING') {
      const elapsed = (performance.now() - this.lapStartTime) / 1000;
      this.ui.lapTimer.textContent = this.formatTime(elapsed);
    }

    const isBoosting = this.player.isBoosting || this.player.dashBoostRemaining > 0;
    if (isBoosting) {
      this.ui.speedLines.classList.remove('hidden');
      this.ui.boostOverlay.classList.remove('hidden');
    } else {
      this.ui.speedLines.classList.add('hidden');
      this.ui.boostOverlay.classList.add('hidden');
    }
  }

  showAlert(text) {
    this.ui.alertText.textContent = text;
    this.ui.alertBanner.classList.remove('hidden');
    setTimeout(() => {
      this.ui.alertBanner.classList.add('hidden');
    }, 1200);
  }

  drawMinimap() {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Village Fingers Track Bounds: X in [-230, 240], Z in [-185, 235]
    const minX = -230, maxX = 240;
    const minZ = -185, maxZ = 235;

    const toMapX = (x) => ((x - minX) / (maxX - minX)) * (w - 24) + 12;
    const toMapY = (z) => ((z - minZ) / (maxZ - minZ)) * (h - 24) + 12;

    // Roundabout Green Island
    const rbx = toMapX(-130);
    const rby = toMapY(175);
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.arc(rbx, rby, 7, 0, Math.PI * 2);
    ctx.fill();

    // Track Road Ribbon (Black with white border)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const pt = this.track.curve.getPointAt(i / 80);
      const mx = toMapX(pt.x);
      const my = toMapY(pt.z);
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#111317';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Center Guide Line (Yellow)
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Clock Tower Indicator (Red box)
    ctx.fillStyle = '#e53935';
    ctx.fillRect(toMapX(-115) - 3, toMapY(-160) - 3, 6, 6);

    // Speed Bump Indicator (Blue box)
    ctx.fillStyle = '#1e88e5';
    ctx.fillRect(toMapX(-20) - 3, toMapY(-160) - 3, 6, 6);

    // Purple Gate Indicator
    ctx.fillStyle = '#9c27b0';
    ctx.fillRect(toMapX(90) - 3, toMapY(0) - 3, 6, 6);

    // Start Line (Yellow/White Dash)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(toMapX(50) - 1, toMapY(-160) - 5, 2, 10);

    // AI Karts (Red Dots)
    this.aiRivals.forEach(ai => {
      const mx = toMapX(ai.kart.position.x);
      const my = toMapY(ai.kart.position.z);
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player Kart (Cyan Glowing Arrow)
    const px = toMapX(this.player.position.x);
    const py = toMapY(this.player.position.z);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.player.chassisAngle);

    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  getSuffix(num) {
    if (num === 1) return 'ST';
    if (num === 2) return 'ND';
    if (num === 3) return 'RD';
    return 'TH';
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new KartRiderGame();
});
