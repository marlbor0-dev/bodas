import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A real, lit 3D jewelry scene. The invitation's clock owns its playback.
export function createRingStage(canvas, { onReady, onUnavailable } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(environment, .03);
  scene.environment = envMap.texture;
  scene.environmentIntensity = 1.45;
  environment.dispose();
  pmrem.dispose();

  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xd9e0e6, metalness: 1, roughness: .19,
    clearcoat: .7, clearcoatRoughness: .12, envMapIntensity: 1.4,
  });
  const profile = new THREE.SplineCurve([
    [.88,-.14],[.91,-.185],[1.025,-.18],[1.073,-.13],[1.085,0],
    [1.073,.13],[1.025,.18],[.91,.185],[.88,.14],[.874,0],[.88,-.14],
  ].map(([x,y]) => new THREE.Vector2(x,y)));
  const geometry = new THREE.LatheGeometry(profile.getPoints(64), 144);
  geometry.rotateX(Math.PI / 2);
  const left = new THREE.Mesh(geometry, silver);
  const right = new THREE.Mesh(geometry, silver);
  left.castShadow = right.castShadow = true;
  left.receiveShadow = right.receiveShadow = true;
  right.scale.setScalar(.93);
  scene.add(left, right);

  const key = new THREE.DirectionalLight(0xfffcf4, 4.1);
  key.position.set(-3,5,5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -5;
  key.shadow.camera.right = key.shadow.camera.top = 5;
  key.shadow.normalBias = .025;
  key.shadow.bias = -.0003;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8e7ff, 2.8);
  rim.position.set(4,2,-3);
  scene.add(rim, new THREE.HemisphereLight(0xffffff,0x72806c,1.1));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.ShadowMaterial({ color:0x26372b, opacity:.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.095;
  floor.receiveShadow = true;
  scene.add(floor);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d');
  const shadowGradient = shadowContext.createRadialGradient(64,64,1,64,64,64);
  shadowGradient.addColorStop(0,'rgba(19,35,24,.4)');
  shadowGradient.addColorStop(.3,'rgba(19,35,24,.2)');
  shadowGradient.addColorStop(1,'rgba(19,35,24,0)');
  shadowContext.fillStyle = shadowGradient;
  shadowContext.fillRect(0,0,128,128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const contactShadows = [left,right].map(() => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.6),new THREE.MeshBasicMaterial({ map:shadowTexture,transparent:true,depthWrite:false,opacity:.7 }));
    mesh.rotation.x = -Math.PI/2;
    mesh.position.y = -1.085;
    scene.add(mesh);
    return mesh;
  });

  const gleamCanvas = document.createElement('canvas');
  gleamCanvas.width = gleamCanvas.height = 128;
  const g = gleamCanvas.getContext('2d');
  const glow = g.createRadialGradient(64,64,0,64,64,64);
  glow.addColorStop(0,'rgba(255,255,255,1)');
  glow.addColorStop(.07,'rgba(255,255,255,.95)');
  glow.addColorStop(.2,'rgba(241,249,255,.35)');
  glow.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle = glow; g.fillRect(0,0,128,128);
  const streak = g.createLinearGradient(0,0,128,0);
  streak.addColorStop(0,'transparent'); streak.addColorStop(.5,'white'); streak.addColorStop(1,'transparent');
  g.fillStyle = streak; g.fillRect(0,63,128,2);
  g.translate(64,64); g.rotate(Math.PI/2); g.fillRect(-64,-1,128,2);
  const gleamTexture = new THREE.CanvasTexture(gleamCanvas);
  const gleamMaterial = new THREE.SpriteMaterial({ map:gleamTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0 });
  const gleam = new THREE.Sprite(gleamMaterial);
  gleam.scale.set(.7,.7,1);
  scene.add(gleam);

  let frame = 0, lastTime = 0, elapsed = 0, active = false, paused = false, reduced = false;
  let rendered = false, lost = false, width = 1, height = 1;
  const clamp = THREE.MathUtils.clamp;
  const smooth = (a,b,t) => { const x=clamp((t-a)/(b-a),0,1); return x*x*(3-2*x); };
  const lerp = THREE.MathUtils.lerp;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width; height = rect.height;
    renderer.setSize(width,height,false);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    if (active) render();
  }
  function render() {
    if (lost) return;
    const t = reduced ? 9 : Math.min(elapsed/1000,14);
    const arrive = smooth(0,4.8,t), meet = smooth(3.2,7.2,t), push = smooth(6.3,13.2,t);
    // The first move is a rolling entrance; the second is a close, deliberate settling.
    left.position.set(lerp(-2.4,-.67,arrive), lerp(.34,0,arrive),lerp(-.6,0,arrive));
    right.position.set(lerp(2.5,.65,arrive),lerp(.65,-.072,arrive),lerp(-1.2,.32,arrive));
    left.rotation.set(lerp(.7,.08,arrive),lerp(-1.7,.15,arrive)+Math.sin(t*.22)*.045,lerp(-1.1,-.16,arrive));
    right.rotation.set(lerp(-.55,-.03,arrive),lerp(1.6,-.32,arrive)-Math.sin(t*.18)*.055,lerp(1.3,.12,arrive));
    left.position.x += lerp(0,.1,meet);
    right.position.x -= lerp(0,.09,meet);
    const distance = Math.max(6.3,4.45/(2*Math.tan(THREE.MathUtils.degToRad(17))*camera.aspect));
    camera.position.set(lerp(.82,-.34,smooth(0,13.5,t)), .66+push*.13, distance*(1.12-push*.12));
    camera.lookAt(0,-.02,0);
    scene.environmentRotation.y = -.35+t*.055;
    key.position.x = -4 + t*.45;
    contactShadows.forEach((shadow,index) => {
      const ring = index ? right:left;
      shadow.position.x = ring.position.x;
      shadow.position.z = ring.position.z;
      shadow.material.opacity = .4+arrive*.4;
    });
    const flash = Math.exp(-Math.pow((t-6.15)/.4,2))*.92 + Math.exp(-Math.pow((t-10.15)/.6,2))*.72;
    gleamMaterial.opacity = reduced ? 0 : flash;
    gleam.position.set(t<8?-.05:1.3,t<8?.88:.65,t<8?.35:.46);
    renderer.render(scene,camera);
    if (!rendered) { rendered=true; onReady?.(); }
    canvas.dataset.motionTime = Math.round(elapsed).toString();
  }
  function tick(now) {
    frame = 0;
    if (!active || paused || lost || document.hidden) return;
    if (lastTime) elapsed += Math.min(now-lastTime,80);
    lastTime = now;
    render();
    if (!reduced) frame = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(frame); frame=0; lastTime=0; }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const contextLost = event => { event.preventDefault(); lost=true; stop(); onUnavailable?.(); };
  canvas.addEventListener('webglcontextlost',contextLost);
  return {
    play(startAt=0, isPaused=false, reduceMotion=false) {
      stop(); active=true; paused=isPaused; reduced=reduceMotion; elapsed=startAt;
      resize(); render();
      if (!paused && !reduced && !document.hidden) frame=requestAnimationFrame(tick);
    },
    pause(value) {
      paused=value; stop();
      if (active && !paused && !reduced && !document.hidden && !lost) frame=requestAnimationFrame(tick);
    },
    stop() { active=false; stop(); },
    dispose() {
      active=false; stop(); resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost',contextLost);
      geometry.dispose(); silver.dispose(); envMap.dispose(); shadowTexture.dispose(); gleamTexture.dispose();
      scene.traverse(obj=> { if(obj.isMesh && obj!==left && obj!==right) {obj.geometry.dispose();obj.material.dispose();} });
      gleamMaterial.dispose(); renderer.dispose();
    },
  };
}
