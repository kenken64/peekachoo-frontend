import { StringUtils } from '../src/utils/string-utils';

describe('StringUtils', () => {
  describe('padRight', () => {
    it('should pad string to specified length with spaces', () => {
      const result = StringUtils.padRight('hello', 10);
      expect(result).toBe('hello     ');
      expect(result.length).toBe(10);
    });

    it('should pad string with custom character', () => {
      const result = StringUtils.padRight('hi', 5, '-');
      expect(result).toBe('hi---');
    });

    it('should truncate string if longer than n', () => {
      const result = StringUtils.padRight('hello world', 5);
      expect(result).toBe('hello');
      expect(result.length).toBe(5);
    });

    it('should return string as-is if already n length', () => {
      const result = StringUtils.padRight('hello', 5);
      expect(result).toBe('hello');
    });

    it('should handle empty string', () => {
      const result = StringUtils.padRight('', 3);
      expect(result).toBe('   ');
    });

    it('should handle zero length', () => {
      const result = StringUtils.padRight('hello', 0);
      expect(result).toBe('');
    });
  });

  describe('prettyLine', () => {
    it('should format a line as string', () => {
      const mockLine = { x1: 0, y1: 0, x2: 100, y2: 200 };
      const result = StringUtils.prettyLine(mockLine as any);
      expect(result).toBe('[0,0],[100,200]');
    });

    it('should handle negative coordinates', () => {
      const mockLine = { x1: -10, y1: -20, x2: 30, y2: 40 };
      const result = StringUtils.prettyLine(mockLine as any);
      expect(result).toBe('[-10,-20],[30,40]');
    });

    it('should handle decimal coordinates', () => {
      const mockLine = { x1: 1.5, y1: 2.5, x2: 3.5, y2: 4.5 };
      const result = StringUtils.prettyLine(mockLine as any);
      expect(result).toBe('[1.5,2.5],[3.5,4.5]');
    });
  });

  describe('wrap', () => {
    it('should wrap long string at specified length', () => {
      const result = StringUtils.wrap('hello world', 5);
      expect(result).toBe('hello\n worl\nd');
    });

    it('should not wrap if string is shorter than n', () => {
      const result = StringUtils.wrap('hi', 10);
      expect(result).toBe('hi');
    });

    it('should handle exact length', () => {
      const result = StringUtils.wrap('hello', 5);
      expect(result).toBe('hello');
    });

    it('should wrap multiple times for long strings', () => {
      const result = StringUtils.wrap('abcdefghij', 3);
      expect(result).toBe('abc\ndef\nghi\nj');
    });

    it('should handle empty string', () => {
      const result = StringUtils.wrap('', 5);
      expect(result).toBe('');
    });
  });

  describe('dataToLines', () => {
    it('should format data into columns', () => {
      const cols = [10, 10];
      const data = ['Name', 'Age', 'Alice', '30', 'Bob', '25'];
      const result = StringUtils.dataToLines(cols, data);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Name      Age       ');
      expect(result[1]).toBe('Alice     30        ');
      expect(result[2]).toBe('Bob       25        ');
    });

    it('should handle single column', () => {
      const cols = [10];
      const data = ['One', 'Two', 'Three'];
      const result = StringUtils.dataToLines(cols, data);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('One       ');
    });

    it('should handle incomplete last row', () => {
      const cols = [5, 5, 5];
      const data = ['A', 'B', 'C', 'D'];
      const result = StringUtils.dataToLines(cols, data);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('A    B    C    ');
      expect(result[1]).toBe('D    ');
    });

    it('should handle empty data', () => {
      const cols = [10];
      const data: string[] = [];
      const result = StringUtils.dataToLines(cols, data);

      expect(result).toHaveLength(0);
    });

    it('should handle three columns', () => {
      const cols = [8, 8, 8];
      const data = ['Col1', 'Col2', 'Col3', 'Val1', 'Val2', 'Val3'];
      const result = StringUtils.dataToLines(cols, data);

      expect(result).toHaveLength(2);
    });
  });
});
