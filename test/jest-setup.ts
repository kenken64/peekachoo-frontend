// Jest setup file
import '@testing-library/jest-dom';

// Mock Phaser for testing
jest.mock('phaser', () => {
  return {
    Geom: {
      Line: jest.fn().mockImplementation((x1, y1, x2, y2) => ({
        x1, y1, x2, y2,
        getPointA: () => ({ x: x1, y: y1 }),
        getPointB: () => ({ x: x2, y: y2 }),
      })),
      Rectangle: jest.fn().mockImplementation((x, y, width, height) => ({
        x, y, width, height,
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
      })),
      Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
      Intersects: {
        LineToLine: jest.fn(),
        LineToRectangle: jest.fn(),
        RectangleToRectangle: jest.fn(),
      },
    },
    Math: {
      Distance: {
        Between: jest.fn((x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2)),
      },
    },
  };
});

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   info: jest.fn(),
// };
