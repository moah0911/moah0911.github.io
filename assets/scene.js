/* Rendered horizon.
 *
 * One full-screen pass: a graded sky, a sea that holds a single reflected
 * star, and film grain over both. Luminance is computed first and mapped to a
 * warm day palette or a cold night palette at the end, so the whole scene
 * changes light without changing geometry.
 *
 * The reflected star is deliberately not a physical mirror of the header mark:
 * like a printed colophon, it is the same shape placed where the composition
 * needs it. Waves break it into a glitter path.
 */

(function () {
  'use strict';

  var VERTEX = [
    'attribute vec2 a_pos;',
    'void main() {',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAGMENT = [
    'precision highp float;',
    '',
    'uniform vec2  u_res;',
    'uniform float u_time;',
    'uniform float u_night;',
    'uniform float u_horizon;',
    'uniform float u_starPx;',
    'uniform float u_lowQuality;',
    '',
    'const vec3 DAY_DARK    = vec3(0.226, 0.222, 0.212);',
    'const vec3 DAY_LIGHT   = vec3(0.988, 0.982, 0.968);',
    'const vec3 NIGHT_DARK  = vec3(0.038, 0.043, 0.056);',
    'const vec3 NIGHT_LIGHT = vec3(0.930, 0.940, 0.956);',
    '',
    'float hash21(vec2 p) {',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float vnoise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  float a = hash21(i);',
    '  float b = hash21(i + vec2(1.0, 0.0));',
    '  float c = hash21(i + vec2(0.0, 1.0));',
    '  float d = hash21(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
    '}',
    '',
    '/* Four-point sparkle, unit radius. Negative inside. */',
    'float sparkleField(vec2 q) {',
    '  q.x *= 1.55;',
    '  float a = atan(q.x, q.y);',
    '  float r = length(q);',
    '  float env = pow(abs(cos(2.0 * a)), 2.7);',
    '  float arms = mix(0.60, 1.0, pow(abs(cos(a)), 3.0));',
    '  return r - env * arms;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_res;',
    '  float aspect = u_res.x / u_res.y;',
    '  float px = 1.0 / u_res.y;',
    '  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y);',
    '  float h = u_horizon;',
    '  float night = u_night;',
    '',
    '  float water = 1.0 - smoothstep(-px, px, uv.y - h);',
    '  float above = clamp((uv.y - h) / max(1.0 - h, 0.001), 0.0, 1.0);',
    '  float depth = clamp((h - uv.y) / max(h, 0.001), 0.0, 1.0);',
    '',
    '  /* ---- sky ---------------------------------------------------------- */',
    '  float daySky   = mix(0.900, 0.986, pow(above, 0.55));',
    '  daySky += (1.0 - smoothstep(0.0, 0.22, above)) * 0.028;',
    '  float nightSky = mix(0.200, 0.048, pow(above, 0.50));',
    '  nightSky += (1.0 - smoothstep(0.0, 0.06, above)) * 0.055;',
    '',
    '  /* ---- sea ---------------------------------------------------------- */',
    '  float bandFreq = mix(120.0, 34.0, u_lowQuality);',
    '  float swell = sin(depth * bandFreq - u_time * 0.55',
    '                    + vnoise(vec2(p.x * 3.0, depth * 9.0)) * 2.4);',
    '  float rip = swell * smoothstep(0.01, 0.26, depth);',
    '',
    '  /* Thin horizontal glints: wide in x, narrow in y. This is the single',
    '     strongest cue that the lower half is a surface and not a gradient. */',
    '  float streakField = vnoise(vec2(p.x * 9.0, depth * 92.0 - u_time * 0.42));',
    '  float streaks = smoothstep(0.80, 1.0, streakField) * smoothstep(0.0, 0.18, depth);',
    '',
    '  float daySea   = mix(0.868, 0.572, pow(depth, 0.82)) + rip * 0.013 + streaks * 0.026;',
    '  float nightSea = mix(0.250, 0.068, pow(depth, 0.58)) + rip * 0.008 + streaks * 0.055;',
    '',
    '  /* ---- the mark, reflected ------------------------------------------ */',
    '  float starH = u_starPx * px;',
    '  float starY = h - starH * 1.05;',
    '',
    '  /* The surface is a stack of thin facets. Each row carries its own',
    '     sideways offset and weight, which is what turns a mirrored shape',
    '     into glitter rather than a recognizable silhouette. */',
    '  float rows = mix(78.0, 42.0, u_lowQuality);',
    '  float rowY = uv.y * rows;',
    '  float row = floor(rowY);',
    '  float rowF = fract(rowY);',
    '  float sliver = smoothstep(0.02, 0.40, rowF) * (1.0 - smoothstep(0.55, 0.99, rowF));',
    '  float r1 = hash21(vec2(row * 0.417, 17.0));',
    '  float r2 = hash21(vec2(row * 0.913, 5.0));',
    '  float jitter = (r1 - 0.5) * starH * 0.22;',
    '',
    '  /* Slow swell moves whole bands; the facet jitter breaks them up. */',
    '  float calm = mix(0.28, 1.0, smoothstep(0.0, 0.55, depth));',
    '  float wob = 0.0;',
    '  wob += sin(depth * 13.0 - u_time * 0.35) * 0.0210;',
    '  wob += sin(depth * 31.0 + u_time * 0.62) * 0.0088;',
    '  wob += sin(depth * 67.0 - u_time * 1.10) * 0.0034;',
    '  wob *= calm;',
    '',
    '  vec2 q = vec2(p.x - wob + jitter, (uv.y - starY) / 1.50) / starH;',
    '  float mark = 1.0 - smoothstep(-0.35, 0.35, sparkleField(q));',
    '  mark *= mix(0.22, 1.0, sliver) * (0.72 + 0.28 * r2);',
    '',
    '  /* A column of broken light under the mark, widening toward the shore. */',
    '  float spread = starH * (0.78 + depth * 1.35);',
    '  float column = exp(-pow(abs(p.x - wob) / spread, 2.0));',
    '  float glints = smoothstep(0.50, 0.96,',
    '                            vnoise(vec2(p.x * 44.0 + r1 * 4.0, rowY * 0.55 - u_time * 0.30)));',
    '  /* A faint continuous streak under the glints keeps the path reading as',
    '     one reflection instead of a row of separate blobs. */',
    '  float path = column * (0.20 + 0.80 * glints * mix(0.30, 1.0, sliver));',
    '  path *= smoothstep(0.0, 0.16, depth) * (1.0 - smoothstep(0.30, 0.68, depth));',
    '',
    '  float glow = (path * 0.80 + mark * 0.52) * water;',     '',
    '  /* ---- compose ------------------------------------------------------ */',
    '  /* Ink in daylight, light at night: one mark, opposite legibility. */',
    '  float dayLum   = mix(daySky, daySea, water) - glow * 1.05;',
    '  float nightLum = mix(nightSky, nightSea, water) + glow * 1.10;',
    '',
    '  if (night > 0.02) {',
    '    vec2 sp = p * 36.0;',
    '    vec2 cell = floor(sp);',
    '    vec2 local = fract(sp) - 0.5;',
    '    float pick = hash21(cell);',
    '    float big = step(0.974, pick);',
    '    float small = step(0.912, pick) * (1.0 - big);',
    '    float twinkle = 0.55 + 0.45 * sin(u_time * (1.0 + pick * 2.2) + pick * 31.0);',
    '    float dBig = 1.0 - smoothstep(0.0, 0.075, length(local));',
    '    float dSmall = 1.0 - smoothstep(0.0, 0.042, length(local));',
    '    float field = (dBig * big + dSmall * small) * twinkle;',
    '    field *= smoothstep(0.015, 0.20, above) * (1.0 - water);',
    '    nightLum += field * night * 0.90;',
    '  }',
    '',
    '  float lum = mix(dayLum, nightLum, night);',
    '',
    '  float line = 1.0 - smoothstep(0.0, 1.4 * px, abs(uv.y - h));',
    '  lum += line * mix(0.085, 0.040, night);',
    '',
    '  float grainAmt = mix(0.045, 0.040, night);',
    '  float g1 = hash21(gl_FragCoord.xy + fract(u_time) * 137.0);',
    '  float g2 = hash21(gl_FragCoord.yx * 1.7 + fract(u_time) * 311.0);',
    '  lum += ((g1 + g2) * 0.5 - 0.5) * grainAmt;',
    '',
    '  float vig = smoothstep(1.15, 0.25, length((uv - 0.5) * vec2(1.1, 1.0)) * 1.35);',
    '  lum *= mix(0.94, 1.0, vig);',
    '',
    '  lum = clamp(lum, 0.0, 1.0);',
    '  vec3 day = mix(DAY_DARK, DAY_LIGHT, lum);',
    '  vec3 ngt = mix(NIGHT_DARK, NIGHT_LIGHT, lum);',
    '  gl_FragColor = vec4(mix(day, ngt, night), 1.0);',
    '}'
  ].join('\n');

  var canvas = document.getElementById('scene');
  if (!canvas) return;

  var root = document.documentElement;
  var gl = null;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power'
    }) || canvas.getContext('experimental-webgl');
  } catch (err) {
    gl = null;
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // No WebGL: the CSS gradient behind the canvas stands in.
  if (!gl) {
    canvas.style.display = 'none';
    root.classList.add('no-scene');
    return;
  }

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vs = compile(gl.VERTEX_SHADER, VERTEX);
  var fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) {
    canvas.style.display = 'none';
    root.classList.add('no-scene');
    return;
  }

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.style.display = 'none';
    root.classList.add('no-scene');
    return;
  }
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(program, 'u_res');
  var uTime = gl.getUniformLocation(program, 'u_time');
  var uNight = gl.getUniformLocation(program, 'u_night');
  var uHorizon = gl.getUniformLocation(program, 'u_horizon');
  var uStarPx = gl.getUniformLocation(program, 'u_starPx');
  var uLowQuality = gl.getUniformLocation(program, 'u_lowQuality');

  // The horizon sits at 39.43% of the canvas height, measured from the bottom.
  // The hero copy is anchored to the same number, so the two always agree.
  var HORIZON = 0.394309;

  var night = root.classList.contains('theme-night') ? 1 : 0;
  var nightTarget = night;
  var nightFrom = night;
  var nightStart = 0;
  var NIGHT_MS = 900;
  var easing = function (t) {
    // Matches the shader's smoothstep feel: cubic-bezier(.333,0,.667,1)
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  var width = 0;
  var height = 0;
  var starPx = 46;
  var lowQuality = 0;
  var start = null;
  var elapsed = 0;
  var frame = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth || window.innerWidth;
    var cssH = canvas.clientHeight || window.innerHeight;
    // Very large viewports do not need native resolution for a soft scene.
    var budget = 2.6e6;
    var maxPixels = budget;
    var w = Math.round(cssW * dpr);
    var hh = Math.round(cssH * dpr);
    if (w * hh > maxPixels) {
      var shrink = Math.sqrt(maxPixels / (w * hh));
      w = Math.max(1, Math.round(w * shrink));
      hh = Math.max(1, Math.round(hh * shrink));
    }
    lowQuality = w * hh < 700000 ? 1 : 0;
    if (w === width && hh === height) return;
    width = w;
    height = hh;
    canvas.width = w;
    canvas.height = hh;
    gl.viewport(0, 0, w, hh);

    starPx = Math.max(34, Math.min(64, Math.round(Math.min(window.innerWidth, 1400) * 0.042)));
    root.style.setProperty('--scene-horizon-from-bottom', (HORIZON * cssH).toFixed(2) + 'px');
  }

  function draw(now) {
    frame = 0;
    if (start === null) start = now;
    elapsed = (now - start) / 1000;

    if (night !== nightTarget) {
      var t = Math.min(1, (now - nightStart) / NIGHT_MS);
      night = nightFrom + (nightTarget - nightFrom) * easing(t);
      if (t >= 1) night = nightTarget;
    }

    gl.uniform2f(uRes, width, height);
    gl.uniform1f(uTime, elapsed);
    gl.uniform1f(uNight, night);
    gl.uniform1f(uHorizon, HORIZON);
    gl.uniform1f(uStarPx, starPx);
    gl.uniform1f(uLowQuality, lowQuality);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (night !== nightTarget || !reduced.matches) {
      frame = requestAnimationFrame(draw);
    }
  }

  function kick() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function setNight(isNight) {
    nightFrom = night;
    nightTarget = isNight ? 1 : 0;
    nightStart = performance.now();
    kick();
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      kick();
    }, 120);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      kick();
    }
  });

  if (reduced.addEventListener) {
    reduced.addEventListener('change', function () {
      kick();
    });
  }

  resize();
  kick();

  window.__scene = {
    setNight: setNight,
    refresh: function () {
      resize();
      kick();
    }
  };
})();
