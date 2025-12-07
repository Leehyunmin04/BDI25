document.addEventListener('DOMContentLoaded', () => {
  const layer = document.querySelector('.fragment-layer');
  const baseText = document.querySelector('.base-text');

  const TEXT = 'jazz live house';

  const screenH = window.innerHeight;
  const centerY = 0;

  // BPM은 그대로 유지 – 박동 효과 유지
  const BPM = 96;
  const beatDur = 60 / BPM;

  // 파티클
  const MAX_PARTICLES = 550;
  const particles = [];

  // 마이크 입력 없음 (항상 0)
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
      h = 6 + Math.random() * 10; // 6~14%
      w = 0.7 + Math.random() * 1.5; // 0.7~1.9%
    } else if (r < 0.9) {
      // 중간 세로 조각
      h = 14 + Math.random() * 25; // 14~34%
      w = 0.9 + Math.random() * 1.9; // 0.9~2.4%
    } else {
      // 긴 기둥 느낌
      h = 30 + Math.random() * 49; // 30~70%
      w = 1 + Math.random() * 2; // 1~3%
    }

    const bottom = Math.max(0, 100 - top - h);
    const right = Math.max(0, 100 - left - w);
    fragment.style.clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%)`;

    layer.appendChild(fragment);

    return {
      el: fragment,
      y: centerY,
      direction,
      baseSpeed: 60 + Math.random() * 90,
      life: 1.7 + Math.random() * 1.7,
      age: 0,
      noiseSpeed: 0.4 + Math.random() * 0.9,
      noisePhase: Math.random() * 1000,
      noiseAmp: 40 + Math.random() * 80,
      alpha: 1,
    };
  }

  // 파티클 많이 생성하는 함수
  function emitParticles(strength) {
    const count = 38 + Math.round(strength * 20);
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

    // 음성 입력 없음 → 항상 0
    const audio = audioLevel * 0;

    // 박자 기반 우퍼 진동 유지
    const beatIndex = Math.floor(t / beatDur);
    const beatPos = t / beatDur - beatIndex;
    let beatEnv = Math.exp(-7 * beatPos);
    if (beatEnv < 0.02) beatEnv = 0;

    const drive = beatEnv * 0.8; // 전체 드라이브

    // ① 박자 시작 때 강하게 한 번씩 발사
    if (beatIndex !== lastBeatIndex) {
      lastBeatIndex = beatIndex;
      emitParticles(0.8); // “쿵” 할 때 많이
    }

    // ② 항상 조금씩은 나오는 기본 흐름 (ambient)
    //    파티클이 너무 적으면, 박자와 상관없이 살짝씩 계속 뿌리기
    if (particles.length < MAX_PARTICLES * 0.1) {
      emitParticles(0.25); // 약한 양이지만 프레임마다 누적 → 항상 조금씩 나옴
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

    // 파티클 업데이트
    const killDist = screenH / 2 + 300;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;

      const speedFactor = 0.4 + 1.6 * drive;
      p.y += p.baseSpeed * speedFactor * p.direction * dt;

      const n = noise1D(p.noisePhase + t * p.noiseSpeed);
      const wobble = (n - 0.5) * p.noiseAmp;

      const lifeRatio = Math.min(1, p.age / p.life);
      p.alpha = 1 - lifeRatio * 0.9;

      p.el.style.transform = `translateY(${p.y + wobble}px)`;
      p.el.style.opacity = p.alpha;

      if (Math.abs(p.y) > killDist || p.alpha <= 0.05) {
        p.el.remove();
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
