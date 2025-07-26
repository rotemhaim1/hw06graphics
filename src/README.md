# Exercise 6 – Interactive Basketball Shooting Game with Physics (THREE.js)

## Overview
This project extends the HW05 basketball court by adding interactive controls, physics-based basketball movement, realistic shooting mechanics, ball rotation, and a comprehensive scoring system. The result is a fully interactive 3D basketball shooting game using THREE.js.

## Group Members
- <strong>Full Name 1</strong>
- <strong>Full Name 2</strong>

(Add your names above)

## How to Run
1. Open `index.html` in your browser (Chrome recommended).
2. Use the on-screen controls and keyboard to play.
3. No server required; all assets are local.

## Features
- Realistic basketball physics (gravity, arc, bounce, rim/backboard collision)
- Interactive controls for moving, shooting, and adjusting shot power
- Ball rotation animation during movement and flight
- Real-time scoring system with local/visitor logic
- Live UI: score, attempts, accuracy, timer, shot power, and feedback
- 3D scoreboard above the court, synchronized with UI
- Sound effects for shot, bounce, score, and miss
- Visual feedback for made/missed shots
- Bleachers, court lines, and detailed environment

## Controls
| Key         | Function                                 |
|-------------|------------------------------------------|
| Arrow Keys  | Move basketball (left/right/forward/back)|
| W / S       | Increase/decrease shot power             |
| Spacebar    | Shoot basketball toward nearest hoop     |
| R           | Reset basketball to center court         |
| O           | Toggle orbit camera controls             |
| A/B/C/D     | Camera presets (various views)           |
| Mouse       | Orbit, pan, and zoom camera              |

## Physics System
- Constant gravity pulls the ball down
- Parabolic trajectory for shots
- Shot power and angle determine initial velocity
- Ball bounces with energy loss (comes to rest quickly)
- Rim and backboard collisions are robust and realistic
- Ball rotation axis and speed match movement direction

## Scoring System
- Score 2 points for each successful shot
- Local/Visitor scores based on which hoop is scored
- Shot attempts and made shots tracked
- Shooting percentage calculated and displayed
- Visual and audio feedback for made/missed shots

## User Interface
- Top-left: Score, attempts, made, accuracy, timer
- Bottom-left: Shot power indicator, control instructions
- Center: Feedback for made/missed shots
- 3D scoreboard above court (score and timer)

## Screenshots
(Add screenshots below to demonstrate each feature. Replace the placeholders with your own images.)

### Basketball Movement (Arrow Keys)
![Basketball Movement](../screenshots/image1.png)

### Shot Power Adjustment (W/S Keys)
![Shot Power](../screenshots/image2.png)

### Shooting Mechanics (Spacebar)
![Shooting](../screenshots/image3.png)

### Score Update & UI
![Score Update](../screenshots/image4.png)

## Additional Features (if implemented)
- (Describe any bonus features, e.g., swish detection, time challenge, ball trail, etc.)

## Known Issues / Limitations
- (List any known bugs or limitations here)

## External Assets / Sources
- [Three.js](https://threejs.org/)
- [Fonts](https://threejs.org/examples/fonts/)
- [Sound effects] (list sources if not original)

---

**See the HW06 instructions for full grading criteria and requirements.**