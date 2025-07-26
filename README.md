# Interactive Basketball Shooting Game with Physics – THREE.js (HW06)

## Group Members
- Eden Zehavy 314832270
- Rotem Haim 314652496

## Overview
This project extends our HW05 basketball court into a fully interactive 3D basketball shooting game using [THREE.js](https://threejs.org/). It features:
- Realistic basketball physics (gravity, arc, bounce, rim/backboard collision)
- Interactive controls for moving, shooting, and adjusting shot power
- Ball rotation animation during movement and flight
- Real-time scoring and statistics
- Live UI: score, attempts, accuracy, timer, shot power, and feedback
- 3D scoreboard, sound effects, and visual feedback
- Bleachers, court lines, and a detailed environment

## How to Run
1. **Install dependencies** (if any):
   - This project uses only client-side JS and THREE.js (included via import/module).
2. **Start the application:**
   ```bash
   node index.js
   ```
   The server will run on port 8000 by default.
3. **Open your browser:**
   - Go to [http://localhost:8000](http://localhost:8000)

## Controls
| Key         | Function                                 |
|-------------|------------------------------------------|
| Arrow Keys  | Move basketball (left/right/forward/back)|
| W / S       | Increase/decrease shot power             |
| Spacebar    | Shoot basketball toward nearest hoop     |
| R           | Reset basketball to center court         |
| O           | Toggle orbit camera controls             |
| A/B/C/D     | Camera presets (various views)           |
| Mouse       | Orbit, pan, and zoom camera (when enabled)|

- After pressing A/B/C/D, a popup will indicate the camera mode.
- All controls are responsive and work as specified in the UI panel.

## Features & Requirements Checklist (HW06)
### Mandatory Interactive Features
- [x] **Physics-Based Basketball Movement:**
  - Gravity, parabolic arc, bounce with energy loss
  - Ground and rim collision detection
- [x] **Interactive Basketball Controls:**
  - Arrow keys: move ball
  - W/S: adjust shot power (0–100%, with visual indicator)
  - Spacebar: shoot
  - R: reset ball to center
- [x] **Basketball Rotation Animations:**
  - Ball rotates during movement/flight, axis matches direction, speed matches velocity
- [x] **Comprehensive Scoring System:**
  - Real-time score, shot attempts, made shots, accuracy percentage
  - Visual and audio feedback for made/missed shots
- [x] **Enhanced User Interface:**
  - Live display: score, attempts, accuracy, timer, shot power
  - Control instructions panel
  - Game status messages (shot made/missed)

### Physics System Details
- Constant gravity pulls the ball down
- Parabolic trajectory for shots
- Shot power and angle determine initial velocity
- Ball bounces with energy loss (comes to rest quickly)
- Rim and backboard collisions are robust and realistic
- Ball rotation axis and speed match movement direction

### Scoring System
- Score 2 points for each successful shot (local/visitor logic)
- Shot attempts and made shots tracked
- Shooting percentage calculated and displayed
- Visual and audio feedback for made/missed shots

### User Interface
- **Top-left:** Score, attempts, made, accuracy, timer
- **Bottom-left:** Shot power indicator, control instructions
- **Center:** Feedback for made/missed shots
- **3D scoreboard:** Above court (score and timer)

### Bonus Features (if implemented)
- Stadium environment (bleachers)
- Enhanced lighting (multiple spotlights)
- **Ball Trail Effect:** Visual trail following the basketball during flight (**implemented**)
- **Sound Effects:** Audio feedback for shots, bounces, and scores (**implemented**)
- **Time Challenge:** Timed shooting challenges with countdown (**implemented**)
- (See HW06 instructions for more bonus ideas)

## Project Structure
- `index.js` – Entry point/server
- `index.html` – Main HTML file
- `src/hw5.js` – Main scene and logic (all 3D, controls, and rendering)
- `src/OrbitControls.js` – Camera orbit controls
- `src/textures/` – Textures for court and basketball
- `src/sounds/` – Sound effects for gameplay
- `CONFIGURATION.md` – Project and code style guidelines

## Sources of External Assets
- [THREE.js](https://threejs.org/) (core library)
- [Basketball texture](src/textures/basketball.png)
- [Wood floor texture](src/textures/wood_floor.jpg)
- [Fonts](https://threejs.org/examples/fonts/)
- [Sound effects] (see src/sounds/ for sources)

## Screenshots (MANDATORY)
Include screenshots demonstrating:
- Basketball movement (arrow keys)
- Shot power adjustment (W/S keys)
- Shooting mechanics (spacebar)
- Successful shot with score update
- Ball rotation animation during movement/flight
- Complete UI showing scores, statistics, and controls

Example:

### Basketball Movement (Arrow Keys)
![Basketball Movement](screenshots/image1.png)

### Shot Power Adjustment (W/S Keys)
![Shot Power](screenshots/image2.png)

### Shooting Mechanics (Spacebar)
![Shooting](screenshots/image3.png)

### Score Update & UI
![Score Update](screenshots/image4.png)

## Known Issues / Limitations
- (List any known bugs or limitations here)

## Additional Implemented Bonus Features
- **Ball Trail Effect:** Visual trail following the basketball during flight (**implemented**)
- **Sound Effects:** Audio feedback for shots, bounces, and scores (**implemented**)
- **Time Challenge:** Timed shooting challenges with countdown (**implemented**)

## References
- [THREE.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Discover Three.js](https://discoverthreejs.com/)
- [Keyboard Event Handling (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [Physics: Projectile Motion (Khan Academy)](https://www.khanacademy.org/science/physics/two-dimensional-motion/projectile-motion/a/what-is-projectile-motion)
- Standard basketball court: 28m x 15m (92ft x 50ft)
- Standard rim height: 3.05m (10ft)

---

**Authors:** Eden Zehavy & Rotem Haim 