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

// --- Scene Creation Functions ---

function createFloor() {
  const floorTexture = loader.load('src/textures/wood_floor.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(8, 5); // More repeats for larger floor
  const courtMaterial = new THREE.MeshPhongMaterial({ map: floorTexture, shininess: 10 });
  // Expanded floor
  const floorGeometry = new THREE.BoxGeometry(60, 0.2, 50);
  const floor = new THREE.Mesh(floorGeometry, courtMaterial);
  floor.receiveShadow = true;
  scene.add(floor);

  // Add white edge lines for the 30x15 court boundary
  const edgeLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const y = 0.11; // Slightly above the floor
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
    new THREE.Vector3(0, 0.11, -7.5),
    new THREE.Vector3(0, 0.11, 7.5)
  ]);
  scene.add(new THREE.Line(centerLineGeometry, lineMaterial));
  // Center circle
  const circlePoints = [];
  const radius = 2;
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(radius * Math.cos(theta), 0.11, radius * Math.sin(theta)));
  }
  scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePoints), lineMaterial));
  // Three-point arcs
  drawArc(-15, lineMaterial);
  drawArc(15, lineMaterial);
  // Key area and lights
  createKeyArea();
  addAdvancedLights();
  createFreeThrowLines();
}


function createFreeThrowLines() {
  const y = 0.11;          // same height as your other court lines
  const lineMat = new THREE.LineBasicMaterial({
    color:       0xffffff,
    depthTest:   false,    // draw on top of the key mesh
  });
  const arcRadius       = 1.8;   // match createKeyArea's circleRadius
  const halfLineWidth   = 1.8;   // free-throw line is 12 ft ≈ 1.8 units here
  const segments        = 32;
  
  [ -1, 1 ].forEach(side => {
    const x0 = side * (15 - 5);   // same x as your key's "top of the key"

    // straight segment
    const segPts = [
      new THREE.Vector3(x0, y, -halfLineWidth),
      new THREE.Vector3(x0, y,  halfLineWidth)
    ];
    const seg = new THREE.Line(new THREE.BufferGeometry().setFromPoints(segPts), lineMat);
    seg.renderOrder = 10;
    scene.add(seg);

    // semicircle arc facing center
    const arcPts = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI;
      const dx = arcRadius * Math.sin(t) * (side < 0 ? +1 : -1);
      const dz = arcRadius * Math.cos(t);
      arcPts.push(new THREE.Vector3(x0 + dx, y, dz));
    }
    const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), lineMat);
    arc.renderOrder = 10;
    scene.add(arc);
  });
}


function drawArc(xCenter, material) {
  const pts = [];
  const threePointRadius = 7;
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI;
    const x = xCenter + (xCenter < 0 ? 1 : -1) * threePointRadius * Math.sin(theta);
    const z = threePointRadius * Math.cos(theta);
    pts.push(new THREE.Vector3(x, 0.11, z));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material));
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
      new THREE.Vector3(innerX, 0.11, -laneWidth/2),
      new THREE.Vector3(outerX, 0.11, -laneWidth/2),
      new THREE.Vector3(outerX, 0.11,  laneWidth/2),
      new THREE.Vector3(innerX, 0.11,  laneWidth/2),
      new THREE.Vector3(innerX, 0.11, -laneWidth/2)
    ];
    const outline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(outlinePts),
      lineMat
    );
    scene.add(outline);

    // --- 3) white free-throw semicircle ---
    const shape    = new THREE.Shape();
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI;
      const x = innerX - side * (circleRadius * Math.sin(t));
      const z = circleRadius * Math.cos(t);
      i === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z);
    }
    shape.lineTo(innerX, 0);

    const arcMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     0.6,
        side:        THREE.DoubleSide
      })
    );
    arcMesh.rotation.x = -Math.PI / 2;
    scene.add(arcMesh);
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

  // === Base/Floor Beneath Pole ===
  const baseGeo = new THREE.BoxGeometry(1.2, 0.2, 1.2);
  const baseMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(actualPoleX, 0.1, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

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


function createBasketball() {
  const ballRadius = 0.5;

  // 1) Load only the diffuse leather texture
  const ballTexture = loader.load('src/textures/basketball.png');
  ballTexture.wrapS = ballTexture.wrapT = THREE.ClampToEdgeWrapping;
  ballTexture.repeat.set(1, 1);
  // ensure correct color space
  ballTexture.encoding = THREE.sRGBEncoding;

  // 2) Simple Phong material with that texture only
  const ballMaterial = new THREE.MeshPhongMaterial({
    map:        ballTexture,
    shininess:  50
  });

  // 3) Create and add the basketball mesh
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const basketball   = new THREE.Mesh(ballGeometry, ballMaterial);
  basketball.position.set(0, ballRadius + 0.11, 0);
  basketball.castShadow    = true;
  basketball.receiveShadow = true;
  scene.add(basketball);

  // 4) Draw the black seams using TubeGeometry
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const segs    = 64;
  const offset  = ballRadius + 0.002;

  function makeSeamCircle(plane) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      let x = 0, y = 0, z = 0;
      if (plane === 'XZ') {
        x = offset * Math.cos(t);
        z = offset * Math.sin(t);
      } else { // 'YZ'
        y = offset * Math.cos(t);
        z = offset * Math.sin(t);
      }
      pts.push(new THREE.Vector3(x, y, z));
    }
    const curve   = new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.008, 12, true);
    return new THREE.Mesh(tubeGeo, seamMat);
  }

  // equator seam
  basketball.add(makeSeamCircle('XZ'));
  // two meridian seams
  const mer1 = makeSeamCircle('YZ');
  mer1.rotation.y = Math.PI / 2;
  basketball.add(mer1);
  const mer2 = makeSeamCircle('YZ');
  mer2.rotation.y = -Math.PI / 2;
  basketball.add(mer2);
  // two angled seams at ±45°
  const s1 = makeSeamCircle('XZ');
  s1.rotation.x = Math.PI / 4;
  basketball.add(s1);
  const s2 = makeSeamCircle('XZ');
  s2.rotation.x = -Math.PI / 4;
  basketball.add(s2);
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

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();
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
