import { GeomUtils } from '../src/utils/geom-utils';
import * as Phaser from 'phaser';
import Line = Phaser.Geom.Line;
import Rectangle = Phaser.Geom.Rectangle;
import { ExtRectangle } from '../src/objects/ext-rectangle';

// Helper classes for test data
class TestInfo {
  data: Line[];
  expectedResult: boolean;
  title: string;

  constructor(data: Line[], expectedResult: boolean, title: string) {
    this.data = data;
    this.expectedResult = expectedResult;
    this.title = title;
  }

  toString(): string {
    return `${this.title}: expected ${this.expectedResult}`;
  }
}

class TestInfos {
  tests: TestInfo[];

  constructor(tests: TestInfo[]) {
    this.tests = tests;
  }
}

describe('GeomUtils', () => {
  describe('lineContainsLine', () => {
    const testCases = [
      { line1: [1, 1, 5, 1], line2: [1, 1, 2, 1], expected: true, desc: 'horizontal - contained at start' },
      { line1: [1, 1, 5, 1], line2: [3, 1, 5, 1], expected: true, desc: 'horizontal - contained at end' },
      { line1: [1, 1, 5, 1], line2: [1, 1, 5, 1], expected: true, desc: 'horizontal - identical' },
      { line1: [1, 1, 5, 1], line2: [1, 1, 6, 1], expected: false, desc: 'horizontal - extends beyond' },
      { line1: [1, 1, 5, 1], line2: [0, 1, 5, 1], expected: false, desc: 'horizontal - starts before' },
      { line1: [1, 1, 5, 1], line2: [6, 1, 7, 1], expected: false, desc: 'horizontal - completely outside' },
      { line1: [5, 1, 1, 1], line2: [1, 1, 2, 1], expected: true, desc: 'horizontal reversed - contained' },
      { line1: [5, 1, 1, 1], line2: [2, 1, 1, 1], expected: true, desc: 'horizontal reversed - contained reversed' },
      { line1: [1, 1, 1, 5], line2: [1, 1, 1, 2], expected: true, desc: 'vertical - contained at start' },
      { line1: [1, 1, 1, 5], line2: [1, 3, 1, 5], expected: true, desc: 'vertical - contained at end' },
      { line1: [1, 1, 1, 5], line2: [1, 1, 1, 5], expected: true, desc: 'vertical - identical' },
      { line1: [1, 1, 1, 5], line2: [1, 1, 1, 6], expected: false, desc: 'vertical - extends beyond' },
      { line1: [1, 1, 1, 5], line2: [1, 0, 1, 5], expected: false, desc: 'vertical - starts before' },
      { line1: [1, 1, 1, 5], line2: [1, 6, 1, 7], expected: false, desc: 'vertical - completely outside' },
      { line1: [1, 5, 1, 1], line2: [1, 1, 1, 2], expected: true, desc: 'vertical reversed - contained' },
      { line1: [1, 5, 1, 1], line2: [1, 2, 1, 1], expected: true, desc: 'vertical reversed - contained reversed' },
      { line1: [1, 2, 3, 1], line2: [1, 2, 3, 1], expected: true, desc: 'diagonal - identical' },
    ];

    test.each(testCases)('$desc', ({ line1, line2, expected }) => {
      const l1 = new Line(line1[0], line1[1], line1[2], line1[3]);
      const l2 = new Line(line2[0], line2[1], line2[2], line2[3]);
      
      const result = GeomUtils.lineContainsLine(l1, l2);
      expect(result).toBe(expected);
    });
  });

  describe('collisionLineSegments', () => {
    const testCases = [
      { line1: [1, 2, 5, 7], line2: [1, 2, 5, 7], expected: true, desc: 'equivalent lines' },
      { line1: [1, 2, 5, 7], line2: [5, 7, 2, 1], expected: true, desc: 'equivalent reversed lines' },
      { line1: [2, 0, 5, 0], line2: [0, 0, 10, 0], expected: true, desc: 'contained lines' },
      { line1: [1, 1, 5, 1], line2: [5, 1, 10, 1], expected: true, desc: 'same slope - touching' },
      { line1: [1, 1, 5, 1], line2: [3, 1, 10, 1], expected: true, desc: 'same slope - overlapping' },
      { line1: [1, 1, 5, 1], line2: [5.1, 1, 10, 1], expected: false, desc: 'same slope - gap' },
      { line1: [1, 1, 5, 1], line2: [10, 1, 3, 1], expected: true, desc: 'same reversed slope' },
      { line1: [5, 1, 1, 1], line2: [3, 1, 10, 1], expected: true, desc: 'reversed same slope' },
      { line1: [1, 1, 5, 5], line2: [5, 5, 1, 1], expected: true, desc: 'diagonal reversed' },
      { line1: [1, 1, 5, 5], line2: [1, 5, 5, 1], expected: true, desc: 'crossing diagonals' },
      { line1: [1, 1, 5, 5], line2: [1, 5, 1.5, 4.5], expected: false, desc: 'non-intersecting diagonals' },
      { line1: [1, 1, 5, 5], line2: [455, 200, 123, 987], expected: false, desc: 'far apart' },
      { line1: [0, 0, 0, 5], line2: [0, 3, 0, 7], expected: true, desc: 'vertical overlapping' },
      { line1: [0, 0, 0, 5], line2: [0, 6, 0, 7], expected: false, desc: 'vertical gap' },
      { line1: [0, 0, 0, 5], line2: [1, 3, 1, 7], expected: false, desc: 'parallel vertical' },
      { line1: [790, 10, 790, 450], line2: [705, 193, 804, 210], expected: true, desc: 'vertical crosses horizontal' },
      { line1: [705, 193, 804, 210], line2: [790, 10, 790, 450], expected: true, desc: 'horizontal crosses vertical' },
      { line1: [0, 0, 0, 5], line2: [-2, 4, 2, 7], expected: false, desc: 'vertical and diagonal no intersection' },
      { line1: [189, 174, 265, 238], line2: [10, 450, 10, 10], expected: false, desc: 'diagonal and vertical no intersection' },
      { line1: [330, 200, 230, 200], line2: [790, 10, 790, 450], expected: false, desc: 'horizontal and vertical no intersection' },
    ];

    test.each(testCases)('$desc', ({ line1, line2, expected }) => {
      const l1 = new Line(line1[0], line1[1], line1[2], line1[3]);
      const l2 = new Line(line2[0], line2[1], line2[2], line2[3]);
      
      const result = GeomUtils.collisionLineSegments(l1, l2);
      expect(result).toBe(expected);
    });
  });

  describe('nonIntersectingLineOutside', () => {
    it('should detect line outside rectangle', () => {
      const rectangle = new ExtRectangle(new Rectangle(100, 100, 500, 500));
      const line = new Line(1, 1, 2, 2);
      
      const outside = rectangle.nonInteresectingLineOutside(line);
      expect(outside).toBe(true);
    });
  });
});
