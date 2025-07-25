// Import orbit camera controls
import { OrbitControls } from './OrbitControls.js';

// Load textures for the scene
const loader = new THREE.TextureLoader();

// Set up scene
const scene = new THREE.Scene();

// Set up camera with perspective projection
const camera = new THREE.PerspectiveCamera(
  75, // field of view
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1, // near clipping plane
  1000 // far clipping plane
);

// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x000000);
renderer.shadowMap.enabled = true;

// Add ambient and directional lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Timer variables for the scoreboard
let timerMesh = null;
let remainingSeconds = 600; // 10 minutes = 600 seconds
let updateScoreboardTimer = null; // function to update scoreboard timer

// --- Rim/Hoop Data ---
const RIM_RADIUS = 0.5;
const RIM_HEIGHT = 3.05;
const LEFT_RIM = { x: -15 + 0.55, y: RIM_HEIGHT, z: 0 };
const RIGHT_RIM = { x: 15 - 0.55, y: RIM_HEIGHT, z: 0 };


let lastShotScored = false; // For feedback

// --- Scene Creation Functions ---

function createFloor() {
  const floorTexture = loader.load('src/textures/wood_floor.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(8, 5); // More repeats for larger floor
  const courtMaterial = new THREE.MeshPhongMaterial({
    map: floorTexture,
    shininess: 10,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
  // Expanded floor
  const floorGeometry = new THREE.BoxGeometry(60, 0.2, 50);
  const floor = new THREE.Mesh(floorGeometry, courtMaterial);
  floor.receiveShadow = true;
  scene.add(floor);

  // Add white edge lines for the 30x15 court boundary
  const edgeLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const y = 0.12; // Slightly above the floor, below the ball
  const halfCourtWidth = 15;
  const halfCourtDepth = 7.5;
  const edgePoints = [
    new THREE.Vector3(-halfCourtWidth, y, -halfCourtDepth),
    new THREE.Vector3( halfCourtWidth, y, -halfCourtDepth),
    new THREE.Vector3( halfCourtWidth, y,  halfCourtDepth),
    new THREE.Vector3(-halfCourtWidth, y,  halfCourtDepth),
    new THREE.Vector3(-halfCourtWidth, y, -halfCourtDepth)
  ];
  const edgeLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(edgePoints),
    edgeLineMaterial
  );
  edgeLine.renderOrder = 1;
  scene.add(edgeLine);
}

function createSignature() {
  const fontLoader = new THREE.FontLoader();
  fontLoader.load(
    'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
    font => {
      const message = 'By Eden Zehavy & Rotem Haim';
      const textOpts = { font, size: 0.3, height: 0.02, curveSegments: 8, bevelEnabled: false };
      const geo = new THREE.TextGeometry(message, textOpts);
      geo.computeBoundingBox();
      const textWidth = geo.boundingBox.max.x - geo.boundingBox.min.x;
      const mat = new THREE.MeshBasicMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(-textWidth / 2, 0.21, 12);
      scene.add(mesh);
    }
  );
}

function createCourtLines() {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Mid-court line
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.12, -7.5),
    new THREE.Vector3(0, 0.12, 7.5)
  ]);
  const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
  centerLine.renderOrder = 1;
  scene.add(centerLine);
  // Center circle
  const circlePoints = [];
  const radius = 2;
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(radius * Math.cos(theta), 0.12, radius * Math.sin(theta)));
  }
  const centerCircle = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePoints), lineMaterial);
  centerCircle.renderOrder = 1;
  scene.add(centerCircle);
  // Three-point arcs
  drawArc(-15, lineMaterial);
  drawArc(15, lineMaterial);
  // Key area and lights
  createKeyArea();
  addAdvancedLights();
  createFreeThrowLines();
}


function createFreeThrowLines() {
  const y = 0.12;          // Slightly above the floor
  const lineMat = new THREE.LineBasicMaterial({
    color:       0xffffff,
    depthTest:   false,    // draw on top of the key mesh
  });
  const arcRadius       = 1.8;   // match createKeyArea's circleRadius
  const halfLineWidth   = 1.8;   // free-throw line is 12 ft ≈ 1.8 units here
  const segments        = 32;
  
  [ -1, 1 ].forEach(side => {
    const x0 = side * (15 - 5);   // same x as your key's "top of the key"

    // semicircle arc facing center
    const arcLineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      depthTest: true
    });
    const arcLinePts = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI;
      const dx = arcRadius * Math.sin(t) * (side < 0 ? +1 : -1);
      const dz = arcRadius * Math.cos(t);
      arcLinePts.push(new THREE.Vector3(x0 + dx, y, dz));
    }
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcLinePts),
      arcLineMat
    );
    arcLine.renderOrder = 1;
    scene.add(arcLine);
  });
}


function drawArc(xCenter, material) {
  const pts = [];
  const threePointRadius = 7;
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI;
    const x = xCenter + (xCenter < 0 ? 1 : -1) * threePointRadius * Math.sin(theta);
    const z = threePointRadius * Math.cos(theta);
    pts.push(new THREE.Vector3(x, 0.12, z)); // Slightly above the floor
  }
  const arcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material);
  arcLine.renderOrder = 1;
  scene.add(arcLine);
}

function createKeyArea() {
  const lineMat     = new THREE.LineBasicMaterial({ color: 0xffffff });
  const circleRadius = 1.8;
  const laneWidth    = 4.6;  // width of the key (in Z)
  const laneDepth    = 5;    // depth of the key (in X)

  for (const side of [-1, 1]) {
    const innerX = side * (15 - laneDepth);
    const outerX = side * 15;

    // --- 1) blue painted rectangle ---
    const blueMat = new THREE.MeshBasicMaterial({
      color:       0x0000ff,   // ← your exact blue
      transparent: true,
      opacity:     0.5,
      side:        THREE.DoubleSide
    });
    const rectGeo  = new THREE.PlaneGeometry(laneDepth, laneWidth);
    const rectMesh = new THREE.Mesh(rectGeo, blueMat);
    rectMesh.rotation.x = -Math.PI / 2;
    rectMesh.position.set((innerX + outerX) / 2, 0.101, 0);
    scene.add(rectMesh);

    // --- 2) white outline rectangle ---
    const outlinePts = [
      new THREE.Vector3(innerX, 0.12, -laneWidth/2),
      new THREE.Vector3(outerX, 0.12, -laneWidth/2),
      new THREE.Vector3(outerX, 0.12,  laneWidth/2),
      new THREE.Vector3(innerX, 0.12,  laneWidth/2),
      new THREE.Vector3(innerX, 0.12, -laneWidth/2)
    ];
    const outline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(outlinePts),
      lineMat
    );
    outline.renderOrder = 1;
    scene.add(outline);

    // Draw the free-throw arc as a simple line (not mesh)
    const arcLineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      depthTest: true
    });
    const arcLinePts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI;
      const x = innerX - side * (circleRadius * Math.sin(t));
      const z = circleRadius * Math.cos(t);
      arcLinePts.push(new THREE.Vector3(x, 0.12, z));
    }
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcLinePts),
      arcLineMat
    );
    arcLine.renderOrder = 1;
    scene.add(arcLine);

    // Hide arc outline if camera is below the floor
    function updateArcOutlineVisibility() {
      arcLine.visible = camera.position.y >= 0;
    }
    // Attach to animation loop
    if (!window._arcOutlineVisibilityHooks) window._arcOutlineVisibilityHooks = [];
    window._arcOutlineVisibilityHooks.push(updateArcOutlineVisibility);
  }
}

function addAdvancedLights() {
  // Hoop spotlights
  [ -1, 1 ].forEach(side => {
    const spot = new THREE.SpotLight(0xffddaa, 0.5);
    spot.position.set(side * 13, 8, 0);
    spot.target.position.set(side * 15, 3, 0);
    spot.angle = Math.PI / 8;
    spot.penumbra = 0.4;
    spot.castShadow = true;
    scene.add(spot, spot.target);
  });
  
  // Stadium overhead light for seat shadows
  const stadiumLight = new THREE.DirectionalLight(0xffffff, 0.25);
  stadiumLight.position.set(0, 30, 10);
  stadiumLight.castShadow = true;
  stadiumLight.shadow.mapSize.width = 2048;
  stadiumLight.shadow.mapSize.height = 2048;
  stadiumLight.shadow.camera.left = -30;
  stadiumLight.shadow.camera.right = 30;
  stadiumLight.shadow.camera.top = 20;
  stadiumLight.shadow.camera.bottom = -20;
  stadiumLight.shadow.camera.near = 1;
  stadiumLight.shadow.camera.far = 60;
  stadiumLight.shadow.bias = -0.001;
  scene.add(stadiumLight);

  // Signature spotlight
  const signatureSpot = new THREE.SpotLight(0x0000ff, 0.8);
  signatureSpot.position.set(0, 8, 18);
  signatureSpot.target.position.set(0, 0.21, 12);
  signatureSpot.angle = Math.PI / 12;
  signatureSpot.penumbra = 0.2;
  signatureSpot.castShadow = true;
  scene.add(signatureSpot, signatureSpot.target);
  
  // Hemisphere and center
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.2));
  const centerSpot = new THREE.SpotLight(0xffffff, 0.2);
  centerSpot.position.set(0, 12, 0);
  centerSpot.target.position.set(0, 0, 0);
  centerSpot.angle = Math.PI / 9;
  centerSpot.penumbra = 0.3;
  centerSpot.castShadow = true;
  scene.add(centerSpot, centerSpot.target);
}

function createHoops() {
  createHoop(-15);
  createHoop(15);
}

function createHoop(xPosition) {
  const direction = xPosition === 15 ? 1 : -1;
  const actualBoardX = xPosition;

  // === Transparent Backboard ===
  const backboardGeometry = new THREE.BoxGeometry(0.05, 1.8, 3.5);
  const backboardMaterial = new THREE.MeshPhongMaterial({
    color:       0xffffff,
    transparent: true,
    opacity:     0.5,
    depthWrite:  true
  });
  const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
  backboard.position.set(actualBoardX, 3.7, 0);
  backboard.renderOrder = 0;
  backboard.castShadow  = true;
  scene.add(backboard);

  // === White Outline Rectangles on Backboard ===
  function createRectangleMesh(width, height, offsetX, lineWidth = 0.05) {
    const group = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(lineWidth, lineWidth, width + 0.05),
      lineMat
    );
    top.position.set(offsetX,  height / 2, 0);
    group.add(top);

    const bottom = top.clone();
    bottom.position.set(offsetX, -height / 2, 0);
    group.add(bottom);

    const left = new THREE.Mesh(
      new THREE.BoxGeometry(lineWidth, height, lineWidth),
      lineMat
    );
    left.position.set(offsetX, 0, -width / 2);
    group.add(left);

    const right = left.clone();
    right.position.set(offsetX, 0, width / 2);
    group.add(right);

    return group;
  }

  const outerRect = createRectangleMesh(3.55, 1.8, 0);
  const innerRect = createRectangleMesh(1.4, 0.8, 0);
  innerRect.position.y = -0.2;

  outerRect.translateX(0.03);
  innerRect.translateX(0.031);

  outerRect.position.set(actualBoardX + 0.03, 3.7, 0.001);
  innerRect.position.set(actualBoardX + 0.031, 3.5, 0.001);

  scene.add(outerRect, innerRect);

  // === Orange Rim ===
  const rimOffset  = 0.55;
  const actualRimX = xPosition + direction * -rimOffset;
  const rimGeometry = new THREE.TorusGeometry(0.5, 0.04, 16, 100);
  const rimMaterial = new THREE.MeshPhongMaterial({
    color:      0xff6600,
    depthWrite: true,
    depthTest:  true
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(actualRimX, 3.05, 0);
  rim.castShadow   = true;
  rim.receiveShadow = true;
  rim.renderOrder  = 2;
  scene.add(rim);

  // === Metal Chain Net ===
  const netMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
  const netGroup = new THREE.Group();
  const rimRadius = 0.5, netHeight = 0.8, innerRadius = 0.25, numStrings = 20;

  for (let i = 0; i < numStrings; i++) {
    const angle = (i / numStrings) * Math.PI * 2;
    const x1 = rimRadius    * Math.cos(angle);
    const z1 = rimRadius    * Math.sin(angle);
    const x2 = innerRadius  * Math.cos(angle);
    const z2 = innerRadius  * Math.sin(angle);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const midY = -netHeight * 0.4;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, 0,   z1),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(x2, -netHeight, z2)
    ]);
    const netGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(10));
    netGroup.add(new THREE.Line(netGeo, netMat));
  }

  const actualNetX = xPosition === 15
    ? xPosition - rimOffset
    : xPosition + rimOffset;
  netGroup.position.set(actualNetX, 3.05, 0);
  scene.add(netGroup);

  // === Support Pole Behind Backboard ===
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 16);
  const poleMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  const actualPoleX = xPosition === 15
    ? xPosition + 0.8
    : xPosition - 0.8;
  pole.position.set(actualPoleX, 1.5, 0);
  pole.castShadow = true;
  scene.add(pole);

  // === Diagonal Arm Between Pole and Backboard ===
  const armLength   = Math.abs(actualPoleX - actualBoardX);
  const armGeo      = new THREE.BoxGeometry(armLength, 0.05, 0.05);
  const armMat      = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const arm         = new THREE.Mesh(armGeo, armMat);
  arm.position.set((actualBoardX + actualPoleX) / 2, 3.3, 0);
  arm.rotation.z = direction * -Math.PI / 12;
  arm.castShadow = true;
  scene.add(arm);
}

// --- Basketball State Variables ---
let basketball = null; // Will hold the basketball mesh
let basketballGroup = null; // Will hold the group for ball + seams
let ballPosition = { x: 0, y: 0.61, z: 0 }; // y = radius + floor height
let ballVelocity = { x: 0, y: 0, z: 0 };
let isBallMoving = false; // For future physics
let shotPower = 0.5; // 0.0 to 1.0
const BALL_RADIUS = 0.5;
const COURT_BOUNDS = { x: 15, z: 7.5 };
const SHOT_POWER_STEP = 0.01;
const GRAVITY = -0.035; // stronger gravity
const BOUNCE_ENERGY_LOSS = 0.8; // less energy lost per bounce
const BALL_STOP_VELOCITY = 0.05; // below this, stop the ball
const BALL_STOP_HEIGHT = BALL_RADIUS + 0.11;
// --- Rotation Animation State ---
let ballRotationAxis = new THREE.Vector3(1, 0, 0); // Default axis
let ballRotationSpeed = 0; // radians per frame
let prevBallPosition = { x: ballPosition.x, y: ballPosition.y, z: ballPosition.z };

// --- Create Basketball (refactored) ---
function createBasketball() {
  const ballTexture = loader.load('src/textures/basketball.png');
  ballTexture.wrapS = ballTexture.wrapT = THREE.ClampToEdgeWrapping;
  ballTexture.repeat.set(1, 1);
  ballTexture.encoding = THREE.sRGBEncoding;
  const ballMaterial = new THREE.MeshPhongMaterial({ map: ballTexture, shininess: 50 });
  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
  basketball = new THREE.Mesh(ballGeometry, ballMaterial);
  basketball.castShadow = true;
  basketball.receiveShadow = true;
  // Create group for ball and seams
  basketballGroup = new THREE.Group();
  basketballGroup.add(basketball);
  // equator seam
  basketballGroup.add(makeSeamCircle('XZ'));
  // two meridian seams
  const mer1 = makeSeamCircle('YZ');
  mer1.rotation.y = Math.PI / 2;
  basketballGroup.add(mer1);
  const mer2 = makeSeamCircle('YZ');
  mer2.rotation.y = -Math.PI / 2;
  basketballGroup.add(mer2);
  // two angled seams at ±45°
  const s1 = makeSeamCircle('XZ');
  s1.rotation.x = Math.PI / 4;
  basketballGroup.add(s1);
  const s2 = makeSeamCircle('XZ');
  s2.rotation.x = -Math.PI / 4;
  basketballGroup.add(s2);
  basketballGroup.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
  basketballGroup.castShadow = true;
  basketballGroup.receiveShadow = true;
  scene.add(basketballGroup);
}

function makeSeamCircle(plane) {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    let x = 0, y = 0, z = 0;
    if (plane === 'XZ') {
      x = BALL_RADIUS * Math.cos(t);
      z = BALL_RADIUS * Math.sin(t);
    } else { // 'YZ'
      y = BALL_RADIUS * Math.cos(t);
      z = BALL_RADIUS * Math.sin(t);
    }
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve   = new THREE.CatmullRomCurve3(pts, true);
  const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.008, 12, true);
  return new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
}

function createBleachersAt(position, rotationY = 0) {
  const group = new THREE.Group();
  
  // All seats blue for consistency
  const seatColor = 0x3366cc; // Blue
  
  // Configuration
  const rows = 8; // More rows for better stadium feel
  const courtW = 30; // Full court width
  const stepRise = 0.35; // Height between rows
  const stepRun = 0.8; // Depth of each row
  const seatW = 0.6; // Width of each seat
  const seatD = 0.5; // Depth of seat
  const seatsPer = 50; // More seats to cover full court length
  const aisleEvery = 10; // Aisle every 10 seats
  
  // Create seats for each row
  for (let row = 0; row < rows; row++) {
    const y = stepRise * row + 0.15; // Seat height
    const z = -7.5 - stepRun / 2 - row * stepRun;
    
    for (let i = 0; i < seatsPer; i++) {
      // Skip seats to create aisles
      if (i % aisleEvery === aisleEvery - 1) continue;
      
      const x = -courtW / 2 + seatW / 2 + i * seatW;
      
      // Seat material with better properties
      const seatMat = new THREE.MeshStandardMaterial({ 
        color: seatColor, 
        metalness: 0.2, 
        roughness: 0.7 
      });
      
      // Seat base (slightly curved for realism)
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(seatW * 0.9, 0.12, seatD * 0.9), 
        seatMat
      );
      seat.position.set(x, y, z);
      seat.castShadow = true;
      group.add(seat);
      
      // Backrest (angled slightly)
      const backrest = new THREE.Mesh(
        new THREE.BoxGeometry(seatW * 0.9, 0.25, 0.08), 
        seatMat
      );
      backrest.position.set(x, y + 0.15, z - seatD * 0.3);
      backrest.rotation.x = -Math.PI / 12; // Slight angle
      backrest.castShadow = true;
      group.add(backrest);
      
      // Armrests (optional - adds detail)
      if (i % aisleEvery !== 0) { // Don't add armrests at aisle positions
        const armrestMat = new THREE.MeshStandardMaterial({ 
          color: 0x444444, 
          metalness: 0.8, 
          roughness: 0.3 
        });
        
        const armrest = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.15, seatD * 0.8), 
          armrestMat
        );
        armrest.position.set(x + seatW * 0.45, y + 0.1, z);
        armrest.castShadow = true;
        group.add(armrest);
      }
    }
  }
  
  // Add structural supports
  const supportMat = new THREE.MeshStandardMaterial({ 
    color: 0x222222, 
    metalness: 0.9, 
    roughness: 0.2 
  });
  
  // Vertical supports
  for (let i = 0; i <= seatsPer; i += aisleEvery) {
    const x = -courtW / 2 + i * seatW;
    const support = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, stepRise * rows + 0.5, 0.1), 
      supportMat
    );
    support.position.set(x, (stepRise * rows + 0.5) / 2, -7.5 - stepRun * rows / 2);
    support.castShadow = true;
    group.add(support);
  }
  
  // Position and rotate the entire bleacher section
  group.position.copy(position);
  group.rotation.y = rotationY;
  scene.add(group);
}

function createBleachers() {
  // Create bleachers on all four sides for a complete stadium feel
  // All sections are now symmetric around the court and closer to the field
  createBleachersAt(new THREE.Vector3(0, 0, -8.5)); // Behind one baseline - closer
  createBleachersAt(new THREE.Vector3(0, 0, 8.5), Math.PI); // Opposite baseline - closer
  createBleachersAt(new THREE.Vector3(-12, 0, 0), Math.PI / 2); // Left sideline - closer
  createBleachersAt(new THREE.Vector3(12, 0, 0), -Math.PI / 2); // Right sideline - closer
}

function createScoreboard() {
  // Group everything so we can position it as one unit
  const boardGroup = new THREE.Group();

  // 1) Frame: larger metal surround
  const frameGeo = new THREE.BoxGeometry(12.2, 4.6, 0.4);
  const frameMat = new THREE.MeshStandardMaterial({
    color:      0x222222,
    metalness:  0.6,
    roughness:  0.3
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.castShadow = frame.receiveShadow = true;
  boardGroup.add(frame);

  // 2) Screen: bigger inset plane with backlight
  const screenGeo = new THREE.PlaneGeometry(11.8, 4.0);
  const screenMat = new THREE.MeshStandardMaterial({
    color:             0x000000,
    emissive:          0x002244,
    emissiveIntensity: 0.8,
    roughness:         0.2,
    metalness:         0.1,
    side:              THREE.DoubleSide
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0, 0.21);
  boardGroup.add(screen);

  // 3) Load a modern sans font and build text meshes in fence-blue
  const fenceBlue = 0x0000ff;
  const fontLoader = new THREE.FontLoader();
  fontLoader.load(
    'https://threejs.org/examples/fonts/gentilis_bold.typeface.json',
    font => {
      // keep text size the same as before
      const textOpts = {
        font,
        size:           0.6,
        height:         0.05,
        curveSegments:  8,
        bevelEnabled:   false
      };
      const textMat = new THREE.MeshBasicMaterial({
        color:             fenceBlue,
        emissive:          fenceBlue,
        emissiveIntensity: 1
      });

      // LOCAL score
      const localGeo = new THREE.TextGeometry('LOCAL 0', textOpts);
      localGeo.computeBoundingBox();
      const localMesh = new THREE.Mesh(localGeo, textMat);
      // shift to fit larger screen
      localMesh.position.set(-5.5, 0.8, 0.22);
      boardGroup.add(localMesh);

      // VISITOR score
      const visitorGeo = new THREE.TextGeometry('VISITOR 0', textOpts);
      visitorGeo.computeBoundingBox();
      const visitorMesh = new THREE.Mesh(visitorGeo, textMat);
      visitorMesh.position.set( 1.5, 0.8, 0.22);
      boardGroup.add(visitorMesh);

      // GAME TIME label
      const makeTimerMesh = () => {
        const geo = new THREE.TextGeometry('GAME TIME 10:00', textOpts);
        geo.computeBoundingBox();
        const mesh = new THREE.Mesh(geo, textMat);
        // center under the scores
        const w = geo.boundingBox.max.x - geo.boundingBox.min.x;
        mesh.position.set(-w / 2, -1.2, 0.22);
        return mesh;
      };

      // static timer
      timerMesh = makeTimerMesh();
      boardGroup.add(timerMesh);
    }
  );

  // 4) Position the whole scoreboard above the court
  boardGroup.position.set(0, 8, -15);
  scene.add(boardGroup);
}

function createBasketballCourt() {
  createFloor();
  createSignature();
  createCourtLines();
  createHoops();
  createBasketball();
  createScoreboard();
  createBleachers();
}

// Initialize
createBasketballCourt();
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.enablePan = true;
controls.enableZoom = true;
controls.zoomSpeed = 2.0;
controls.panSpeed = 2.0;
let isOrbitEnabled = true;

// Camera lock indicator
const cameraLockIndicator = document.createElement('div');
cameraLockIndicator.style.position = 'absolute';
cameraLockIndicator.style.top = '20px';
cameraLockIndicator.style.right = '20px';
cameraLockIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
cameraLockIndicator.style.color = '#ff0000';
cameraLockIndicator.style.padding = '10px 15px';
cameraLockIndicator.style.borderRadius = '5px';
cameraLockIndicator.style.fontFamily = 'Arial, sans-serif';
cameraLockIndicator.style.fontSize = '16px';
cameraLockIndicator.style.fontWeight = 'bold';
cameraLockIndicator.style.zIndex = '1000';
cameraLockIndicator.style.display = 'none';
cameraLockIndicator.textContent = 'Camera Locked';
document.body.appendChild(cameraLockIndicator);

// Camera position popup
const cameraPopup = document.createElement('div');
cameraPopup.style.position = 'absolute';
cameraPopup.style.top = '50%';
cameraPopup.style.left = '50%';
cameraPopup.style.transform = 'translate(-50%, -50%)';
cameraPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
cameraPopup.style.color = '#0000ff';
cameraPopup.style.padding = '15px 25px';
cameraPopup.style.borderRadius = '8px';
cameraPopup.style.fontFamily = 'Arial, sans-serif';
cameraPopup.style.fontSize = '18px';
cameraPopup.style.fontWeight = 'bold';
cameraPopup.style.zIndex = '1001';
cameraPopup.style.display = 'none';
cameraPopup.style.transition = 'opacity 0.3s ease-in-out';
document.body.appendChild(cameraPopup);

// Function to show camera position popup
function showCameraPopup(message) {
  cameraPopup.textContent = message;
  cameraPopup.style.display = 'block';
  cameraPopup.style.opacity = '1';
  
  setTimeout(() => {
    cameraPopup.style.opacity = '0';
    setTimeout(() => {
      cameraPopup.style.display = 'none';
    }, 300);
  }, 2000);
}

// Keyboard controls
function handleKeyDown(e) {
  if (e.key === 'o') {
    isOrbitEnabled = !isOrbitEnabled;
    cameraLockIndicator.style.display = isOrbitEnabled ? 'none' : 'block';
  }
  if (e.key === 'a') {
    // Strict initial view
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
    showCameraPopup('Camera A');
  }
  if (e.key === 'b') {
    // Strict behind the right hoop
    camera.position.set(15, 5, 15);
    camera.lookAt(15, 3, 0);
    controls.target.set(15, 3, 0);
    controls.update();
    showCameraPopup('Camera B');
  }
  if (e.key === 'c') {
    // Strict behind the left hoop
    camera.position.set(-15, 5, 15);
    camera.lookAt(-15, 3, 0);
    controls.target.set(-15, 3, 0);
    controls.update();
    showCameraPopup('Camera C');
  }
  if (e.key === 'd') {
    // Strict from above
    camera.position.set(0, 30, 0);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
    showCameraPopup('Camera D');
  }
}
document.addEventListener('keydown', handleKeyDown);

// --- Basketball Movement Controls ---
const keysPressed = {};
document.addEventListener('keydown', (e) => {
  keysPressed[e.key.toLowerCase()] = true;
  // Shot power (W/S)
  if (e.key.toLowerCase() === 'w') {
    shotPower = Math.min(1.0, shotPower + SHOT_POWER_STEP);
    updateShotPowerIndicator();
  }
  if (e.key.toLowerCase() === 's') {
    shotPower = Math.max(0.01, shotPower - SHOT_POWER_STEP);
    updateShotPowerIndicator();
  }
  // Reset (R)
  if (e.key.toLowerCase() === 'r') {
    resetBasketballPosition();
  }
  // Shoot (Spacebar)
  if (e.code === 'Space' && !isBallMoving) {
    shootBasketball();
  }
});
document.addEventListener('keyup', (e) => {
  keysPressed[e.key.toLowerCase()] = false;
});

function resetBasketballPosition() {
  ballPosition.x = 0;
  ballPosition.z = 0;
  ballPosition.y = BALL_RADIUS + 0.11;
  ballVelocity.x = 0;
  ballVelocity.y = 0;
  ballVelocity.z = 0;
  isBallMoving = false;
  shotPower = 0.5;
  updateShotPowerIndicator();
  if (basketballGroup) {
    basketballGroup.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
    basketballGroup.rotation.set(0, 0, 0);
  }
}

function updateBasketballPhysics() {
  if (isBallMoving && basketballGroup) {
    // Apply gravity
    ballVelocity.y += GRAVITY;
    // Store previous position for tunneling check
    const prevPos = { x: ballPosition.x, y: ballPosition.y, z: ballPosition.z };
    // Update position
    ballPosition.x += ballVelocity.x;
    ballPosition.y += ballVelocity.y;
    ballPosition.z += ballVelocity.z;

    // --- Rim/Hoop Collision (improved, both sides) ---
    [LEFT_RIM, RIGHT_RIM].forEach(rim => {
      const dx = ballPosition.x - rim.x;
      const dz = ballPosition.z - rim.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      // Rim is a torus: check if ball overlaps the rim ring (outer radius)
      const rimOuter = RIM_RADIUS + BALL_RADIUS * 0.85;
      const rimInner = RIM_RADIUS - BALL_RADIUS * 0.7;
      // Only check if ball is near rim height
      if (
        Math.abs(ballPosition.y - rim.y) < BALL_RADIUS * 1.2 &&
        distXZ < rimOuter &&
        distXZ > rimInner
      ) {
        // Reflect horizontal velocity
        const normX = dx / (distXZ || 1);
        const normZ = dz / (distXZ || 1);
        const dot = ballVelocity.x * normX + ballVelocity.z * normZ;
        ballVelocity.x -= 2 * dot * normX;
        ballVelocity.z -= 2 * dot * normZ;
        // Lose some energy
        ballVelocity.x *= 0.7;
        ballVelocity.z *= 0.7;
        // Nudge ball out of rim
        ballPosition.x = rim.x + normX * (rimOuter + 0.01);
        ballPosition.z = rim.z + normZ * (rimOuter + 0.01);
      }
    });

    // --- Backboard Collision (both sides) ---
    // Backboard planes: x = -15 (left), x = 15 (right), y: 2.2 to 4.6, z: -1.75 to 1.75
    // Ball radius fudge for collision
    const BB_Y_MIN = 2.2, BB_Y_MAX = 4.6, BB_Z_MIN = -1.75, BB_Z_MAX = 1.75;
    // Left backboard
    if (
      ballPosition.x - BALL_RADIUS < -15 &&
      ballPosition.y > BB_Y_MIN && ballPosition.y < BB_Y_MAX &&
      ballPosition.z > BB_Z_MIN && ballPosition.z < BB_Z_MAX
    ) {
      ballPosition.x = -15 + BALL_RADIUS + 0.01;
      ballVelocity.x = Math.abs(ballVelocity.x) * 0.7; // bounce right
    }
    // Right backboard
    if (
      ballPosition.x + BALL_RADIUS > 15 &&
      ballPosition.y > BB_Y_MIN && ballPosition.y < BB_Y_MAX &&
      ballPosition.z > BB_Z_MIN && ballPosition.z < BB_Z_MAX
    ) {
      ballPosition.x = 15 - BALL_RADIUS - 0.01;
      ballVelocity.x = -Math.abs(ballVelocity.x) * 0.7; // bounce left
    }

    // --- Scoring Detection (passes through hoop) ---
    // If ball is moving downward, within rim radius, and just below rim height
    [LEFT_RIM, RIGHT_RIM].forEach(rim => {
      const dx = ballPosition.x - rim.x;
      const dz = ballPosition.z - rim.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      if (
        ballVelocity.y < 0 &&
        Math.abs(ballPosition.y - rim.y) < 0.18 &&
        distXZ < RIM_RADIUS * 0.7 &&
        ballPosition.y < rim.y
      ) {
        lastShotScored = true;
        // Placeholder: visual feedback (to be implemented)
        // e.g., showScoreFeedback('SHOT MADE!');
      }
    });

    // Ground collision
    if (ballPosition.y <= BALL_STOP_HEIGHT) {
      ballPosition.y = BALL_STOP_HEIGHT;
      if (Math.abs(ballVelocity.y) > BALL_STOP_VELOCITY) {
        ballVelocity.y = -ballVelocity.y * BOUNCE_ENERGY_LOSS;
        // Lose energy on bounce
        ballVelocity.x *= BOUNCE_ENERGY_LOSS;
        ballVelocity.z *= BOUNCE_ENERGY_LOSS;
      } else {
        // Stop the ball
        ballVelocity.x = 0;
        ballVelocity.y = 0;
        ballVelocity.z = 0;
        isBallMoving = false;
      }
    }
    // Court boundaries (simple clamp)
    ballPosition.x = Math.max(-COURT_BOUNDS.x, Math.min(COURT_BOUNDS.x, ballPosition.x));
    ballPosition.z = Math.max(-COURT_BOUNDS.z, Math.min(COURT_BOUNDS.z, ballPosition.z));
    // Update mesh
    basketballGroup.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
  }
}

function updateBasketballPosition() {
  // Only allow movement if not in flight (no physics yet)
  if (!isBallMoving && basketballGroup) {
    let moved = false;
    // Arrow keys: left/right/forward/back
    if (keysPressed['arrowleft']) {
      ballPosition.x = Math.max(-COURT_BOUNDS.x, ballPosition.x - 0.2);
      moved = true;
    }
    if (keysPressed['arrowright']) {
      ballPosition.x = Math.min(COURT_BOUNDS.x, ballPosition.x + 0.2);
      moved = true;
    }
    if (keysPressed['arrowup']) {
      ballPosition.z = Math.max(-COURT_BOUNDS.z, ballPosition.z - 0.2);
      moved = true;
    }
    if (keysPressed['arrowdown']) {
      ballPosition.z = Math.min(-COURT_BOUNDS.z, ballPosition.z + 0.2);
      moved = true;
    }
    if (moved) {
      basketballGroup.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
    }
  }
}

// --- Shot Power Indicator UI ---
const shotPowerDiv = document.createElement('div');
shotPowerDiv.style.position = 'absolute';
shotPowerDiv.style.bottom = '30px';
shotPowerDiv.style.right = '30px';
shotPowerDiv.style.background = 'rgba(0,0,0,0.7)';
shotPowerDiv.style.color = '#fff';
shotPowerDiv.style.padding = '10px 20px';
shotPowerDiv.style.borderRadius = '8px';
shotPowerDiv.style.fontFamily = 'Arial, sans-serif';
shotPowerDiv.style.fontSize = '18px';
shotPowerDiv.style.zIndex = '1002';
shotPowerDiv.innerHTML = 'Shot Power: 50%';
document.body.appendChild(shotPowerDiv);

function updateShotPowerIndicator() {
  let percent = Math.round(shotPower * 100);
  if (percent < 1) percent = 1;
  if (percent > 100) percent = 100;
  shotPowerDiv.innerHTML = `Shot Power: ${percent}%`;
}

// --- Ball Rotation Animation ---
function updateBasketballRotation() {
  if (!basketballGroup) return;
  // Calculate velocity vector (use difference in position for smoothness)
  const dx = ballPosition.x - prevBallPosition.x;
  const dy = ballPosition.y - prevBallPosition.y;
  const dz = ballPosition.z - prevBallPosition.z;
  const velocity = new THREE.Vector3(dx, dy, dz);
  const speed = velocity.length();
  // Only rotate if ball is moving (in air or rolling)
  if (isBallMoving && speed > 0.00001) {
    // Axis is perpendicular to velocity and up (Y) direction
    const up = new THREE.Vector3(0, 1, 0);
    let axis = new THREE.Vector3().crossVectors(velocity, up);
    if (axis.lengthSq() < 0.0001) axis.set(1, 0, 0); // fallback
    axis.normalize();
    // Smoothly interpolate axis for smooth transitions
    ballRotationAxis.lerp(axis, 0.2);
    // Rotation speed proportional to velocity (tune factor for realism)
    const ROTATION_FACTOR = 6.0 / BALL_RADIUS; // much more visible spin
    let targetSpeed = speed * ROTATION_FACTOR;
    // Ensure a minimum visible spin when moving
    if (targetSpeed < 0.03) targetSpeed = 0.03;
    // Smoothly interpolate speed
    ballRotationSpeed += (targetSpeed - ballRotationSpeed) * 0.2;
    // Apply rotation
    basketballGroup.rotateOnAxis(ballRotationAxis, ballRotationSpeed);
  } else {
    // Gradually slow down rotation when stopped
    ballRotationSpeed *= 0.85;
    if (ballRotationSpeed > 0.001) {
      basketballGroup.rotateOnAxis(ballRotationAxis, ballRotationSpeed);
    }
  }
  // Store current position for next frame
  prevBallPosition.x = ballPosition.x;
  prevBallPosition.y = ballPosition.y;
  prevBallPosition.z = ballPosition.z;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();
  updateBasketballPosition(); // NEW: handle movement
  updateBasketballPhysics(); // NEW: handle shooting physics
  updateBasketballRotation(); // NEW: handle ball rotation
  // Update arc outline visibility if hooks exist
  if (window._arcOutlineVisibilityHooks) {
    for (const fn of window._arcOutlineVisibilityHooks) fn();
  }
  renderer.render(scene, camera);
}
animate();

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Global timer update
setInterval(() => {
  if (remainingSeconds > 0) {
    remainingSeconds--;
    if (typeof updateScoreboardTimer === 'function') updateScoreboardTimer();
  }
}, 1000);

function getNearestHoopPosition() {
  // Two hoops at x = -15 and x = 15, y = 3.05, z = 0
  // Return the one closest to the ball
  const leftHoop = { x: -15 + 0.55, y: 3.05, z: 0 }; // rim center (offset for rim)
  const rightHoop = { x: 15 - 0.55, y: 3.05, z: 0 };
  const distLeft = Math.abs(ballPosition.x - leftHoop.x);
  const distRight = Math.abs(ballPosition.x - rightHoop.x);
  return distLeft < distRight ? leftHoop : rightHoop;
}

// function shootBasketball() {
//   const hoop = getNearestHoopPosition();
//   // Direction vector from ball to hoop
//   const dx = hoop.x - ballPosition.x;
//   const dz = hoop.z - ballPosition.z;
//   const dy = hoop.y - ballPosition.y;
//   // Horizontal distance
//   const dist = Math.sqrt(dx * dx + dz * dz);
//   // Angle: give a much higher arc
//   const angle = Math.atan2(dy + 6.0, dist); // much higher arc
//   // Power scaling (stronger)
//   const power = 0.022 + 0.07 * shotPower;
//   // Initial velocity components
//   const v = power * (dist + 8);
//   ballVelocity.x = (dx / dist) * v * Math.cos(angle);
//   ballVelocity.z = (dz / dist) * v * Math.cos(angle);
//   ballVelocity.y = v * Math.sin(angle);
//   isBallMoving = true;
// }

function shootBasketball() {
  const hoop = getNearestHoopPosition();
  const dx = hoop.x - ballPosition.x;
  const dz = hoop.z - ballPosition.z;
  const dy = hoop.y - ballPosition.y;

  // Map shotPower (0.01 to 1.0) to apex and time scale
  const minApex = hoop.y + 2.5;
  const maxApex = hoop.y + 8;
  const apexY = minApex + (maxApex - minApex) * shotPower;

  // Time scaling: weak shots take longer, strong shots are faster
  const minTimeScale = 1.2; // slowest
  const maxTimeScale = 0.4; // fastest
  const timeScale = minTimeScale + (maxTimeScale - minTimeScale) * shotPower;

  // Time to climb from current y to apex
  const tUp   = Math.sqrt( 2 * (apexY - ballPosition.y) / -GRAVITY );
  // Time from apex down to hoop height
  const tDown = Math.sqrt( 2 * (apexY - hoop.y)     / -GRAVITY );
  const totalTime = (tUp + tDown) * timeScale;

  // Uniform horizontal velocity to cover dx, dz in totalTime
  ballVelocity.x = dx / totalTime;
  ballVelocity.z = dz / totalTime;
  // Initial vertical velocity (upwards)
  ballVelocity.y = -GRAVITY * tUp;

  isBallMoving = true;
}
