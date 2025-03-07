# Radical Aces: Java Codebase Analysis

## Core Game Architecture

Based on analysis of the Java codebase, here are the key components and their relationships:

1. **Main Game Classes**

   - `F51.java`: Main game class (extends Applet) that handles game loop, events, audio loading, initialization
   - `Medium.java`: Handles physics/environment calculations and rendering context
   - `ContO.java`: Container Object - base class for all 3D objects in the game
   - `Plane.java`: Manages 3D planes that form objects
   - `SinCos.java`: Trigonometry utility for rotation calculations

2. **Player & Entities**

   - `userCraft.java`: Player's aircraft and control logic
   - `Craft.java`: Generic aircraft class (possibly for AI-controlled craft)
   - `Tank.java`: Ground-based enemy vehicles

3. **Weapons & Effects**

   - `Lasers.java`: Handles all weapon types, projectile physics, and effects
   - Various smoke and explosion effects are handled within entity classes

4. **Controls**
   - `Control.java` & `cControl.java`: Handle user input and control mapping

## Game Mechanics

1. **Movement System**

   - 3D coordinate system with x, y, z coordinates
   - Rotation handling via xz, xy, zy angles
   - Flight physics including lift, speed, and rotation calculations

2. **Weapons System**

   - Multiple weapon types with different properties:
     - Speed (projectile velocity)
     - Radius (area of effect)
     - Rate of fire
     - Damage
   - Weapon effects including smoke and explosions

3. **Enemy Types**

   - **Aircraft**: AI-controlled flying enemies with different attack patterns

     - Appear to have various modes (mode 0, 1, 3 seen in code)
     - Targeting system to engage player
     - Different flight patterns (attacking, evasive, etc.)

   - **Tanks**: Ground-based enemies
     - Can rotate to track player
     - Fire projectiles upward
     - Limited movement compared to aircraft

4. **Collision & Damage**
   - Collision detection between projectiles and entities
   - Hit count tracking for both player and enemies
   - Explosion animations when entities are destroyed

## Visual & Audio Elements

1. **Graphics**

   - `xtGraphics.java`: Handles 2D/3D graphics rendering
   - Uses wireframe 3D objects built from polygons
   - Custom 3D to 2D projection for rendering

2. **Audio**
   - Multiple sound effects for weapons, explosions, engines
   - Background music system
   - Spatial audio based on distance/position

## Game Levels & Flow

1. **Levels**

   - Level data appears to be loaded from external files
   - Environment objects are placed based on level data
   - Enemy spawning and behavior may vary by level

2. **Game Flow**
   - Start screen → Level selection → Gameplay → End screen
   - Score tracking and possibly mission objectives

## Key JavaScript Components to Implement

### Core Classes (mapped from Java)

```javascript
// Core engine
class Game {
  // Main game loop and initialization (from F51.java)
}

class Physics {
  // Physics calculations (from Medium.java)
}

class GameObject {
  // Base class for all game objects (from ContO.java)
  // Will use Three.js Object3D as base
}

// Entities
class PlayerCraft extends GameObject {
  // Player's aircraft (from userCraft.java)
}

class EnemyCraft extends GameObject {
  // AI aircraft (from Craft.java)
}

class Tank extends GameObject {
  // Ground enemy (from Tank.java)
}

// Weapons
class WeaponSystem {
  // Handles weapons and projectiles (from Lasers.java)
}

// Input
class InputManager {
  // Handles user input (from Control.java)
}
```

### Example Enemy Implementation

```javascript
class EnemyCraft extends GameObject {
  constructor(scene, type) {
    super();
    this.scene = scene;
    this.type = type;
    this.health = 100;
    this.targeting = false;
    this.mode = 0; // Different AI modes

    // Set properties based on enemy type
    switch (type) {
      case "fighter":
        this.speed = 2.0;
        this.turnRate = 0.05;
        this.weaponType = "laser";
        break;
      case "bomber":
        this.speed = 1.0;
        this.turnRate = 0.03;
        this.weaponType = "missile";
        break;
    }

    this.initModel();
  }

  initModel() {
    // Create Three.js model
  }

  update(deltaTime, playerPosition) {
    // AI behavior based on mode
    switch (this.mode) {
      case 0: // Patrol mode
        this.patrol(deltaTime);
        break;
      case 1: // Attack mode
        this.attack(deltaTime, playerPosition);
        break;
      case 3: // Evasive mode
        this.evade(deltaTime, playerPosition);
        break;
    }

    // Update position and rotation
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Check for firing weapons
    this.updateWeapons(deltaTime, playerPosition);
  }

  // AI behavior methods
  patrol(deltaTime) {
    // Implement patrol pattern
  }

  attack(deltaTime, playerPosition) {
    // Implement attack behavior
  }

  evade(deltaTime, playerPosition) {
    // Implement evasive maneuvers
  }

  updateWeapons(deltaTime, playerPosition) {
    // Handle weapon firing logic
  }
}
```

### Example Weapon System

```javascript
class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];

    // Weapon types from Lasers.java
    this.weaponTypes = [
      { speed: 200, radius: 200, fireRate: 8, damage: 3 }, // Type 0
      { speed: 150, radius: 200, fireRate: 8, damage: 2 }, // Type 1
      { speed: 120, radius: 300, fireRate: 10, damage: 2 }, // Type 2
      // etc.
    ];
  }

  fire(position, direction, weaponType, owner) {
    const type = this.weaponTypes[weaponType];

    const projectile = {
      position: position.clone(),
      direction: direction.clone(),
      speed: type.speed,
      damage: type.damage,
      radius: type.radius,
      owner: owner,
      timeToLive: 5.0, // seconds
    };

    this.projectiles.push(projectile);

    // Create visual representation
    // Play sound effect
  }

  update(deltaTime) {
    // Update all projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      // Move projectile
      projectile.position.add(
        projectile.direction
          .clone()
          .multiplyScalar(projectile.speed * deltaTime)
      );

      // Handle lifetime
      projectile.timeToLive -= deltaTime;
      if (projectile.timeToLive <= 0) {
        // Remove projectile
        this.projectiles.splice(i, 1);
      }
    }

    // Check for collisions
    this.checkCollisions();
  }

  checkCollisions() {
    // Implement collision detection
  }
}
```
