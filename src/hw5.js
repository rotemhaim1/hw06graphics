// Import orbit camera controls
import { OrbitControls } from './OrbitControls.js';

// Load textures for the scene
const loader = new THREE.TextureLoader();

// Set up scene
const scene = new THREE.Scene();

// 🌟 Trail arrays – שובל מרכזי, שמאלי וימני
const trailMain = [];
const trailLeft = [];
const trailRight = [];
const maxTrailLength = 25;

// 🔥 יצירת גיאומטריות וחומרים לקווים
const trailGeometryMain = new THREE.BufferGeometry();
const trailGeometryLeft = new THREE.BufferGeometry();
const trailGeometryRight = new THREE.BufferGeometry();

const trailMaterialMain = new THREE.LineBasicMaterial({
  color: 0xff9900,          // כתום עמוק
  transparent: true,
  opacity: 0.7,
  depthWrite: false
});

const trailMaterialLeft = new THREE.LineBasicMaterial({
  color: 0xffcc66,          // זהוב בהיר
  transparent: true,
  opacity: 0.4,
  depthWrite: false
});

const trailMaterialRight = new THREE.LineBasicMaterial({
  color: 0xffcc66,          // גם זהוב
  transparent: true,
  opacity: 0.4,
  depthWrite: false
});

// 🎯 יצירת קווים
const trailLineMain = new THREE.Line(trailGeometryMain, trailMaterialMain);
const trailLineLeft = new THREE.Line(trailGeometryLeft, trailMaterialLeft);
const trailLineRight = new THREE.Line(trailGeometryRight, trailMaterialRight);

scene.add(trailLineMain);
scene.add(trailLineLeft);
scene.add(trailLineRight);


let basketball = null; 
let moveLeft = false;
let moveRight = false;
let moveForward = false;
let moveBackward = false;

const realHoops = [];
const movementSpeed = 0.2;

let shotPower = 0.5;
const minPower = 0.0;
const maxPower = 1.0;
const powerStep = 0.05;

let shotsAttempted = 0;
let shotsScored = 0;
let score = 0;

const cheerSound = new Audio('src/sounds/cheer.wav');
const booSound = new Audio('src/sounds/boo.wav');
const basketballsound = new Audio('src/sounds/basketball.wav');

const collisionHoopSpheres = [];
let currentTargetHoop = null;
let shotHoopCenter = null;


let isShooting = false;
let velocity = new THREE.Vector3(); // מהירות הכדור (vx, vy, vz)
const gravity = -9.8;
const timeStep = 1 / 60; // פריים ב-60FPS

const rimRight = new THREE.Vector3(15, 3.05, 0);   // הסל הימני
const rimLeft  = new THREE.Vector3(-15, 3.05, 0);  // הסל השמאלי

const fireworks = [];
const clock = new THREE.Clock();


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

// Set background color to black
scene.background = new THREE.Color(0x000000);

// Add ambient light (soft overall lighting)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light (acts like a sun)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Enable shadow rendering
renderer.shadowMap.enabled = true;

// Timer variables for the scoreboard
let timerMesh = null;
let remainingSeconds = 600; // 10 minutes = 600 seconds

// Create the basketball court
function createBasketballCourt() {
  // Load wood floor texture from textures folder
  const floorTexture = loader.load('src/textures/ww.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(4, 2); // Repeat texture for visual realism

  // Create material with texture and slight shininess
  const courtMaterial = new THREE.MeshPhongMaterial({
    map: floorTexture,
    shininess: 10,
  });

  // Create floor geometry (30 x 0.2 x 15 units)
  const courtGeometry = new THREE.BoxGeometry(30, 0.2, 15);
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  court.castShadow = false;
  scene.add(court);

  // Add all key elements to the court
  createCourtLines();
  createBasketball();
  createScoreboard();
  createBleachers();
}

// Create all court lines, hoops, and key areas
function createCourtLines() {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Mid-court line (center line across Z axis)
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.11, -7.5),
    new THREE.Vector3(0, 0.11, 7.5),
  ]);
  const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
  scene.add(centerLine);

  // Center circle
  const circlePoints = [];
  const radius = 2;
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    circlePoints.push(new THREE.Vector3(x, 0.11, z));
  }

  const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
  const circle = new THREE.LineLoop(circleGeometry, lineMaterial);
  scene.add(circle);

  // Three-point arcs
  const threePointRadius = 7;
  const arcSegments = 64;
  const courtLength = 30;

  // Left side arc
  const arcPoints1 = [];
  for (let i = 0; i <= arcSegments; i++) {
    const theta = Math.PI - (i / arcSegments) * Math.PI; // π → 0
    const z = threePointRadius * Math.cos(theta);
    const x = -courtLength / 2 + threePointRadius * Math.sin(theta);
    arcPoints1.push(new THREE.Vector3(x, 0.11, z));
  }
  const arcGeometry1 = new THREE.BufferGeometry().setFromPoints(arcPoints1);
  const arc1 = new THREE.Line(arcGeometry1, lineMaterial);
  scene.add(arc1);

  // Right side arc
  const arcPoints2 = [];
  for (let i = 0; i <= arcSegments; i++) {
    const theta = (i / arcSegments) * Math.PI; // 0 → π
    const z = threePointRadius * Math.cos(theta);
    const x = courtLength / 2 - threePointRadius * Math.sin(theta);
    arcPoints2.push(new THREE.Vector3(x, 0.11, z));
  }
  const arcGeometry2 = new THREE.BufferGeometry().setFromPoints(arcPoints2);
  const arc2 = new THREE.Line(arcGeometry2, lineMaterial);
  scene.add(arc2);

  // Court boundary rectangle
  const courtOutlinePoints = [
    new THREE.Vector3(-15, 0.11, -7.5), // bottom-left
    new THREE.Vector3(-15, 0.11, 7.5),  // top-left
    new THREE.Vector3(15, 0.11, 7.5),   // top-right
    new THREE.Vector3(15, 0.11, -7.5),  // bottom-right
    new THREE.Vector3(-15, 0.11, -7.5), // back to start
  ];
  const courtOutlineGeometry = new THREE.BufferGeometry().setFromPoints(courtOutlinePoints);
  const courtOutline = new THREE.Line(courtOutlineGeometry, lineMaterial);
  scene.add(courtOutline);

  // Add hoops, key area, and advanced lighting
  createHoop(-15); // Left side
  createHoop(15);  // Right side
  createKeyArea();
  addAdvancedLights();
}


// Add additional light sources for enhanced lighting effects
function addAdvancedLights() {
  // SpotLight on the left hoop
  const spotLeft = new THREE.SpotLight(0xffddaa, 0.5); // warm tone
  spotLeft.position.set(-13, 8, 0); // above-left
  spotLeft.target.position.set(-15, 3, 0); // aiming at the left hoop
  spotLeft.angle = Math.PI / 8; // narrow cone
  spotLeft.penumbra = 0.4; // softer edges
  spotLeft.castShadow = true;
  scene.add(spotLeft);
  scene.add(spotLeft.target);

  // SpotLight on the right hoop
  const spotRight = new THREE.SpotLight(0xffddaa, 0.5); // same warm tone
  spotRight.position.set(13, 8, 0); // above-right
  spotRight.target.position.set(15, 3, 0); // aiming at the right hoop
  spotRight.angle = Math.PI / 8;
  spotRight.penumbra = 0.4;
  spotRight.castShadow = true;
  scene.add(spotRight);
  scene.add(spotRight.target);

  // Soft ambient hemisphere light (sky + ground blend)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.2);
  scene.add(hemi);

  // SpotLight above the center of the court
  const centerSpot = new THREE.SpotLight(0xffffff, 0.2);
  centerSpot.position.set(0, 12, 0); // top center
  centerSpot.target.position.set(0, 0, 0); // pointing downward
  centerSpot.angle = Math.PI / 9;
  centerSpot.penumbra = 0.3;
  centerSpot.castShadow = true;
  scene.add(centerSpot);
  scene.add(centerSpot.target);

}


// Draws the key area (painted area under each basket) including:
// - White outline
// - Red filled rectangle
// - White semi-circle in front of each key
function createKeyArea() {
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Red fill for the key
  const fillMatRed = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    transparent: true, 
    opacity: 0.5,
    side: THREE.DoubleSide 
  });

  // White fill for the semi-circle (free throw area)
  const fillMatWhite = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide 
  });

  // Dimensions
  const halfCourtX   = 15;
  const laneWidthZ   = 4.6;
  const laneDepthX   = 5;
  const circleRadius = 1.8;
  const segments     = 32;

  // Create mirrored elements for both sides of the court
  [ -1, +1 ].forEach(side => {
    const innerX = side * (halfCourtX - laneDepthX); // near the center
    const outerX = side * halfCourtX;                // edge of court
    const leftZ  = -laneWidthZ / 2;
    const rightZ = laneWidthZ / 2;

    // White rectangle outline
    const boxPts = [
      new THREE.Vector3(innerX, 0.11, leftZ),
      new THREE.Vector3(outerX, 0.11, leftZ),
      new THREE.Vector3(outerX, 0.11, rightZ),
      new THREE.Vector3(innerX, 0.11, rightZ),
      new THREE.Vector3(innerX, 0.11, leftZ),
    ];
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(boxPts),
      lineMat
    ));

    // Red filled rectangle inside the key
    const rectWidth = laneDepthX;
    const rectDepth = laneWidthZ;
    const rectGeometry = new THREE.PlaneGeometry(rectWidth, rectDepth);
    const rectangle = new THREE.Mesh(rectGeometry, fillMatRed);
    const midX = (innerX + outerX) / 2;
    rectangle.rotation.x = -Math.PI / 2;
    rectangle.position.set(midX, 0.101, 0);
    scene.add(rectangle);

    // White filled semi-circle in front of the key (free throw arc)
    const shape = new THREE.Shape();
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI;
      const x = innerX - side * (circleRadius * Math.sin(t));
      const z = circleRadius * Math.cos(t);
      if (i === 0) {
        shape.moveTo(x, z);
      } else {
        shape.lineTo(x, z);
      }
    }
    shape.lineTo(innerX, 0);
    shape.lineTo(innerX - side * (circleRadius * Math.sin(0)), circleRadius);

    const geometry = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geometry, fillMatWhite);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.101, 0);
    scene.add(mesh);
  });
}


// Create all elements
createBasketballCourt();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);


// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

const feedbackElement = document.createElement('div');
feedbackElement.style.position = 'absolute';
feedbackElement.style.bottom = '100px';
feedbackElement.style.left = '50%';
feedbackElement.style.transform = 'translate(-50%, -50%)';
feedbackElement.style.padding = '10px 20px';
feedbackElement.style.fontSize = '30px';
feedbackElement.style.fontWeight = 'bold';
feedbackElement.style.color = 'white';
feedbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
feedbackElement.style.borderRadius = '8px';
feedbackElement.style.display = 'none';
feedbackElement.style.zIndex = '9999';
feedbackElement.style.fontFamily = 'Arial, sans-serif';

document.body.appendChild(feedbackElement);

// === Instructions Display (Bottom-Left Corner) ===
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '20px';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '16px';
instructionsElement.style.fontFamily = 'Arial, sans-serif';
instructionsElement.style.textAlign = 'left';
instructionsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
instructionsElement.style.padding = '10px';
instructionsElement.style.border = '1px solid white';
instructionsElement.style.borderRadius = '6px';
instructionsElement.innerHTML = `
  <h3 style="margin: 0 0 5px 0;">Controls:</h3>
  <p style="margin: 0;">O – Toggle Orbit Camera</p>
`;
document.body.appendChild(instructionsElement);

// === Score, Power & Stats Display ===

// === Box 1: Score & Power (Top-Right) ===
const infoBoxTopRight = document.createElement('div');
infoBoxTopRight.style.position = 'absolute';
infoBoxTopRight.style.top = '20px';
infoBoxTopRight.style.right = '20px';
infoBoxTopRight.style.zIndex = '9999';
infoBoxTopRight.style.padding = '10px';
infoBoxTopRight.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
infoBoxTopRight.style.border = '1px solid white';
infoBoxTopRight.style.fontSize = '16px';
infoBoxTopRight.style.color = 'white';
infoBoxTopRight.style.fontFamily = 'Arial, sans-serif';
infoBoxTopRight.style.display = 'flex';
infoBoxTopRight.style.flexDirection = 'column';
infoBoxTopRight.style.gap = '6px';
infoBoxTopRight.style.alignItems = 'flex-start';
infoBoxTopRight.style.textAlign = 'left';

const scoreElement = document.createElement('div');
scoreElement.id = "score";
scoreElement.innerText = 'Score: 0';

const powerElement = document.createElement('div');
powerElement.id = "power";
powerElement.innerText = `Power: ${Math.round(shotPower * 100)}%`;

infoBoxTopRight.appendChild(scoreElement);
infoBoxTopRight.appendChild(powerElement);
document.body.appendChild(infoBoxTopRight);

// === Box 2: Stats (Top-Center) ===
const statsBox = document.createElement('div');
statsBox.style.position = 'absolute';
statsBox.style.top = '20px';
statsBox.style.left = '50%';
statsBox.style.transform = 'translateX(-50%)';
statsBox.style.zIndex = '9999';
statsBox.style.padding = '10px';
statsBox.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
statsBox.style.border = '1px solid white';
statsBox.style.fontSize = '16px';
statsBox.style.color = 'white';
statsBox.style.fontFamily = 'Arial, sans-serif';
statsBox.style.textAlign = 'center';

const statsElement = document.createElement('div');
statsElement.id = "stats";
statsElement.innerHTML = `
  Shots: 0<br>
  Hits: 0<br>
  Accuracy: 0.0%
`;

statsBox.appendChild(statsElement);
document.body.appendChild(statsBox);



// Handle keyboard input for camera control and orbit toggle
function handleKeyDown(e) {
  // Toggle orbit controls with "o"
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }

  // Camera preset views (1–4)

  // Top-down view (bird’s eye)
  if (e.key === "1") {
    camera.position.set(0, 30, 0);
    camera.lookAt(0, 0, 0);
  }

  // Behind scoreboard view
  if (e.key === "2") {
    camera.position.set(0, 5, -25);
    camera.lookAt(0, 5, 0);
  }

  // Classic default viewing angle
  if (e.key === "3") {
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
  }

  // Side view (from sidelines)
  if (e.key === "4") {
    camera.position.set(25, 5, 0);
    camera.lookAt(0, 0, 0);
  }
  
}

// תנועה עם חצים
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowLeft': moveLeft = true; break;
    case 'ArrowRight': moveRight = true; break;
    case 'ArrowUp': moveForward = true; break;
    case 'ArrowDown': moveBackward = true; break;

    case 'w':
    case 'W':
      shotPower = Math.min(maxPower, shotPower + powerStep);
      updatePowerDisplay();
      break;

    case 's':
    case 'S':
      shotPower = Math.max(minPower, shotPower - powerStep);
      updatePowerDisplay();
      break;

    case ' ':
      if (!isShooting) shootBall();
      break;

    case 'r':
    case 'R':
      if (basketball) {
        basketball.position.set(0, 0.5, 0);  // מרכז המגרש
        velocity.set(0, 0, 0);              // איפוס מהירות
        isShooting = false;                 // ביטול מצב זריקה
        shotPower = 0.5;                    // עוצמה ברירת מחדל
        updatePowerDisplay();               // עדכון ה־UI
        showFeedbackMessage("Ball reset");  
      }
      break;
  }
});


document.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'ArrowLeft': moveLeft = false; break;
    case 'ArrowRight': moveRight = false; break;
    case 'ArrowUp': moveForward = false; break;
    case 'ArrowDown': moveBackward = false; break;
  }
});




// Creates a complete basketball hoop at the given X position (left or right)
function createHoop(xPosition) {
  const direction = xPosition === 15 ? 1 : -1;

  // === Transparent Backboard ===
  const backboardGeometry = new THREE.BoxGeometry(0.05, 1.8, 3.5);
  const backboardMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    depthWrite: true
  });
  const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
  const actualBoardX = xPosition;
  backboard.position.set(actualBoardX, 3.7, 0);
  backboard.renderOrder = 0;
  backboard.castShadow = true;
  scene.add(backboard);


  // === Draw rectangle outlines on backboard ===
  function createRectangleMesh(width, height, offsetX, lineWidth = 0.05) {
    const group = new THREE.Group();
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const top = new THREE.Mesh(new THREE.BoxGeometry(lineWidth, lineWidth, width + 0.05), lineMaterial);
    top.position.set(offsetX, height / 2, 0);
    group.add(top);

    const bottom = top.clone();
    bottom.position.set(offsetX, -height / 2, 0);
    group.add(bottom);

    const left = new THREE.Mesh(new THREE.BoxGeometry(lineWidth, height, lineWidth), lineMaterial);
    left.position.set(offsetX, 0, -width / 2);
    group.add(left);

    const right = left.clone();
    right.position.set(offsetX, 0, width / 2);
    group.add(right);

    return group;
  }

  const outlineRect = createRectangleMesh(3.55, 1.8, 0);
  const innerRect = createRectangleMesh(1.4, 0.8, 0);
  innerRect.position.y = -0.2;

  outlineRect.translateX(0.03);
  innerRect.translateX(0.031);

  outlineRect.position.set(actualBoardX + 0.03, 3.7, 0.001);
  innerRect.position.set(actualBoardX + 0.031, 3.5, 0.001);

  scene.add(outlineRect, innerRect);

  // === Orange Rim ===
  const rimOffset = 0.55;
  const actualRimX = xPosition + direction * -rimOffset;
  const rimGeometry = new THREE.TorusGeometry(0.5, 0.04, 16, 100);
  const rimMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6600,
    transparent: false,
    opacity: 0.8,
    depthWrite: true,
    depthTest: true
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(actualRimX, 3.05, 0);
  rim.castShadow = true;
  rim.receiveShadow = true;
  rim.renderOrder = 2;
  scene.add(rim);
  realHoops.push(rim);


  // === Metal Chain Net (curved) ===
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
  const netGroup = new THREE.Group();
  const rimRadius = 0.5;
  const netHeight = 0.8;
  const numStrings = 20;
  const innerRadius = 0.25;

  for (let i = 0; i < numStrings; i++) {
    const angle = (i / numStrings) * Math.PI * 2;
    const x1 = rimRadius * Math.cos(angle);
    const z1 = rimRadius * Math.sin(angle);
    const x2 = innerRadius * Math.cos(angle);
    const z2 = innerRadius * Math.sin(angle);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const midY = -netHeight * 0.4;

    const points = [
      new THREE.Vector3(x1, 0, z1),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(x2, -netHeight, z2)
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(10);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const line = new THREE.Line(geometry, netMaterial);
    netGroup.add(line);
  }

  const netOffset = 0.55;
  const actualNetX = xPosition === 15 ? xPosition - netOffset : xPosition + netOffset;
  netGroup.position.set(actualNetX, 3.05, 0);
  scene.add(netGroup);

  // === Support Pole Behind Backboard ===
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 16);
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  const actualPoleX = xPosition === 15 ? xPosition + 0.8 : xPosition - 0.8;
  pole.position.set(actualPoleX, 1.5, 0);
  pole.castShadow = true;
  scene.add(pole);

  // === Diagonal Arm Between Pole and Backboard ===
  const armLength = Math.abs(actualPoleX - actualBoardX);
  const armGeometry = new THREE.BoxGeometry(armLength, 0.05, 0.05);
  const armMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const arm = new THREE.Mesh(armGeometry, armMaterial);
  const armX = (actualBoardX + actualPoleX) / 2;
  const armY = 3.3;
  arm.position.set(armX, armY, 0);
  arm.rotation.z = direction * -Math.PI / 12;
  arm.castShadow = true;
  scene.add(arm);

  // === Add logo based on hoop side ===
  if (xPosition === 15) {
    addLogoRight(backboard);
  } else {
    addLogoLeft(backboard);
  }

  createHoopCollisionSpheres(xPosition);

}


function createHoopCollisionSpheres(xPosition) {
  const rimY = 3.05;
  const rimRadius = 0.5;     // כמו בטבעת שלך
  const ballRadius = 0.04;
  const segments = 45;       // לפי החישוב שלנו

  const direction = xPosition === 15 ? 1 : -1;
  const centerX = xPosition + direction * -0.55; // כמו הטבעת עצמה
  const centerZ = 0;
 
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.0  // או כל ערך בין 0 (שקוף לגמרי) ל־1 (אטום)
  });// ירוק

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = centerX + rimRadius * Math.cos(angle);
    const z = centerZ + rimRadius * Math.sin(angle);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 16, 16),
      material
    );

    sphere.position.set(x, rimY, z);
    sphere.castShadow = true;
    scene.add(sphere);
    collisionHoopSpheres.push(sphere);
  }
  
}


// Adds a logo text (default: "MB") to the LEFT side backboard
function addLogoLeft(backboard, text = "MB") {
  const loader = new THREE.FontLoader();

  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    // Create 3D text geometry
    const textGeometry = new THREE.TextGeometry(text, {
      font: font,
      size: 0.3,
      height: 0.05,
      curveSegments: 12,
    });

    // White flat text material
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Rotate to face the camera
    textMesh.rotation.y = Math.PI / 2;

    // Position it slightly above center and forward
    textMesh.position.set(0, 0.3, 0.25);

    // Attach to the backboard
    backboard.add(textMesh);
  });
}

// Adds a mirrored logo text (default: "MB") to the RIGHT side backboard
function addLogoRight(backboard, text = "MB") {
  const loader = new THREE.FontLoader();

  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    // Create 3D text geometry
    const textGeometry = new THREE.TextGeometry(text, {
      font: font,
      size: 0.3,
      height: 0.05,
      curveSegments: 12,
    });

    // Mirror the text around the Z-axis
    textGeometry.scale(1, 1, -1);

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Rotate to face the camera from the other side
    textMesh.rotation.y = -Math.PI / 2;

    // Position it slightly above center and forward
    textMesh.position.set(0, 0.3, -0.2);

    // Attach to the backboard
    backboard.add(textMesh);
  });
}

function createBleachers() {
  const bleacherMaterial = new THREE.MeshPhongMaterial({ color: 0x990000 }); // חומר בצבע אדום כהה
  const heights = 5;            // מספר המדרגות בכל צד
  const startY = 0.25;          // גובה המדרגה הראשונה

  const courtWidth = 15;        // רוחב המגרש (בציר Z)
  const courtLength = 30;       // אורך המגרש (בציר X)

  for (let i = 0; i < heights; i++) {
    const height = 0.5;         // גובה כל מדרגה
    const y = startY + i * height;  // מיקום Y של כל מדרגה
    const stepDepth = 1.5;      // עומק מדרגה
    const stepWidth = courtLength + 6 - i * 2; // המדרגות הולכות וצרות

    const boxGeometryFrontBack = new THREE.BoxGeometry(stepWidth, height, stepDepth); // קידמי/אחורי
    const boxGeometrySides = new THREE.BoxGeometry(stepDepth, height, courtWidth + 6 - i * 2); // צדדים

    // FRONT (Z חיובי)
    const front = new THREE.Mesh(boxGeometryFrontBack, bleacherMaterial);
    front.castShadow = true;
    front.receiveShadow = true;
    front.position.set(0, y, courtWidth / 2 + stepDepth / 2 + i + 1);
    scene.add(front);

    // BACK (Z שלילי)
    const back = new THREE.Mesh(boxGeometryFrontBack, bleacherMaterial);
    back.castShadow = true;
    back.receiveShadow = true;
    back.position.set(0, y, -courtWidth / 2 - stepDepth / 2 - i - 1);
    scene.add(back);

    // LEFT (X שלילי)
    const left = new THREE.Mesh(boxGeometrySides, bleacherMaterial);
    left.castShadow = true;
    left.receiveShadow = true;
    left.position.set(-courtLength / 2 - stepDepth / 2 - i - 1, y, 0);
    scene.add(left);

    // RIGHT (X חיובי)
    const right = new THREE.Mesh(boxGeometrySides, bleacherMaterial);
    right.castShadow = true;
    right.receiveShadow = true;
    right.position.set(courtLength / 2 + stepDepth / 2 + i + 1, y, 0);
    scene.add(right);
  }
}

// Converts a time in seconds to a string formatted as MM:SS
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60); // Calculate full minutes
  const secs = seconds % 60;               // Get remaining seconds after full minutes
  // Pad with zero if needed and return as "MM:SS"
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


// Creates a scoreboard with static scores and a live countdown timer
function createScoreboard() {
  // Create the main scoreboard box
  const boardGeometry = new THREE.BoxGeometry(10, 3.2, 0.2); // Width, height, depth
  const boardMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 }); // Dark grey
  const scoreboard = new THREE.Mesh(boardGeometry, boardMaterial);

  // Position the scoreboard high and behind the court
  scoreboard.position.set(0, 8, -15);
  scoreboard.rotation.y = 0;
  scene.add(scoreboard);

  // Load font for text on scoreboard
  const loader = new THREE.FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {

    // --- Score Text ---
    const scoreTextGeometry = new THREE.TextGeometry('HOME : 0   AWAY : 0', {
      font: font,
      size: 0.75,
      height: 0.04,
      curveSegments: 10,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White text
    const scoreTextMesh = new THREE.Mesh(scoreTextGeometry, textMaterial);

    // Center the score text on the scoreboard
    scoreTextGeometry.computeBoundingBox();
    const textWidth = scoreTextGeometry.boundingBox.max.x - scoreTextGeometry.boundingBox.min.x;
    scoreTextMesh.position.set(-textWidth / 2, 0, 0.11);
    scoreboard.add(scoreTextMesh);

    // --- Timer Text ---
    const timerText = formatTime(remainingSeconds); // Format initial time as MM:SS
    const timerGeometry = new THREE.TextGeometry(timerText, {
      font: font,
      size: 0.75,
      height: 0.05,
      curveSegments: 10,
    });

    const timerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White text
    timerMesh = new THREE.Mesh(timerGeometry, timerMaterial);

    // Center the timer text below the score
    timerGeometry.computeBoundingBox();
    const timerWidth = timerGeometry.boundingBox.max.x - timerGeometry.boundingBox.min.x;
    timerMesh.position.set(-timerWidth / 2, -1.3, 0.11);
    scoreboard.add(timerMesh);

    // --- Timer Countdown ---
    // Update the timer text every second
    setInterval(() => {
      if (remainingSeconds > 0 && timerMesh) {
        remainingSeconds--;
        const newText = formatTime(remainingSeconds);

        const newGeometry = new THREE.TextGeometry(newText, {
          font: font,
          size: 0.75,
          height: 0.05,
          curveSegments: 10,
        });

        newGeometry.computeBoundingBox();
        const newWidth = newGeometry.boundingBox.max.x - newGeometry.boundingBox.min.x;

        // Replace the timer geometry with the new one
        timerMesh.geometry.dispose(); // Free old geometry memory
        timerMesh.geometry = newGeometry;

        // Center the updated timer text
        timerMesh.position.set(-newWidth / 2, -1.3, 0.11);
      }
    }, 1000);
  });
}

function createBasketball() {
  const ballRadius = 0.35;

  // יצירת הגיאומטריה והמרקם של הכדור
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const ballTexture = loader.load('src/textures/basketball.png');
  ballTexture.wrapS = THREE.ClampToEdgeWrapping;
  ballTexture.wrapT = THREE.ClampToEdgeWrapping;

  const ballMaterial = new THREE.MeshPhongMaterial({
    map: ballTexture,
    shininess: 50,
  });

  const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;

  // ✅ יצירת קבוצה שכוללת את כל מרכיבי הכדור
  const basketballGroup = new THREE.Group();
  basketballGroup.add(ballMesh);

  // יצירת התפרים
  const segs = 64;
  const offset = ballRadius + 0.002;

  function makeSeamCircle(plane) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      let x = 0, y = 0, z = 0;

      if (plane === 'XZ') {
        x = offset * Math.cos(t);
        z = offset * Math.sin(t);
      } else { // YZ
        y = offset * Math.cos(t);
        z = offset * Math.sin(t);
      }

      pts.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(pts, true);
    const geometry = new THREE.TubeGeometry(curve, 128, 0.008, 12, true);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    return new THREE.Mesh(geometry, material);
  }

  function makeVerticalSeamAtAngle(angleRadians) {
    const seam = makeSeamCircle('YZ');
    seam.rotation.y = angleRadians;
    return seam;
  }

  function makeVerticalSeamAroundX(angleRadians) {
    const seam = makeSeamCircle('XZ');
    seam.rotation.x = angleRadians;
    return seam;
  }

  // הוספת התפרים לקבוצה
  basketballGroup.add(makeVerticalSeamAtAngle(Math.PI / 2));
  basketballGroup.add(makeVerticalSeamAtAngle(-Math.PI / 2));
  basketballGroup.add(makeVerticalSeamAroundX(Math.PI / 4));
  basketballGroup.add(makeVerticalSeamAroundX(-Math.PI / 4));
  basketballGroup.add(makeSeamCircle('XZ')); // Equator

  // הצבה בסצנה
  basketballGroup.position.set(0, ballRadius + 0.11, 0);
  scene.add(basketballGroup);

  // שמירה ככדור הגלובלי שלך
  basketball = basketballGroup;
}


function updatePowerDisplay() {
  const el = document.getElementById("power");
  if (el) el.innerText = `Power: ${Math.round(shotPower * 100)}%`;
}


function shootBall() {
  if (!basketball) return;

  isShooting = true;
  collidedDuringShot = false;
  scoredThisShot = false; // ✅ אפסנו
  shotsAttempted++;
  updateScoreDisplay();


  const ballPos = basketball.position.clone();
  currentTargetHoop = getNearestHoop(ballPos);
  shotHoopCenter = new THREE.Vector3(currentTargetHoop.x, 3.05, currentTargetHoop.z);

  const horizontalDir = new THREE.Vector3(
    currentTargetHoop.x - ballPos.x,
    0,
    currentTargetHoop.z - ballPos.z
  ).normalize();

  const horizontalSpeed = shotPower * 6;
  const verticalSpeed = shotPower * 20;

  velocity = new THREE.Vector3(
    horizontalDir.x * horizontalSpeed,
    verticalSpeed,
    horizontalDir.z * horizontalSpeed
  );
}


function getNearestHoop(ballPos) {
  const distToRight = ballPos.distanceTo(rimRight);
  const distToLeft = ballPos.distanceTo(rimLeft);
  return distToRight < distToLeft ? rimRight : rimLeft;
}




// Add key listener to handle camera controls or other events
document.addEventListener('keydown', handleKeyDown);

let prevY = 0;
let collidedDuringShot = false;
let scoredThisShot = false;
let hitBackboard = false;


function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  controls.enabled = isOrbitEnabled;
  controls.update();

  // 🎇 Update fireworks
  for (let i = fireworks.length - 1; i >= 0; i--) {
    if (!fireworks[i](delta)) fireworks.splice(i, 1);
  }

  if (basketball) {
    const pos = basketball.position;

    if (!isShooting) {
      if (moveLeft && pos.x > -14.5) pos.x -= movementSpeed;
      if (moveRight && pos.x < 14.5) pos.x += movementSpeed;
      if (moveForward && pos.z > -7.1) pos.z -= movementSpeed;
      if (moveBackward && pos.z < 7.1) pos.z += movementSpeed;

      // 🧹 Clear trail when ball is not shooting
      resetTrails(); 
    }

    if (isShooting) {
      velocity.y += gravity * timeStep;
      basketball.position.add(velocity.clone().multiplyScalar(timeStep));

      // 💫 Add to trail – חדש: 3 שובלים
      // 💫 Add to trail – חדש: 3 שובלים
      const pos = basketball.position.clone();
      const direction = velocity.clone().normalize();
      const sideways = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).multiplyScalar(0.2);

      trailMain.push(pos.clone());
      trailLeft.push(pos.clone().add(sideways));
      trailRight.push(pos.clone().sub(sideways));

      if (trailMain.length > maxTrailLength) trailMain.shift();
      if (trailLeft.length > maxTrailLength - 5) trailLeft.shift();
      if (trailRight.length > maxTrailLength - 5) trailRight.shift();

      // עדכון גיאומטריה – גרסה לקווים
      const updateTrailGeometry = (geometry, trailPoints) => {
        geometry.setFromPoints(trailPoints);
        geometry.attributes.position.needsUpdate = true;
      };

      updateTrailGeometry(trailGeometryMain, trailMain);
      updateTrailGeometry(trailGeometryLeft, trailLeft);
      updateTrailGeometry(trailGeometryRight, trailRight);

      }

      // 🌀 Rotation
      const moveDir = velocity.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const rotationAxis = new THREE.Vector3().crossVectors(moveDir, up).normalize();
      const rotationSpeed = velocity.length();
      basketball.rotateOnAxis(rotationAxis, rotationSpeed * 1.0 * timeStep);

      // Boundaries
      if (pos.z < -7.1) { basketball.position.z = -7.1; if (velocity.z < 0) velocity.z *= -0.6; }
      if (pos.z > 7.1)  { basketball.position.z = 7.1;  if (velocity.z > 0) velocity.z *= -0.6; }
      if (pos.x < -14.5){ basketball.position.x = -14.5;if (velocity.x < 0) velocity.x *= -0.6; }
      if (pos.x > 14.5) { basketball.position.x = 14.5; if (velocity.x > 0) velocity.x *= -0.6; }

      // 💥 Collision with hoop spheres
      checkHoopSphereCollision();

      // 🔍 Backboard collision
      const ballRadius = 0.35;
      const boardCenterX = -15;
      const boardYCenter = 3.7;
      const boardZCenter = 0;
      const boardHeight = 1.8;
      const boardDepth = 3.5;

      const boardRightEdge = boardCenterX + 0.2;
      const boardYMin = boardYCenter - boardHeight / 2 + 0.8;
      const boardYMax = boardYCenter + boardHeight / 2;
      const boardZMin = boardZCenter - boardDepth / 2;
      const boardZMax = boardZCenter + boardDepth / 2;

      const ballLeftEdge = pos.x - ballRadius;
      const ballYMin = pos.y - ballRadius;
      const ballYMax = pos.y + ballRadius;
      const ballZMin = pos.z - ballRadius;
      const ballZMax = pos.z + ballRadius;

      const inY = ballYMax >= boardYMin && ballYMin <= boardYMax;
      const inZ = ballZMax >= boardZMin && ballZMin <= boardZMax;
      const hitX = boardRightEdge >= ballLeftEdge;

      if (hitX && inY && inZ && !hitBackboard) {
        console.log("💥 פגיעה בלוח השמאלי!");
        hitBackboard = true;
        basketballsound.currentTime = 0;
        basketballsound.play();
      }

      // 🎯 Detect scoring
      const rimY = 3.05;
      const isGoingDown = velocity.y < 0;
      const justPassedRim = prevY > rimY && pos.y <= rimY;

      if (isGoingDown && justPassedRim && !scoredThisShot) {
        const rimCenter = shotHoopCenter;
        const horizontalDist = new THREE.Vector2(pos.x - rimCenter.x, pos.z - rimCenter.z).length();
        const isFallingStraight = Math.abs(velocity.x) < 6 && Math.abs(velocity.z) < 6;

        if (horizontalDist < 0.7 && Math.abs(pos.y - rimY) < 0.3 && isFallingStraight) {
          scoredThisShot = true;
          shotsScored++;
          score += 2;
          updateScoreDisplay();
          cheerSound.currentTime = 0;
          cheerSound.play();

          if (!collidedDuringShot && !hitBackboard) {
            showFeedbackMessage("SWISH!", 'gold');
            setTimeout(() => createHoopFireworks(), 200);
            createHoopFireworks();
          } else {
            showFeedbackMessage("SHOT MADE!", 'lightgreen');
          }
        } else {
          booSound.currentTime = 0;
          booSound.play();
          showFeedbackMessage("MISSED SHOT", 'tomato');
        }
      }

      // 🪵 Bounce on floor
      if (pos.y <= 0.5) {
        basketball.position.y = 0.5;
        if (Math.abs(velocity.y) > 1) {
          velocity.y *= -0.6;
          velocity.x *= 0.5;
          velocity.z *= 0.5;
          basketballsound.currentTime = 0;
          basketballsound.play();
        } else {
          velocity.set(0, 0, 0);
          isShooting = false;
        }

        // Reset backboard flag
        hitBackboard = false;
        resetTrails();
      }
    }

    prevY = basketball.position.y;
    renderer.render(scene, camera);
  }

function checkHoopSphereCollision() {
  const ballRadius = 0.35;
  const sphereRadius = 0.04;
  const minDist = ballRadius + sphereRadius;

  for (let sphere of collisionHoopSpheres) {
    const dist = basketball.position.distanceTo(sphere.position);

    if (dist < minDist) {
      collidedDuringShot = true;

      const direction = basketball.position.clone().sub(sphere.position).normalize();
      const corrected = sphere.position.clone().add(direction.multiplyScalar(minDist));
      basketball.position.copy(corrected);
      velocity.copy(direction.multiplyScalar(velocity.length() * 0.9));

      console.log("💥 התנגשות עם ספרה בטבעת!");
      basketballsound.currentTime = 0;
      basketballsound.play();
      return true;
    }
  }
  return false;
}



function updateScoreDisplay() {
  const stats = document.getElementById("stats");
  const power = document.getElementById("power");
  const scoreElement = document.getElementById("score"); // ✅ הוספנו שורה זו
  if (!stats || !power || !scoreElement) return;

  const percentage = shotsAttempted === 0
    ? 0
    : ((shotsScored / shotsAttempted) * 100).toFixed(1);

  stats.innerHTML = `
    Shots: ${shotsAttempted}<br>
    Hits: ${shotsScored}<br>
    Accuracy: ${percentage}%
  `;
  power.innerText = `Power: ${Math.round(shotPower * 100)}%`;
  scoreElement.innerText = `Score: ${score}`; // ✅ גם כאן
}

function showFeedbackMessage(text, color = 'white') {
  // אם אין feedbackElement עדיין - תצרי אותו רק פעם אחת
  let feedbackElement = document.getElementById('feedback');
  if (!feedbackElement) {
    feedbackElement = document.createElement('div');
    feedbackElement.id = 'feedback';
    feedbackElement.style.position = 'absolute';
    feedbackElement.style.top = '50%';
    feedbackElement.style.left = '50%';
    feedbackElement.style.transform = 'translate(-50%, -50%)';
    feedbackElement.style.padding = '20px 30px';
    feedbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    feedbackElement.style.border = '2px solid white';
    feedbackElement.style.borderRadius = '10px';
    feedbackElement.style.color = color;
    feedbackElement.style.fontSize = '26px';
    feedbackElement.style.fontFamily = 'Arial, sans-serif';
    feedbackElement.style.textAlign = 'center';
    feedbackElement.style.zIndex = '99999';
    feedbackElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    feedbackElement.style.opacity = '0';

    document.body.appendChild(feedbackElement);
  }

  // הצגה עם אנימציה
  feedbackElement.innerText = text;
  feedbackElement.style.color = color;
  feedbackElement.style.opacity = '1';
  feedbackElement.style.transform = 'translate(-50%, -50%) scale(1.1)';

  setTimeout(() => {
    feedbackElement.style.opacity = '0';
    feedbackElement.style.transform = 'translate(-50%, -50%) scale(0.9)';
  }, 2000);
}


function createFirework(x, y, z) {
  const count = 80;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    positions.push(x, y, z);

    velocities.push(
      (Math.random() - 0.5) * 6,
      Math.random() * 10,  // יותר גובה
      (Math.random() - 0.5) * 6
    );

    const color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 60%)`);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); // 🎨 צבע אישי

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true, // ⚠️ חשוב! כדי לאפשר צבעים נפרדים
    transparent: true,
    opacity: 1.0,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let lifetime = 1.5;

  function updateFirework(delta) {
    lifetime -= delta;
    material.opacity = Math.max(0, lifetime / 1.5); // פייד

    if (lifetime <= 0) {
      scene.remove(points);
      return false;
    }

    const pos = geometry.attributes.position;
    const vel = geometry.attributes.velocity;

    for (let i = 0; i < pos.count; i++) {
      vel.array[i * 3 + 1] += gravity * delta;

      pos.array[i * 3 + 0] += vel.array[i * 3 + 0] * delta;
      pos.array[i * 3 + 1] += vel.array[i * 3 + 1] * delta;
      pos.array[i * 3 + 2] += vel.array[i * 3 + 2] * delta;
    }

    pos.needsUpdate = true;
    return true;
  }

  fireworks.push(updateFirework);
}




function createHoopFireworks() {
  const sampled = collisionHoopSpheres.filter((_, i) => i % 0.5 === 0); // כל חמישית בערך
  for (const sphere of sampled) {
    const pos = sphere.position;
    createFirework(pos.x, pos.y, pos.z);
  }
}

function resetTrails() {
  trailMain.length = 0;
  trailLeft.length = 0;
  trailRight.length = 0;
}

animate();
