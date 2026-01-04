# Peekachoo Frontend

A browser-based territory capture game inspired by the classic arcade game **Qix**. Players claim territory on a game board to progressively reveal hidden Pokémon images. Built with Phaser 3 and TypeScript.

![Phaser](https://img.shields.io/badge/Phaser-3.10.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Territory Claiming Gameplay** - Draw paths to claim territory and reveal hidden images
- **Progressive Difficulty** - Multiple levels with increasing enemy count and speed
- **WebAuthn Authentication** - Passwordless login using device biometrics or security keys
- **Custom Game Creation** - Create and share games with custom Pokémon levels
- **Quiz System** - Answer Pokémon trivia after completing each level
- **Mobile Support** - Virtual D-pad for touch devices
- **Retro Styling** - NES.css for nostalgic pixel-art UI

## Tech Stack

| Component | Technology |
|-----------|------------|
| Game Engine | Phaser 3.10.1 |
| Language | TypeScript 4.9.5 |
| Build Tool | Webpack 3.11.0 |
| CSS Framework | NES.css 2.2.1 |
| Authentication | WebAuthn/Passkeys |
| Dev Server | BrowserSync |

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- Running [peekachoo-backend](https://github.com/kenken64/peekachoo-backend) server

## Installation

```bash
# Clone the repository
git clone https://github.com/kenken64/peekachoo-frontend.git
cd peekachoo-frontend

# Install dependencies
npm install
```

## Development

```bash
# Start development server (http://localhost:3000)
npm run dev
```

The dev server includes:
- Hot reload on file changes
- Source maps for debugging
- BrowserSync for live refresh

## Production Build

```bash
# Create optimized production build
npm run deploy
```

Output is generated in the `/build` directory with:
- Minified JavaScript and HTML
- Vendor bundle separation
- Cache-busting hashes

## Project Structure

```
src/
├── main.ts                 # Game initialization & config
├── config.ts               # API URL configuration
├── scenes/                 # Phaser game scenes
│   ├── login-scene.ts      # WebAuthn login UI
│   ├── menu-scene.ts       # Main menu & game browser
│   ├── game-create-scene.ts # Game creation UI
│   └── qix-scene.ts        # Main gameplay scene
├── objects/                # Game entities
│   ├── player.ts           # Player character
│   ├── qix.ts / qixes.ts   # Bouncing enemies
│   ├── sparky.ts / sparkies.ts # Patrol enemies
│   ├── grid.ts             # Play area management
│   ├── image-overlay.ts    # Hidden image reveal
│   ├── virtual-dpad.ts     # Mobile controls
│   └── ...                 # Other game objects
├── services/               # Backend API integrations
│   ├── auth-service.ts     # WebAuthn authentication
│   ├── game-service.ts     # Game CRUD operations
│   ├── pokemon-service.ts  # Pokémon data
│   └── quiz-service.ts     # Quiz generation
└── utils/                  # Helper utilities
```

## Game Controls

### Desktop
| Key | Action |
|-----|--------|
| Arrow Up | Move up |
| Arrow Down | Move down |
| Arrow Left | Move left |
| Arrow Right | Move right |

### Mobile
- **Virtual D-Pad** - Touch controls displayed on mobile devices

## Gameplay

1. **Objective**: Claim 60%+ of the play area to complete a level
2. **Movement**: Move along borders or claimed territory
3. **Claiming**: Venture into unclaimed territory and return to border to claim area
4. **Enemies**:
   - **Qix** (red lines) - Bounce in unclaimed areas, avoid while drawing
   - **Sparkies** (red dots) - Patrol claimed borders
5. **Lives**: Lose a life when touched by enemies while drawing
6. **Quiz**: Answer a Pokémon trivia question after completing each level

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API URL | `http://localhost:3000/api` |

### Game Settings (main.ts)

```typescript
Canvas: 800x650 pixels
Play Area: 780x440 pixels
Coverage Target: 60%
Player Speed: 5 pixels/frame
```

## Docker Deployment

```bash
# Build Docker image
docker build -t peekachoo-frontend .

# Run container
docker run -p 8080:8080 \
  -e VITE_API_URL=https://your-backend-url/api \
  peekachoo-frontend
```

The Docker image uses:
- Multi-stage build (Node.js builder + Nginx server)
- Runtime environment injection via `docker-entrypoint.sh`
- Gzip compression
- Static asset caching

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run deploy` | Create production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Mocha tests |

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Requires WebAuthn support for authentication.

## Related

- [peekachoo-backend](https://github.com/kenken64/peekachoo-backend) - Backend API server
- [peekachoo](https://github.com/kenken64/peekachoo) - Parent repository

## Credits

Based on starter project: https://github.com/troyedwardsjr/phaser3-typescript-webpack

### Audio Credits

| Track | Author | License | Source |
|-------|--------|---------|--------|
| Menu Music (8bit Bossa) | Joth | CC0 | [OpenGameArt](https://opengameart.org/content/bossa-nova) |
| Game Music (Happy Arcade Tune) | rezoner | CC-BY 3.0 | [OpenGameArt](https://opengameart.org/content/happy-arcade-tune) |

Sound effects generated using JSFXR-style synthesis.

## License

MIT
