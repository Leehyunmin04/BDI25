document.addEventListener('DOMContentLoaded', () => {
  const layer = document.querySelector('.fragment-layer');
  const baseText = document.querySelector('.base-text');

  const TEXT = 'jazz live house';

  const screenH = window.innerHeight;
  const centerY = 0;

  // 🔹 박자 조금 느리게 (기존 96 → 80)
  const BPM = 70;
  const beatDur = 60 / BPM;

  // 파티클
  const MAX_PARTICLES = 500;
  const particles = [];

  // 마이크 입력 없음
  let audioLevel = 0;

  // -------- 1D Noise --------
  function hash(n) {
    const x = Math.sin(n * 43758.5453123) * 43758.5453123;
    return x - Math.floor(x);
  }
  function noise1D(x) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return (1 - u) * hash(i) + u * hash(i + 1);
  }

  // -------- 파티클 생성 --------
  function createParticle(direction) {
    const fragment = document.createElement('div');
    fragment.className = 'fragment';
    const span = document.createElement('span');
    span.textContent = TEXT;
    fragment.appendChild(span);

    const top = Math.random() * 100;
    const left = Math.random() * 100;

    const r = Math.random();
    let h, w;

    if (r < 0.6) {
      // 작은 세로 조각
      h = 6 + Math.random() * 10;
      w = 0.7 + Math.random() * 1.5;
    } else if (r < 0.9) {
      // 중간 세로 조각
      h = 14 + Math.random() * 25;
      w = 0.9 + Math.random() * 1.9;
    } else {
      // 긴 기둥 느낌
      h = 30 + Math.random() * 49;
      w = 1 + Math.random() * 2;
    }

    const bottom = Math.max(0, 100 - top - h);
    const right = Math.max(0, 100 - left - w);
    fragment.style.clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%)`;

    layer.appendChild(fragment);

    return {
      el: fragment,
      y: centerY,
      direction,
      // 🔹 기본 낙하 속도 줄이기 (기존 60 + rand*90 → 30 + rand*60)
      baseSpeed: 30 + Math.random() * 60,
      life: 1.5 + Math.random() * 1.5,
      age: 0,
      noiseSpeed: 0.4 + Math.random() * 0.9,
      noisePhase: Math.random() * 1000,
      noiseAmp: 40 + Math.random() * 80,
      alpha: 1,
    };
  }

  // 파티클 많이 생성하는 함수
  function emitParticles(strength) {
    const count = 32 + Math.round(strength * 20);
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      const dir = Math.random() < 0.5 ? -1 : 1;
      particles.push(createParticle(dir));
    }
  }

  // -------- 애니메이션 루프 --------
  const start = performance.now();
  let lastTime = start;
  let lastBeatIndex = -1;

  function animate(now) {
    const t = (now - start) / 1000;
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const audio = audioLevel * 0;

    // 박자 기반 우퍼 진동
    const beatIndex = Math.floor(t / beatDur);
    const beatPos = t / beatDur - beatIndex;
    let beatEnv = Math.exp(-7 * beatPos);
    if (beatEnv < 0.02) beatEnv = 0;

    const drive = beatEnv * 0.8;

    // ① 박자 시작 때 강하게 한 번씩 발사
    if (beatIndex !== lastBeatIndex) {
      lastBeatIndex = beatIndex;
      emitParticles(0.8);
    }

    // ② 항상 조금씩은 나오는 기본 흐름
    if (particles.length < MAX_PARTICLES * 0.1) {
      emitParticles(0.25);
    }

    // 중앙 텍스트 우퍼 모션
    const textScale = 1 + drive * 0.25;
    const textY = -drive * 10;
    const shadowLen = drive * 30;

    baseText.style.transform = `translate(-50%, -50%) translateY(${textY}px) scale(${textScale})`;
    baseText.style.textShadow = `
      0 ${shadowLen * 0.2}px 0 rgba(0,0,0,0.35),
      0 ${shadowLen * 0.6}px 0 rgba(0,0,0,0.18),
      0 ${shadowLen}px 0 rgba(0,0,0,0.06)
    `;

    const killDist = screenH / 2 + 300;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;

      // 🔹 전체 속도 계수도 조금 낮춤 (기존 0.4 + 1.6*drive → 0.3 + 1.2*drive)
      const speedFactor = 0.3 + 1.2 * drive;
      p.y += p.baseSpeed * speedFactor * p.direction * dt;

      const n = noise1D(p.noisePhase + t * p.noiseSpeed);
      const wobble = (n - 0.5) * p.noiseAmp;

      const lifeRatio = Math.min(1, p.age / p.life);
      // 🔹 덜 투명해지게 (기존 0.9 → 0.4)
      p.alpha = 1 - lifeRatio * 0.4;

      p.el.style.transform = `translateY(${p.y + wobble}px)`;
      p.el.style.opacity = p.alpha;

      // 🔹 너무 안 보일 때만 제거 (기존 0.05 → 0.2)
      if (Math.abs(p.y) > killDist || p.alpha <= 0.2) {
        p.el.remove();
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
