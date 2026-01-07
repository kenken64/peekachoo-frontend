import { getApiUrl, getRazorpayKeyId, isDebugEnabled, logger } from '../src/config';

describe('Config', () => {
  // Save original values
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset environment
    jest.resetModules();
    process.env = { ...originalEnv };
    
    // Mock window object
    (global as any).window = {
      _env_: undefined,
      ENV_CONFIG: undefined,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    (global as any).window = originalWindow;
  });

  describe('getApiUrl', () => {
    it('should return runtime _env_ API_URL if set', () => {
      (global as any).window._env_ = { API_URL: 'https://runtime-api.com' };
      
      const { getApiUrl } = require('../src/config');
      expect(getApiUrl()).toBe('https://runtime-api.com');
    });

    it('should return process.env API_URL if _env_ not set', () => {
      process.env.API_URL = 'https://build-api.com';
      (global as any).window._env_ = undefined;
      
      const { getApiUrl } = require('../src/config');
      expect(getApiUrl()).toBe('https://build-api.com');
    });

    it('should return fallback URL if no env vars set', () => {
      delete process.env.API_URL;
      (global as any).window._env_ = undefined;
      
      const { getApiUrl } = require('../src/config');
      expect(getApiUrl()).toBe('http://localhost:3000/api');
    });
  });

  describe('getRazorpayKeyId', () => {
    it('should return runtime _env_ RAZORPAY_KEY_ID if set', () => {
      (global as any).window._env_ = { RAZORPAY_KEY_ID: 'runtime_key_123' };
      
      const { getRazorpayKeyId } = require('../src/config');
      expect(getRazorpayKeyId()).toBe('runtime_key_123');
    });

    it('should return process.env RAZORPAY_KEY_ID if _env_ not set', () => {
      process.env.RAZORPAY_KEY_ID = 'build_key_456';
      (global as any).window._env_ = undefined;
      
      const { getRazorpayKeyId } = require('../src/config');
      expect(getRazorpayKeyId()).toBe('build_key_456');
    });

    it('should return empty string if no env vars set', () => {
      delete process.env.RAZORPAY_KEY_ID;
      (global as any).window._env_ = undefined;
      
      const { getRazorpayKeyId } = require('../src/config');
      expect(getRazorpayKeyId()).toBe('');
    });
  });

  describe('isDebugEnabled', () => {
    it('should return true if _env_.DEBUG is "true"', () => {
      (global as any).window._env_ = { DEBUG: 'true' };
      
      const { isDebugEnabled } = require('../src/config');
      expect(isDebugEnabled()).toBe(true);
    });

    it('should return true if ENV_CONFIG.DEBUG is "true"', () => {
      (global as any).window._env_ = undefined;
      (global as any).window.ENV_CONFIG = { DEBUG: 'true' };
      
      const { isDebugEnabled } = require('../src/config');
      expect(isDebugEnabled()).toBe(true);
    });

    it('should return true if process.env.DEBUG is "true"', () => {
      process.env.DEBUG = 'true';
      (global as any).window._env_ = undefined;
      (global as any).window.ENV_CONFIG = undefined;
      
      const { isDebugEnabled } = require('../src/config');
      expect(isDebugEnabled()).toBe(true);
    });

    it('should return false if no debug env vars set', () => {
      delete process.env.DEBUG;
      (global as any).window._env_ = undefined;
      (global as any).window.ENV_CONFIG = undefined;
      
      const { isDebugEnabled } = require('../src/config');
      expect(isDebugEnabled()).toBe(false);
    });

    it('should return false if DEBUG is not "true"', () => {
      (global as any).window._env_ = { DEBUG: 'false' };
      
      const { isDebugEnabled } = require('../src/config');
      expect(isDebugEnabled()).toBe(false);
    });
  });

  describe('logger', () => {
    let consoleSpy: { [key: string]: jest.SpyInstance };

    beforeEach(() => {
      consoleSpy = {
        log: jest.spyOn(console, 'log').mockImplementation(() => {}),
        info: jest.spyOn(console, 'info').mockImplementation(() => {}),
        warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
        error: jest.spyOn(console, 'error').mockImplementation(() => {}),
        debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    describe('when debug is enabled', () => {
      beforeEach(() => {
        (global as any).window._env_ = { DEBUG: 'true' };
      });

      it('should log messages', () => {
        const { logger } = require('../src/config');
        logger.log('test message');
        expect(consoleSpy.log).toHaveBeenCalledWith('test message');
      });

      it('should log info messages', () => {
        const { logger } = require('../src/config');
        logger.info('info message');
        expect(consoleSpy.info).toHaveBeenCalledWith('info message');
      });

      it('should log warn messages', () => {
        const { logger } = require('../src/config');
        logger.warn('warn message');
        expect(consoleSpy.warn).toHaveBeenCalledWith('warn message');
      });

      it('should log debug messages', () => {
        const { logger } = require('../src/config');
        logger.debug('debug message');
        expect(consoleSpy.debug).toHaveBeenCalledWith('debug message');
      });
    });

    describe('when debug is disabled', () => {
      beforeEach(() => {
        (global as any).window._env_ = { DEBUG: 'false' };
        delete process.env.DEBUG;
      });

      it('should not log messages', () => {
        const { logger } = require('../src/config');
        logger.log('test message');
        expect(consoleSpy.log).not.toHaveBeenCalled();
      });

      it('should not log info messages', () => {
        const { logger } = require('../src/config');
        logger.info('info message');
        expect(consoleSpy.info).not.toHaveBeenCalled();
      });

      it('should not log warn messages', () => {
        const { logger } = require('../src/config');
        logger.warn('warn message');
        expect(consoleSpy.warn).not.toHaveBeenCalled();
      });

      it('should not log debug messages', () => {
        const { logger } = require('../src/config');
        logger.debug('debug message');
        expect(consoleSpy.debug).not.toHaveBeenCalled();
      });

      it('should always log error messages', () => {
        const { logger } = require('../src/config');
        logger.error('error message');
        expect(consoleSpy.error).toHaveBeenCalledWith('error message');
      });
    });
  });
});
