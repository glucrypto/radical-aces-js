# Radical Aces JS

A modern JavaScript/TypeScript remake of the Radical Aces game using Three.js for 3D rendering.

Original game: https://www.radicalplay.com/aces/

## Project Structure

```
radical-aces-js/
├── .github/               # GitHub workflows and configurations
├── public/                # Static assets that won't be processed by Vite
│   ├── favicon.ico
│   └── robots.txt
├── src/                   # Source code
│   ├── assets/            # Game assets
│   │   ├── models/        # 3D models
│   │   ├── textures/      # Texture files
│   │   ├── audio/         # Sound effects and music
│   │   └── fonts/         # Font files
│   ├── components/        # Reusable UI components
│   ├── config/            # Game configuration files
│   ├── core/              # Core game engine
│   │   ├── engine.ts      # Main game loop and initialization
│   │   ├── input.ts       # Input handling
│   │   └── time.ts        # Time management
│   ├── entities/          # Game entities
│   │   ├── player/        # Player-related code
│   │   └── enemies/       # Enemy-related code
│   ├── physics/           # Physics calculations
│   ├── scenes/            # Game scenes/levels
│   ├── shaders/           # GLSL shaders
│   ├── ui/                # User interface elements
│   ├── utils/             # Utility functions
│   ├── weapons/           # Weapons system
│   ├── types/             # TypeScript type definitions and interfaces
│   ├── main.ts            # Entry point
│   └── style.css          # Global styles
├── tests/                 # Test files
├── .gitignore             # Git ignore file
├── .eslintrc.js           # ESLint configuration
├── .prettierrc            # Prettier configuration
├── tsconfig.json          # TypeScript configuration
├── index.html             # HTML entry point
├── package.json           # Package configuration
├── pnpm-lock.yaml         # PNPM lock file
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

## Technology Stack

- **Language**: TypeScript
- **Rendering**: Three.js
- **Build Tool**: Vite
- **Package Manager**: pnpm (preferred) or npm

## Development Setup

### Prerequisites

- Node.js (v16+)
- pnpm (v6+) or npm

### Installation

```bash
# Install dependencies using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### Development Server

```bash
# Start development server with pnpm
pnpm dev

# Or using npm
npm run dev
```

### Building for Production

```bash
# Build with pnpm
pnpm build

# Or using npm
npm run build
```

### Previewing Production Build

```bash
# Preview with pnpm
pnpm preview

# Or using npm
npm run preview
```

## Project Roadmap

The development of Radical Aces JS follows the conversion plan outlined in the [radical-aces-conversion-plan.md](./radical-aces-conversion-plan.md) document, with development broken down into the following phases:

1. Project Setup & Analysis
2. Core Game Engine
3. Start Screen & UI
4. Map & World
5. Player Controls & Interactions
6. Game Mechanics
7. Polish & Optimization
8. Testing & Deployment

## License

[MIT](LICENSE)
