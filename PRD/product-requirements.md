# Product Requirements Document (PRD)
# Peekachoo - Territory Capture Game

**Version:** 1.0  
**Date:** December 30, 2025  
**Status:** Active Development

---

## 1. Executive Summary

Peekachoo is a browser-based territory capture game inspired by the classic arcade game Qix. Players claim territory on a game board to progressively reveal a hidden Pikachu image. The game combines nostalgic arcade gameplay with modern web technologies.

---

## 2. Product Overview

### 2.1 Vision
Create an engaging, browser-based puzzle game that captures the addictive gameplay of classic Qix while adding a unique "image reveal" mechanic that rewards players with a hidden picture as they progress.

### 2.2 Target Audience
- Casual gamers looking for quick, engaging gameplay
- Retro gaming enthusiasts familiar with Qix
- Players of all ages who enjoy puzzle/strategy games

### 2.3 Platform
- Web browsers (Chrome, Firefox, Safari, Edge)
- Desktop-focused with potential mobile support

---

## 3. Game Mechanics

### 3.1 Core Gameplay
| Feature | Description |
|---------|-------------|
| **Player Movement** | Player moves along boundaries and into unclaimed territory using arrow keys |
| **Territory Claiming** | Player draws lines into unclaimed area and returns to boundary to claim territory |
| **Image Reveal** | Claimed territories reveal portions of a hidden Pikachu image |
| **Win Condition** | Player must claim 60%+ of the play area to complete a level |
| **Loss Condition** | Player loses a life if touched by enemies while drawing lines |

### 3.2 Enemies

#### 3.2.1 Qix
- Bouncing line-based enemy that moves freely in the unclaimed play area
- Represented as red animated lines
- Collision with player's active drawing line results in life loss
- Multiple Qix enemies in higher levels

#### 3.2.2 Sparkies
- Patrol enemies that move along claimed boundary lines
- Represented as red dots
- Collision with player results in life loss
- Additional Sparkies spawn in higher levels

### 3.3 Progression System
| Level | Coverage Target | Sparkies | Qix | Difficulty |
|-------|-----------------|----------|-----|------------|
| 1 | 60% | 1 | 1 | Easy |
| 2+ | 60% | Increasing | Increasing | Progressive |

---

## 4. Technical Specifications

### 4.1 Technology Stack
| Component | Technology |
|-----------|------------|
| Game Engine | Phaser 3.10.1 |
| Language | TypeScript |
| Build Tool | Webpack 3.11 |
| Transpiler | Babel 7 |
| Dev Server | BrowserSync |

### 4.2 Game Configuration
```
Canvas Size: 800 x 560 pixels
Play Area: 780 x 440 pixels (with margins)
Frame Rate: 60 FPS (Phaser default)
Renderer: Canvas 2D
```

### 4.3 Architecture

#### Core Modules
| Module | Responsibility |
|--------|----------------|
| `main.ts` | Game initialization and configuration |
| `qix-scene.ts` | Main game scene, game loop, win/loss logic |
| `player.ts` | Player movement and state |
| `grid.ts` | Play area management, collision detection |
| `filled-polygons.ts` | Territory claiming and polygon management |
| `image-overlay.ts` | Hidden image reveal system (HTML Canvas overlay) |
| `qix.ts` / `qixes.ts` | Qix enemy behavior and management |
| `sparky.ts` / `sparkies.ts` | Sparky enemy behavior and management |

#### Utility Modules
| Module | Responsibility |
|--------|----------------|
| `geom-utils.ts` | Geometry calculations and helpers |
| `ext-point.ts` | Extended Point class with helpers |
| `ext-polygon.ts` | Extended Polygon class with area calculations |
| `ext-rectangle.ts` | Extended Rectangle class for frame management |

---

## 5. User Interface

### 5.1 Game Screen Layout
```
┌─────────────────────────────────────┐
│           PLAY AREA (780x440)       │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    Hidden Image Revealed    │    │
│  │    Through Claimed Areas    │    │
│  │                             │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│ % Filled: XX | % Target: 60 | Level │
├─────────────────────────────────────┤
│         (Message Area)              │
└─────────────────────────────────────┘
```

### 5.2 UI Elements
| Element | Description |
|---------|-------------|
| **% Filled** | Current percentage of claimed territory |
| **% Target** | Required percentage to complete level (60%) |
| **Level** | Current level number |
| **Pause Button** | Pause/resume game |
| **Message Text** | "Ouch!!!" on death, "Sweet!!" on level complete |

### 5.3 Visual Design
| Element | Color |
|---------|-------|
| Background | #555555 (Grey) |
| Play Area Border | Black |
| Claimed Territory | Pikachu Image (revealed) |
| Player | #AA88EE (Purple) |
| Sparkies | #8B0000 (Dark Red) |
| Qix Lines | Red |
| Notification Text | #FFFF00 (Yellow) |

---

## 6. Controls

| Input | Action |
|-------|--------|
| Arrow Up | Move player up |
| Arrow Down | Move player down |
| Arrow Left | Move player left |
| Arrow Right | Move player right |
| Pause Button | Toggle pause |

---

## 7. Game States

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  START   │────▶│ PLAYING  │────▶│   WIN    │
└──────────┘     └────┬─────┘     └────┬─────┘
                      │                 │
                      ▼                 │
                ┌──────────┐            │
                │  DEATH   │            │
                └────┬─────┘            │
                     │                  │
                     ▼                  ▼
                ┌──────────┐     ┌──────────┐
                │ RESTART  │     │NEXT LEVEL│
                └──────────┘     └──────────┘
```

---

## 8. Image Reveal System

### 8.1 Technical Implementation
- Separate HTML Canvas overlay positioned over Phaser game canvas
- Canvas 2D clipping API used to reveal image through claimed polygon shapes
- Singleton pattern ensures single overlay instance across scene restarts
- Overlay temporarily hidden during message display

### 8.2 Image Assets
| Asset | Path | Description |
|-------|------|-------------|
| Pikachu | `assets/1.jpeg` | Hidden image to reveal |

---

## 9. Performance Considerations

### 9.1 Optimizations Implemented
- `willReadFrequently: true` attribute on Canvas contexts for faster `getImageData` operations
- Canvas patch applied before Phaser initialization
- Geometry mask avoided in favor of reliable Canvas 2D clipping

### 9.2 Known Warnings
- Canvas2D readback warnings may appear in console (performance hint, not error)

---

## 10. Future Enhancements

### 10.1 Planned Features
| Priority | Feature | Description |
|----------|---------|-------------|
| High | Multiple Images | Different images for different levels |
| Medium | Mobile Support | Touch controls for mobile devices |
| Medium | Score System | Points based on speed and efficiency |
| Low | Sound Effects | Audio feedback for actions |
| Low | Leaderboard | High score tracking |

### 10.2 Technical Debt
- Upgrade Phaser to latest version (3.55+) for better mask support
- Refactor image overlay to use Phaser's native systems if possible
- Add unit tests for geometry utilities

---

## 11. Installation & Development

### 11.1 Prerequisites
- Node.js
- npm

### 11.2 Setup
```bash
npm install
```

### 11.3 Development
```bash
npm run dev
```
Access at: `http://localhost:3000`

### 11.4 Production Build
```bash
npm run deploy
```

---

## 12. Repository

**GitHub:** https://github.com/kenken64/peekachoo-frontend

---

## Appendix A: File Structure

```
peekachoo-frontend/
├── assets/
│   └── 1.jpeg              # Hidden Pikachu image
├── src/
│   ├── main.ts             # Game entry point
│   ├── index.html          # HTML template
│   ├── phaser.d.ts         # Phaser type definitions
│   ├── objects/
│   │   ├── player.ts       # Player logic
│   │   ├── grid.ts         # Play area grid
│   │   ├── filled-polygons.ts
│   │   ├── image-overlay.ts
│   │   ├── qix.ts / qixes.ts
│   │   ├── sparky.ts / sparkies.ts
│   │   └── ...
│   ├── scenes/
│   │   └── qix-scene.ts    # Main game scene
│   └── utils/
│       ├── geom-utils.ts
│       └── string-utils.ts
├── test/
│   └── geom-utils.spec.ts
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

---

*Document generated: December 30, 2025*
