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

// Instructions display
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '20px';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '16px';
instructionsElement.style.fontFamily = 'Arial, sans-serif';
instructionsElement.style.textAlign = 'left';
instructionsElement.innerHTML = `
  <h3>Controls:</h3>
  <p>O - Toggle orbit camera</p>
`;
document.body.appendChild(instructionsElement);
// Create score display element for UI (top-right corner)
const scoreElement = document.createElement('div');
scoreElement.id = "score";

// Positioning and styling
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.right = '20px';
scoreElement.style.zIndex = '9999';
scoreElement.style.padding = '10px';
scoreElement.style.fontSize = '20px';
scoreElement.style.color = 'white';
scoreElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
scoreElement.style.border = '1px solid white'; // Optional border for visibility

// Initial score content
scoreElement.innerText = 'Score: 0';

// Add to DOM
document.body.appendChild(scoreElement);

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

// Creates a complete basketball hoop at the given X position (left or right)
function createHoop(xPosition) {
  const direction = xPosition === 15 ? 1 : -1; // Determine side: right (15) or left (-15)

  // === Transparent Backboard ===
  const backboardGeometry = new THREE.BoxGeometry(0.05, 1.8, 3.5); // Thin plane
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
    opacity: 1,
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

  // === Metal Chain Net (curved) ===
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa }); // Light gray metallic
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
    const midY = -netHeight * 0.4; // Slight dip in the middle

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
  arm.rotation.z = direction * -Math.PI / 12; // ~15 degrees
  arm.castShadow = true;
  scene.add(arm);

  // === Add logo based on hoop side ===
  if (xPosition === 15) {
    addLogoRight(backboard);
  } else {
    addLogoLeft(backboard);
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
  const ballRadius = 0.5;

  // 1) Create the basketball geometry and apply texture
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const ballTexture = loader.load('src/textures/basketball.png');
  ballTexture.wrapS = THREE.ClampToEdgeWrapping;
  ballTexture.wrapT = THREE.ClampToEdgeWrapping;
  ballTexture.repeat.set(1, 1);

  const ballMaterial = new THREE.MeshPhongMaterial({
    map: ballTexture,
    shininess: 50,
  });

  const basketball = new THREE.Mesh(ballGeometry, ballMaterial);
  basketball.position.set(0, ballRadius + 0.11, 0);
  basketball.castShadow = true;
  basketball.receiveShadow = true;
  scene.add(basketball);

  // 2) Create circular seams (thick black lines)
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

    // Use TubeGeometry instead of LineLoop for thickness
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const geometry = new THREE.TubeGeometry(curve, 128, 0.008, 12, true);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const tube = new THREE.Mesh(geometry, material);
    return tube;
  }

  function makeVerticalSeamAtAngle(angleRadians) {
    const seam = makeSeamCircle('YZ');
    seam.rotation.y = angleRadians;
    return seam;
  }

  function makeVerticalSeamAroundX(rotationAngle) {
    const seam = makeSeamCircle('XZ');
    seam.rotation.x = rotationAngle;
    return seam;
  }

  // Add all seams to the ball
  basketball.add(makeVerticalSeamAtAngle(Math.PI / 2));
  basketball.add(makeVerticalSeamAtAngle(-Math.PI / 2));
  basketball.add(makeVerticalSeamAroundX(Math.PI / 4));
  basketball.add(makeVerticalSeamAroundX(-Math.PI / 4));
  basketball.add(makeSeamCircle('XZ')); // Equator
}


// Add key listener to handle camera controls or other events
document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();
