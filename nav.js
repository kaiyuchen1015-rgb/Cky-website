/* Purple cursor glow + simple page navigation. */
(() => {
  const themeToggle = document.createElement('button');
  const themeStoreKey = 'vivi-site-theme';
  let theme = 'day';

  try {
    theme = localStorage.getItem(themeStoreKey) === 'night' ? 'night' : 'day';
  } catch (_) {}

  document.documentElement.dataset.theme = theme;
  themeToggle.type = 'button';
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-pressed', String(theme === 'night'));

  function updateThemeToggle() {
    const isNight = theme === 'night';
    themeToggle.setAttribute('aria-label', isNight ? 'Switch to day mode' : 'Switch to night mode');
    themeToggle.title = isNight ? 'Switch to day mode' : 'Switch to night mode';
    themeToggle.innerHTML = isNight
      ? '<svg viewBox="0 0 40 40" aria-hidden="true"><g class="sun-rays"><path d="M20 2v5M20 33v5M2 20h5M33 20h5M7.3 7.3l3.6 3.6m18.2 18.2 3.6 3.6m0-25.4-3.6 3.6m-18.2 18.2-3.6 3.6"/></g><circle class="sun-disc" cx="20" cy="20" r="10.5"/><circle class="sun-eye" cx="16.5" cy="18.5" r="1"/><circle class="sun-eye" cx="23.5" cy="18.5" r="1"/><path class="sun-smile" d="M16.5 22.5q3.5 4 7 0"/></svg>'
      : '<svg viewBox="0 0 40 40" aria-hidden="true"><path class="moon-disc" d="M27.8 27.1A15.3 15.3 0 0 1 13 8.2 15.5 15.5 0 1 0 31.8 27c-1.3.3-2.6.3-4-.1Z"/><circle class="moon-star" cx="29.5" cy="10.5" r="1.5"/><circle class="moon-star" cx="34" cy="17" r="1"/></svg>';
  }

  updateThemeToggle();
  document.querySelector('.nav-shell')?.appendChild(themeToggle);
  themeToggle.addEventListener('click', () => {
    theme = theme === 'night' ? 'day' : 'night';
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute('aria-pressed', String(theme === 'night'));
    updateThemeToggle();
    try {
      localStorage.setItem(themeStoreKey, theme);
    } catch (_) {}
  });
  const currentPage = (
    location.pathname.split('/').pop() || 'index.html'
  ).toLowerCase();

  document.querySelectorAll('.nav-links a').forEach((link) => {
    if ((link.getAttribute('href') || '').toLowerCase() === currentPage) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const menuButton = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';

      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute(
        'aria-label',
        open ? 'Close navigation' : 'Open navigation'
      );

      navLinks.classList.toggle('is-open', open);
    });

    navLinks.querySelectorAll('a').forEach((link) =>
      link.addEventListener('click', () => {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open navigation');
        navLinks.classList.remove('is-open');
      })
    );
  }

  // 鼠标效果：紫色光晕与柔和拖尾
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const canHover = window.matchMedia(
    '(hover: hover) and (pointer: fine)'
  ).matches;

  if (!canHover || reducedMotion) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'paint-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointer = null;
  let lastPoint = null;

  const trails = [];

  const PURPLE = '#8b72f5';

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();

  window.addEventListener('resize', resize, { passive: true });

  function addTrailPoint(x, y) {
    const now = performance.now();

    if (!lastPoint) {
      trails.push({
        x,
        y,
        born: now,
        life: 650,
        color: PURPLE,
        radius: 25
      });
    } else {
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(distance / 10));

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;

        trails.push({
          x: lastPoint.x + dx * t,
          y: lastPoint.y + dy * t,
          born: now,
          life: 620 + Math.random() * 230,
          color: PURPLE,
          radius: 19 + Math.random() * 11
        });
      }
    }

    lastPoint = { x, y };

    if (trails.length > 260) {
      trails.splice(0, trails.length - 260);
    }
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;

      pointer = {
        x: event.clientX,
        y: event.clientY
      };

      addTrailPoint(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerleave',
    () => {
      pointer = null;
      lastPoint = null;
    },
    { passive: true }
  );

  function rgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const value = parseInt(clean, 16);

    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function paint(now) {
    ctx.clearRect(0, 0, width, height);

    for (let i = trails.length - 1; i >= 0; i--) {
      const dot = trails[i];
      const age = now - dot.born;

      if (age >= dot.life) {
        trails.splice(i, 1);
        continue;
      }

      const fade = 1 - age / dot.life;

      //【修改 2】紫色拖尾稍微加重
      const alpha = 0.30 * fade;

      const radius = dot.radius * (0.72 + fade * 0.28);

      const gradient = ctx.createRadialGradient(
        dot.x,
        dot.y,
        0,
        dot.x,
        dot.y,
        radius
      );

      gradient.addColorStop(0, rgba(PURPLE, alpha));
      gradient.addColorStop(0.42, rgba(PURPLE, alpha * 0.55));
      gradient.addColorStop(1, rgba(PURPLE, 0));

      ctx.fillStyle = gradient;
      ctx.shadowColor = PURPLE;
      ctx.shadowBlur = 22;

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    if (pointer) {
      drawPointerGlow(pointer.x, pointer.y);
    }

    requestAnimationFrame(paint);
  }

  function drawPointerGlow(x, y) {
    const glow = ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      56
    );

    //【修改 3】只保留紫色，并稍微提高光晕强度
    glow.addColorStop(0, rgba(PURPLE, 0.24));
    glow.addColorStop(0.42, rgba(PURPLE, 0.12));
    glow.addColorStop(1, rgba(PURPLE, 0));

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 56, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(paint);
})();

// 【新增】Useless Machine：每次打开开关，金毛都会把它关闭
(() => {
  const machine = document.getElementById('useless-machine');
  const powerSwitch = document.getElementById('useless-switch');
  const state = document.getElementById('useless-state');
  const dog = document.getElementById('golden-retriever');

  // 不是首页时不执行
  if (!machine || !powerSwitch || !state || !dog) return;

  let reachTimer = null;
  let turnOffTimer = null;
  let retreatTimer = null;

  // 更新开关状态
  function setPower(isOn) {
    powerSwitch.setAttribute('aria-checked', String(isOn));
    powerSwitch.setAttribute(
      'aria-label',
      isOn
        ? 'Machine is on; the dog will turn it off'
        : 'Turn on the useless machine'
    );

    machine.classList.toggle('is-on', isOn);
    state.textContent = isOn ? 'ON' : 'OFF';
  }

  // 每次按下开关
  powerSwitch.addEventListener('click', () => {
    // 开关已经开启时，不允许手动关闭，让金毛来完成任务
    if (powerSwitch.getAttribute('aria-checked') === 'true') {
      return;
    }

    // 清理上一次动作的计时器
    clearTimeout(reachTimer);
    clearTimeout(turnOffTimer);
    clearTimeout(retreatTimer);

    // 【动作 1】开关打开
    setPower(true);

    // 如果金毛正在收回爪子，先让它重新准备动作
    dog.classList.remove('is-reaching');

    // 【动作 2】金毛伸出爪子
    reachTimer = setTimeout(() => {
      dog.classList.add('is-reaching');
    }, 100);

    // 【动作 3】金毛把开关关闭
    turnOffTimer = setTimeout(() => {
      setPower(false);

      // 关闭开关后，金毛再把爪子收回去
      retreatTimer = setTimeout(() => {
        dog.classList.remove('is-reaching');
      }, 250);
    }, 1050);
  });
})();