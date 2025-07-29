# Epic 8: Testing & Deployment

## Epic Overview
Establish comprehensive testing strategy and deployment pipeline for the PM Dashboard Chrome Extension. This epic ensures code quality, reliability, and smooth deployment to the Chrome Web Store and other distribution channels.

**Epic Goals:**
- Implement unit and integration testing
- Setup E2E testing for extension workflows
- Configure CI/CD pipeline
- Automate store submission
- Create monitoring and analytics

**Total Story Points:** 22 SP  
**Total Stories:** 4  
**Total Tickets:** 18  

---

## Story 8.1: Unit Testing
**Description:** Setup unit testing framework and write comprehensive tests for business logic, utilities, and components.

**Acceptance Criteria:**
- Jest configured for TypeScript
- React Testing Library setup
- 80%+ code coverage target
- Mock Chrome APIs
- Test utilities and helpers

### Tickets:

#### Ticket 8.1.1: Setup Jest and React Testing Library
- **Description:** Configure testing framework with TypeScript support and Chrome API mocks
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Install Jest and related dependencies
  - Configure for TypeScript and JSX
  - Setup React Testing Library
  - Create test utilities
  - Configure coverage reporting
- **Dependencies:** Epic 1 completion
- **Implementation Notes:**
  ```typescript
  // jest.config.js
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: [
      '**/__tests__/**/*.+(ts|tsx|js)',
      '**/?(*.)+(spec|test).+(ts|tsx|js)'
    ],
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    moduleNameMapper: {
      '^~/(.*)$': '<rootDir>/src/$1',
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: [
      '<rootDir>/src/test/setup.ts'
    ],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/test/**',
      '!src/**/*.stories.tsx',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    globals: {
      'ts-jest': {
        tsconfig: {
          jsx: 'react'
        }
      }
    }
  }
  
  // src/test/setup.ts
  import '@testing-library/jest-dom'
  import { TextEncoder, TextDecoder } from 'util'
  
  // Polyfills for Node
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder as any
  
  // Mock Chrome APIs
  global.chrome = {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      getManifest: jest.fn(() => ({
        version: '1.0.0',
        name: 'PM Dashboard'
      })),
      getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
      lastError: null
    },
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn(),
      },
      sync: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn(),
      },
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }
    },
    tabs: {
      create: jest.fn(),
      query: jest.fn(),
      update: jest.fn(),
      captureVisibleTab: jest.fn(),
    },
    alarms: {
      create: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      onAlarm: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }
    },
    notifications: {
      create: jest.fn(),
      clear: jest.fn(),
      update: jest.fn(),
    },
    identity: {
      launchWebAuthFlow: jest.fn(),
      getRedirectURL: jest.fn(() => 'https://fake-id.chromiumapp.org/'),
    }
  } as any
  
  // Mock window.crypto for tests
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      },
      subtle: {
        encrypt: jest.fn(),
        decrypt: jest.fn(),
        digest: jest.fn(),
        deriveKey: jest.fn(),
        importKey: jest.fn(),
      }
    }
  })
  
  // src/test/utils.tsx
  import { ReactElement } from 'react'
  import { render, RenderOptions } from '@testing-library/react'
  import { StorageProvider } from '@plasmohq/storage/hook'
  
  // Mock Plasmo storage
  jest.mock('@plasmohq/storage', () => ({
    Storage: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      getAll: jest.fn(),
    }))
  }))
  
  jest.mock('@plasmohq/storage/hook', () => ({
    useStorage: jest.fn((key, defaultValue) => {
      const [value, setValue] = React.useState(defaultValue)
      return [value, setValue]
    }),
    StorageProvider: ({ children }) => children
  }))
  
  interface AllTheProvidersProps {
    children: React.ReactNode
  }
  
  const AllTheProviders = ({ children }: AllTheProvidersProps) => {
    return (
      <StorageProvider>
        {children}
      </StorageProvider>
    )
  }
  
  const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ) => render(ui, { wrapper: AllTheProviders, ...options })
  
  export * from '@testing-library/react'
  export { customRender as render }
  
  // Test data factories
  export const createMockWidget = (overrides = {}) => ({
    id: 'test-widget',
    type: 'calculator',
    position: { x: 0, y: 0 },
    size: { width: 4, height: 3 },
    visible: true,
    ...overrides
  })
  
  export const createMockClip = (overrides = {}) => ({
    id: 'clip-123',
    type: 'text',
    content: {
      text: 'Test clip content',
      html: '<p>Test clip content</p>'
    },
    metadata: {
      url: 'https://example.com',
      title: 'Example Page',
      domain: 'example.com'
    },
    tags: ['test'],
    category: 'general',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false,
    isArchived: false,
    annotations: [],
    ...overrides
  })
  ```

#### Ticket 8.1.2: Write Tests for Calculator Logic
- **Description:** Create comprehensive unit tests for all calculator functions
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Test RICE score calculations
  - Test TAM/SAM/SOM calculations
  - Test ROI calculations
  - Test A/B test statistics
  - Edge case handling
  - Error scenarios
- **Dependencies:** 8.1.1, Epic 3
- **Implementation Notes:**
  ```typescript
  // src/lib/calculators/__tests__/rice.test.ts
  import { calculateRiceScore, getRiceScoreCategory } from '../rice'
  
  describe('RICE Score Calculator', () => {
    describe('calculateRiceScore', () => {
      it('should calculate correct RICE score', () => {
        const params = {
          reach: 1000,
          impact: 2,
          confidence: 80,
          effort: 4
        }
        
        // (1000 * 2 * 0.8) / 4 = 400
        expect(calculateRiceScore(params)).toBe(400)
      })
      
      it('should handle decimal values', () => {
        const params = {
          reach: 500,
          impact: 1.5,
          confidence: 75,
          effort: 2.5
        }
        
        // (500 * 1.5 * 0.75) / 2.5 = 225
        expect(calculateRiceScore(params)).toBe(225)
      })
      
      it('should handle edge case of zero effort', () => {
        const params = {
          reach: 1000,
          impact: 2,
          confidence: 80,
          effort: 0
        }
        
        expect(() => calculateRiceScore(params)).toThrow('Invalid input values')
      })
      
      it('should handle negative values', () => {
        const params = {
          reach: -100,
          impact: 2,
          confidence: 80,
          effort: 4
        }
        
        expect(() => calculateRiceScore(params)).toThrow('Invalid input values')
      })
      
      it('should convert confidence percentage correctly', () => {
        const params = {
          reach: 100,
          impact: 1,
          confidence: 100, // 100% = 1.0
          effort: 1
        }
        
        expect(calculateRiceScore(params)).toBe(100)
      })
    })
    
    describe('getRiceScoreCategory', () => {
      it('should categorize scores correctly', () => {
        expect(getRiceScoreCategory(150)).toEqual({
          label: 'Must Do',
          color: 'green',
          priority: 1
        })
        
        expect(getRiceScoreCategory(75)).toEqual({
          label: 'Should Do',
          color: 'yellow',
          priority: 2
        })
        
        expect(getRiceScoreCategory(30)).toEqual({
          label: 'Could Do',
          color: 'orange',
          priority: 3
        })
        
        expect(getRiceScoreCategory(10)).toEqual({
          label: "Won't Do",
          color: 'red',
          priority: 4
        })
      })
      
      it('should handle boundary values', () => {
        expect(getRiceScoreCategory(100).label).toBe('Must Do')
        expect(getRiceScoreCategory(99.99).label).toBe('Should Do')
        expect(getRiceScoreCategory(50).label).toBe('Should Do')
        expect(getRiceScoreCategory(49.99).label).toBe('Could Do')
      })
    })
  })
  
  // src/lib/calculators/__tests__/abtest.test.ts
  import { calculateABTest, calculateSampleSize } from '../abtest'
  
  describe('A/B Test Calculator', () => {
    describe('calculateABTest', () => {
      it('should detect significant difference', () => {
        const control = {
          visitors: 1000,
          conversions: 50 // 5%
        }
        
        const variant = {
          visitors: 1000,
          conversions: 80 // 8%
        }
        
        const config = {
          confidenceLevel: 95,
          testType: 'two-tailed' as const
        }
        
        const result = calculateABTest(control, variant, config)
        
        expect(result.isSignificant).toBe(true)
        expect(result.uplift).toBeCloseTo(60, 1) // 60% uplift
        expect(result.pValue).toBeLessThan(0.05)
      })
      
      it('should not detect insignificant difference', () => {
        const control = {
          visitors: 100,
          conversions: 5 // 5%
        }
        
        const variant = {
          visitors: 100,
          conversions: 6 // 6%
        }
        
        const config = {
          confidenceLevel: 95,
          testType: 'two-tailed' as const
        }
        
        const result = calculateABTest(control, variant, config)
        
        expect(result.isSignificant).toBe(false)
        expect(result.pValue).toBeGreaterThan(0.05)
      })
      
      it('should calculate confidence intervals', () => {
        const control = {
          visitors: 1000,
          conversions: 100
        }
        
        const variant = {
          visitors: 1000,
          conversions: 120
        }
        
        const config = {
          confidenceLevel: 95,
          testType: 'two-tailed' as const
        }
        
        const result = calculateABTest(control, variant, config)
        
        expect(result.confidenceInterval).toHaveLength(2)
        expect(result.confidenceInterval[0]).toBeLessThan(0.02) // Lower bound
        expect(result.confidenceInterval[1]).toBeGreaterThan(0.02) // Upper bound
      })
    })
    
    describe('calculateSampleSize', () => {
      it('should calculate required sample size', () => {
        const inputs = {
          baselineConversion: 5, // 5%
          minimumEffect: 20, // 20% relative uplift
          confidenceLevel: 95,
          power: 80,
          variations: 2
        }
        
        const result = calculateSampleSize(inputs)
        
        expect(result.perVariation).toBeGreaterThan(1000)
        expect(result.total).toBe(result.perVariation * 2)
      })
      
      it('should increase sample size for smaller effects', () => {
        const baseInputs = {
          baselineConversion: 5,
          confidenceLevel: 95,
          power: 80,
          variations: 2
        }
        
        const largeEffect = calculateSampleSize({
          ...baseInputs,
          minimumEffect: 50
        })
        
        const smallEffect = calculateSampleSize({
          ...baseInputs,
          minimumEffect: 10
        })
        
        expect(smallEffect.perVariation).toBeGreaterThan(largeEffect.perVariation)
      })
    })
  })
  ```

#### Ticket 8.1.3: Test Storage Operations
- **Description:** Write tests for all storage-related operations including encryption
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Test SecureStorage operations
  - Test data encryption/decryption
  - Test storage migrations
  - Test cache operations
  - Mock chrome.storage API
- **Dependencies:** 8.1.1, Epic 6
- **Implementation Notes:**
  ```typescript
  // src/lib/storage/__tests__/SecureStorage.test.ts
  import { SecureStorage } from '../SecureStorage'
  
  describe('SecureStorage', () => {
    let secureStorage: SecureStorage
    let mockCrypto: any
    
    beforeEach(() => {
      secureStorage = new SecureStorage()
      
      // Mock crypto operations
      mockCrypto = {
        getRandomValues: jest.fn((arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i
          }
          return arr
        }),
        subtle: {
          importKey: jest.fn().mockResolvedValue('mock-key'),
          deriveKey: jest.fn().mockResolvedValue('derived-key'),
          encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
          decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
          digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
        }
      }
      
      global.crypto = mockCrypto
      
      // Reset chrome.storage mocks
      ;(chrome.storage.local.get as jest.Mock).mockReset()
      ;(chrome.storage.local.set as jest.Mock).mockReset()
    })
    
    describe('setMasterPassword', () => {
      it('should derive key and store password hash', async () => {
        const password = 'test-password-123'
        
        await secureStorage.setMasterPassword(password)
        
        expect(mockCrypto.subtle.importKey).toHaveBeenCalled()
        expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'PBKDF2',
            iterations: 100000,
            hash: 'SHA-256'
          }),
          expect.any(String),
          expect.any(Object),
          false,
          ['encrypt', 'decrypt']
        )
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith(
          expect.objectContaining({
            'secure-storage-hash': expect.any(String),
            'secure-storage-salt': expect.any(String)
          })
        )
      })
      
      it('should migrate existing unencrypted data', async () => {
        // Setup existing unencrypted data
        ;(chrome.storage.local.get as jest.Mock)
          .mockResolvedValueOnce({ 'jira-api-key': 'unencrypted-key' })
          .mockResolvedValueOnce({ 'github-token': 'unencrypted-token' })
        
        await secureStorage.setMasterPassword('password')
        
        // Should remove unencrypted data
        expect(chrome.storage.local.remove).toHaveBeenCalledWith('jira-api-key')
        expect(chrome.storage.local.remove).toHaveBeenCalledWith('github-token')
      })
    })
    
    describe('unlock', () => {
      it('should unlock with correct password', async () => {
        const password = 'correct-password'
        const mockHash = 'mock-hash'
        const mockSalt = 'mock-salt'
        
        ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({
          'secure-storage-hash': mockHash,
          'secure-storage-salt': mockSalt
        })
        
        // Mock hash calculation to return same hash
        jest.spyOn(secureStorage as any, 'hashPassword')
          .mockResolvedValue(mockHash)
        
        const result = await secureStorage.unlock(password)
        
        expect(result).toBe(true)
        expect(secureStorage.isUnlocked).toBe(true)
      })
      
      it('should fail with incorrect password', async () => {
        ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({
          'secure-storage-hash': 'correct-hash',
          'secure-storage-salt': 'mock-salt'
        })
        
        jest.spyOn(secureStorage as any, 'hashPassword')
          .mockResolvedValue('wrong-hash')
        
        const result = await secureStorage.unlock('wrong-password')
        
        expect(result).toBe(false)
        expect(secureStorage.isUnlocked).toBe(false)
      })
    })
    
    describe('set/get operations', () => {
      beforeEach(async () => {
        // Setup unlocked storage
        await secureStorage.setMasterPassword('password')
        secureStorage.isUnlocked = true
      })
      
      it('should encrypt and store data', async () => {
        const key = 'test-key'
        const value = { secret: 'data' }
        
        await secureStorage.set(key, value)
        
        expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'AES-GCM' }),
          expect.any(String),
          expect.any(Uint8Array)
        )
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          [key]: expect.any(String) // Encrypted data
        })
      })
      
      it('should decrypt and retrieve data', async () => {
        const key = 'test-key'
        const originalValue = { secret: 'data' }
        const encryptedData = 'encrypted-base64'
        
        ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({
          [key]: encryptedData
        })
        
        // Mock decryption
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const jsonBuffer = encoder.encode(JSON.stringify(originalValue))
        
        jest.spyOn(secureStorage as any, 'decrypt')
          .mockResolvedValue(decoder.decode(jsonBuffer))
        
        const result = await secureStorage.get(key)
        
        expect(result).toEqual(originalValue)
      })
      
      it('should throw error when locked', async () => {
        secureStorage.isUnlocked = false
        
        await expect(secureStorage.set('key', 'value'))
          .rejects.toThrow('SecureStorage is locked')
        
        await expect(secureStorage.get('key'))
          .rejects.toThrow('SecureStorage is locked')
      })
    })
    
    describe('auto-lock', () => {
      beforeEach(() => {
        jest.useFakeTimers()
      })
      
      afterEach(() => {
        jest.useRealTimers()
      })
      
      it('should auto-lock after timeout', async () => {
        await secureStorage.setMasterPassword('password')
        expect(secureStorage.isUnlocked).toBe(true)
        
        // Fast-forward 15 minutes
        jest.advanceTimersByTime(15 * 60 * 1000)
        
        expect(secureStorage.isUnlocked).toBe(false)
      })
      
      it('should reset timer on activity', async () => {
        await secureStorage.setMasterPassword('password')
        
        // Activity after 10 minutes
        jest.advanceTimersByTime(10 * 60 * 1000)
        await secureStorage.get('some-key')
        
        // Should not lock after original 15 minutes
        jest.advanceTimersByTime(5 * 60 * 1000)
        expect(secureStorage.isUnlocked).toBe(true)
        
        // Should lock after 15 more minutes
        jest.advanceTimersByTime(10 * 60 * 1000)
        expect(secureStorage.isUnlocked).toBe(false)
      })
    })
  })
  
  // src/lib/storage/__tests__/ClipStorage.test.ts
  import { ClipStorage } from '../ClipStorage'
  import { Clip } from '~/types/clips'
  
  describe('ClipStorage', () => {
    let clipStorage: ClipStorage
    
    beforeEach(() => {
      clipStorage = new ClipStorage()
      ;(chrome.storage.local.get as jest.Mock).mockReset()
      ;(chrome.storage.local.set as jest.Mock).mockReset()
    })
    
    describe('saveClip', () => {
      it('should save clip with generated ID and timestamps', async () => {
        const clipData = {
          type: 'text' as const,
          content: { text: 'Test content' },
          metadata: {
            url: 'https://example.com',
            title: 'Test Page',
            domain: 'example.com'
          },
          tags: ['test'],
          category: 'general',
          annotations: [],
          isFavorite: false,
          isArchived: false
        }
        
        ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({ clips: [] })
        
        const savedClip = await clipStorage.saveClip(clipData)
        
        expect(savedClip).toMatchObject({
          ...clipData,
          id: expect.stringMatching(/^clip_\d+_[a-z0-9]+$/),
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number)
        })
        
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          clips: [savedClip]
        })
      })
      
      it('should enforce storage limit', async () => {
        // Create array of max clips
        const existingClips = Array.from({ length: 1000 }, (_, i) => ({
          id: `clip_${i}`,
          createdAt: Date.now() - i * 1000,
          isArchived: i < 10 // First 10 are archived
        }))
        
        ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({ 
          clips: existingClips 
        })
        
        const newClip = await clipStorage.saveClip({
          type: 'text' as const,
          content: { text: 'New clip' },
          metadata: { url: '', title: '', domain: '' },
          tags: [],
          category: 'general',
          annotations: [],
          isFavorite: false,
          isArchived: false
        })
        
        const savedClips = (chrome.storage.local.set as jest.Mock).mock.calls[0][0].clips
        
        // Should remove oldest archived clip
        expect(savedClips).toHaveLength(1000)
        expect(savedClips.find(c => c.id === 'clip_0')).toBeUndefined()
        expect(savedClips.find(c => c.id === newClip.id)).toBeDefined()
      })
    })
    
    describe('searchClips', () => {
      const mockClips: Clip[] = [
        {
          id: '1',
          type: 'text',
          content: { text: 'React hooks tutorial' },
          metadata: { 
            title: 'Learn React Hooks',
            url: 'https://react.dev',
            domain: 'react.dev'
          },
          tags: ['react', 'javascript'],
          category: 'development',
          createdAt: Date.now() - 86400000, // 1 day ago
          updatedAt: Date.now() - 86400000,
          isFavorite: true,
          isArchived: false,
          annotations: []
        },
        {
          id: '2',
          type: 'image',
          content: { imageUrl: 'https://example.com/design.png' },
          metadata: {
            title: 'UI Design Pattern',
            url: 'https://design.com',
            domain: 'design.com'
          },
          tags: ['design', 'ui'],
          category: 'design',
          createdAt: Date.now() - 172800000, // 2 days ago
          updatedAt: Date.now() - 172800000,
          isFavorite: false,
          isArchived: false,
          annotations: []
        }
      ]
      
      beforeEach(() => {
        ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({ 
          clips: mockClips 
        })
      })
      
      it('should search by text', async () => {
        const results = await clipStorage.searchClips({ search: 'react' })
        
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe('1')
      })
      
      it('should filter by type', async () => {
        const results = await clipStorage.searchClips({ type: 'image' })
        
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe('2')
      })
      
      it('should filter by tags', async () => {
        const results = await clipStorage.searchClips({ tags: ['design'] })
        
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe('2')
      })
      
      it('should filter by date range', async () => {
        const results = await clipStorage.searchClips({
          dateRange: {
            start: Date.now() - 90000000, // 1.04 days ago
            end: Date.now()
          }
        })
        
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe('1')
      })
      
      it('should combine multiple filters', async () => {
        const results = await clipStorage.searchClips({
          search: 'design',
          type: 'image',
          tags: ['ui']
        })
        
        expect(results).toHaveLength(1)
        expect(results[0].id).toBe('2')
      })
    })
  })
  ```

#### Ticket 8.1.4: Test Message Handlers
- **Description:** Write tests for all background message handlers and messaging flows
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Test OAuth callback handler
  - Test feed refresh handlers
  - Test clip save handler
  - Test API communication
  - Mock async operations
- **Dependencies:** 8.1.1
- **Implementation Notes:**
  ```typescript
  // src/background/messages/__tests__/oauth-callback.test.ts
  import handler from '../oauth-callback'
  import { secureStorage } from '~/lib/security/SecureStorage'
  import { tokenManager } from '~/lib/auth/TokenManager'
  
  jest.mock('~/lib/security/SecureStorage')
  jest.mock('~/lib/auth/TokenManager')
  
  describe('OAuth Callback Handler', () => {
    const mockRequest = (body: any) => ({
      body,
      sender: { id: 'test-extension' }
    })
    
    const mockResponse = () => ({
      send: jest.fn()
    })
    
    beforeEach(() => {
      jest.clearAllMocks()
      ;(chrome.storage.local.get as jest.Mock).mockReset()
      ;(chrome.storage.local.set as jest.Mock).mockReset()
      ;(chrome.storage.local.remove as jest.Mock).mockReset()
    })
    
    it('should handle successful OAuth callback', async () => {
      const req = mockRequest({
        url: 'https://redirect.url?code=auth-code&state=test-state:extra',
        provider: 'github'
      })
      const res = mockResponse()
      
      // Mock state validation
      ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({
        'oauth-state-github': 'test-state'
      })
      
      // Mock token exchange
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'test-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          scope: 'repo user'
        })
      })
      
      // Mock secure storage
      ;(secureStorage.set as jest.Mock).mockResolvedValue(undefined)
      
      // Mock token manager
      ;(tokenManager.scheduleTokenRefresh as jest.Mock).mockResolvedValue(undefined)
      
      await handler(req, res)
      
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        provider: 'github'
      })
      
      expect(secureStorage.set).toHaveBeenCalledWith(
        'oauth-tokens-github',
        expect.objectContaining({
          accessToken: 'test-token',
          refreshToken: 'refresh-token',
          expiresAt: expect.any(Number),
          scope: 'repo user'
        })
      )
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('oauth-state-github')
      expect(tokenManager.scheduleTokenRefresh).toHaveBeenCalledWith('github')
    })
    
    it('should handle OAuth error response', async () => {
      const req = mockRequest({
        url: 'https://redirect.url?error=access_denied&error_description=User+denied+access',
        provider: 'github'
      })
      const res = mockResponse()
      
      await handler(req, res)
      
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'User denied access',
        provider: 'github'
      })
    })
    
    it('should validate state parameter', async () => {
      const req = mockRequest({
        url: 'https://redirect.url?code=auth-code&state=wrong-state',
        provider: 'github'
      })
      const res = mockResponse()
      
      ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({
        'oauth-state-github': 'expected-state'
      })
      
      await handler(req, res)
      
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid state parameter - possible CSRF attack',
        provider: 'github'
      })
    })
    
    it('should fetch user info after token exchange', async () => {
      const req = mockRequest({
        url: 'https://redirect.url?code=auth-code&state=test-state',
        provider: 'github'
      })
      const res = mockResponse()
      
      ;(chrome.storage.local.get as jest.Mock).mockResolvedValue({
        'oauth-state-github': 'test-state'
      })
      
      // Mock token exchange
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-token',
            expires_in: 3600
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com'
          })
        })
      
      await handler(req, res)
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          }
        })
      )
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'github-user': expect.objectContaining({
          login: 'testuser',
          name: 'Test User'
        })
      })
    })
  })
  
  // src/background/messages/__tests__/save-clip.test.ts
  import saveClipHandler from '../save-clip'
  import { ClipStorage } from '~/lib/storage/ClipStorage'
  import { MetadataExtractor } from '~/lib/utils/MetadataExtractor'
  
  jest.mock('~/lib/storage/ClipStorage')
  jest.mock('~/lib/utils/MetadataExtractor')
  
  describe('Save Clip Handler', () => {
    let mockClipStorage: jest.Mocked<ClipStorage>
    let mockMetadataExtractor: jest.Mocked<MetadataExtractor>
    
    beforeEach(() => {
      mockClipStorage = new ClipStorage() as any
      mockMetadataExtractor = new MetadataExtractor() as any
      
      jest.clearAllMocks()
      ;(chrome.notifications.create as jest.Mock).mockReset()
    })
    
    it('should save text clip with metadata', async () => {
      const req = {
        body: {
          type: 'text',
          content: {
            text: 'Important product insight',
            html: '<p>Important product insight</p>'
          },
          url: 'https://example.com/article',
          title: 'Product Article'
        }
      }
      const res = { send: jest.fn() }
      
      // Mock metadata extraction
      mockMetadataExtractor.extract.mockResolvedValue({
        description: 'Article about product management',
        author: 'Jane Doe',
        keywords: ['product', 'management'],
        ogImage: 'https://example.com/image.jpg'
      })
      
      // Mock clip save
      const savedClip = {
        id: 'clip-123',
        metadata: { title: 'Product Article' }
      }
      mockClipStorage.saveClip.mockResolvedValue(savedClip as any)
      
      await saveClipHandler(req as any, res)
      
      expect(mockMetadataExtractor.extract).toHaveBeenCalledWith(req.body.url)
      
      expect(mockClipStorage.saveClip).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          content: req.body.content,
          metadata: expect.objectContaining({
            url: req.body.url,
            title: 'Product Article',
            description: 'Article about product management',
            author: 'Jane Doe'
          }),
          tags: expect.arrayContaining(['product', 'management'])
        })
      )
      
      expect(chrome.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: 'Clip Saved!',
          message: expect.stringContaining('Product Article')
        })
      )
      
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        clipId: 'clip-123'
      })
    })
    
    it('should suggest tags based on content', async () => {
      const req = {
        body: {
          type: 'text',
          content: {
            text: 'New feature announcement for our product roadmap #productupdate'
          },
          url: 'https://producthunt.com/posts/awesome-tool',
          title: 'Awesome Tool Launch'
        }
      }
      const res = { send: jest.fn() }
      
      mockMetadataExtractor.extract.mockResolvedValue({
        keywords: ['saas', 'productivity']
      })
      
      mockClipStorage.saveClip.mockImplementation(async (clip) => {
        // Verify suggested tags
        expect(clip.tags).toContain('producthunt.com')
        expect(clip.tags).toContain('productupdate') // From hashtag
        expect(clip.tags).toContain('product') // From content
        expect(clip.tags).toContain('feature') // From content
        expect(clip.tags).toContain('saas') // From metadata
        
        return { ...clip, id: 'clip-123' } as any
      })
      
      await saveClipHandler(req as any, res)
      
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        clipId: 'clip-123'
      })
    })
    
    it('should handle save errors', async () => {
      const req = {
        body: {
          type: 'text',
          content: { text: 'Test' },
          url: 'https://example.com',
          title: 'Test'
        }
      }
      const res = { send: jest.fn() }
      
      mockClipStorage.saveClip.mockRejectedValue(
        new Error('Storage limit reached')
      )
      
      await saveClipHandler(req as any, res)
      
      expect(chrome.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: 'Failed to Save Clip',
          message: 'Storage limit reached'
        })
      )
      
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: 'Storage limit reached'
      })
    })
  })
  ```

---

## Story 8.2: Integration Testing
**Description:** Setup integration testing for complex workflows and component interactions using Playwright.

**Acceptance Criteria:**
- Playwright configured for extension testing
- Test complete user workflows
- API integration tests
- Cross-component interactions
- Visual regression tests

### Tickets:

#### Ticket 8.2.1: Setup Playwright for Extension Testing
- **Description:** Configure Playwright to test Chrome extensions with proper setup
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Install Playwright and dependencies
  - Configure for extension context
  - Setup test utilities
  - Create page object models
  - Handle extension popups
- **Dependencies:** 8.1.1
- **Implementation Notes:**
  ```typescript
  // playwright.config.ts
  import { defineConfig, devices } from '@playwright/test'
  import path from 'path'
  
  export default defineConfig({
    testDir: './e2e',
    timeout: 30 * 1000,
    expect: {
      timeout: 5000
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
      ['html'],
      ['junit', { outputFile: 'test-results/junit.xml' }]
    ],
    use: {
      actionTimeout: 0,
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure'
    },
    
    projects: [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          // Load extension
          launchOptions: {
            args: [
              `--disable-extensions-except=${path.join(__dirname, 'build')}`,
              `--load-extension=${path.join(__dirname, 'build')}`
            ]
          }
        }
      }
    ],
    
    webServer: {
      command: 'pnpm build:test',
      port: 3000,
      reuseExistingServer: !process.env.CI
    }
  })
  
  // e2e/fixtures/extension.ts
  import { test as base, chromium, Page, BrowserContext } from '@playwright/test'
  import path from 'path'
  
  export class ExtensionPage {
    constructor(
      public page: Page,
      public context: BrowserContext,
      public extensionId: string
    ) {}
    
    async goto(path: string = '') {
      await this.page.goto(`chrome-extension://${this.extensionId}/${path}`)
    }
    
    async openPopup() {
      const [popup] = await Promise.all([
        this.context.waitForEvent('page'),
        this.page.click(`[id="${this.extensionId}"]`)
      ])
      return popup
    }
    
    async openOptionsPage() {
      await this.goto('options.html')
      return this.page
    }
    
    async openNewTab() {
      const newTab = await this.context.newPage()
      await newTab.goto('chrome://newtab')
      return newTab
    }
    
    async getBackgroundPage() {
      const pages = this.context.pages()
      const backgroundPage = pages.find(page => 
        page.url().includes('_generated_background_page.html')
      )
      return backgroundPage
    }
    
    async evaluateInBackground(fn: Function, ...args: any[]) {
      const background = await this.getBackgroundPage()
      if (!background) throw new Error('Background page not found')
      return background.evaluate(fn, ...args)
    }
  }
  
  type ExtensionFixtures = {
    extensionPage: ExtensionPage
  }
  
  export const test = base.extend<ExtensionFixtures>({
    extensionPage: async ({}, use) => {
      const pathToExtension = path.join(__dirname, '../../build')
      
      const context = await chromium.launchPersistentContext('', {
        headless: false,
        args: [
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`
        ]
      })
      
      // Get extension ID
      let [background] = context.serviceWorkers()
      if (!background) {
        background = await context.waitForEvent('serviceworker')
      }
      
      const extensionId = background.url().split('/')[2]
      
      const page = await context.newPage()
      const extensionPage = new ExtensionPage(page, context, extensionId)
      
      await use(extensionPage)
      await context.close()
    }
  })
  
  export { expect } from '@playwright/test'
  
  // e2e/helpers/storage.ts
  export async function setExtensionStorage(
    page: Page,
    data: Record<string, any>
  ) {
    await page.evaluate((storageData) => {
      return new Promise((resolve) => {
        chrome.storage.local.set(storageData, resolve)
      })
    }, data)
  }
  
  export async function getExtensionStorage(
    page: Page,
    keys?: string[]
  ): Promise<any> {
    return page.evaluate((storageKeys) => {
      return new Promise((resolve) => {
        if (storageKeys) {
          chrome.storage.local.get(storageKeys, resolve)
        } else {
          chrome.storage.local.get(null, resolve)
        }
      })
    }, keys)
  }
  
  export async function clearExtensionStorage(page: Page) {
    await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.clear(resolve)
      })
    })
  }
  
  // e2e/helpers/auth.ts
  export async function mockOAuthFlow(
    context: BrowserContext,
    provider: string,
    token: string
  ) {
    await context.route('**/oauth/authorize**', async (route) => {
      const url = new URL(route.request().url())
      const redirectUri = url.searchParams.get('redirect_uri')
      const state = url.searchParams.get('state')
      
      if (redirectUri && state) {
        await route.fulfill({
          status: 302,
          headers: {
            Location: `${redirectUri}?code=mock-auth-code&state=${state}`
          }
        })
      }
    })
    
    await context.route('**/oauth/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: token,
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token'
        })
      })
    })
  }
  ```

#### Ticket 8.2.2: Write Feed Integration Tests
- **Description:** Test complete feed fetching and display workflows
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Test Product Hunt integration
  - Test Hacker News integration
  - Test feed refresh mechanism
  - Test error handling
  - Mock API responses
- **Dependencies:** 8.2.1, Epic 4
- **Implementation Notes:**
  ```typescript
  // e2e/tests/feeds.spec.ts
  import { test, expect, ExtensionPage } from '../fixtures/extension'
  import { setExtensionStorage, clearExtensionStorage } from '../helpers/storage'
  import { mockProductHuntAPI, mockHackerNewsAPI } from '../helpers/api-mocks'
  
  test.describe('Data Feeds', () => {
    test.beforeEach(async ({ extensionPage }) => {
      await clearExtensionStorage(extensionPage.page)
      
      // Set default dashboard layout with feed widgets
      await setExtensionStorage(extensionPage.page, {
        'dashboard-layout': [
          {
            id: 'widget-1',
            type: 'product-hunt-feed',
            position: { x: 0, y: 0 },
            size: { width: 6, height: 4 },
            visible: true
          },
          {
            id: 'widget-2',
            type: 'hacker-news-feed',
            position: { x: 6, y: 0 },
            size: { width: 6, height: 4 },
            visible: true
          }
        ]
      })
    })
    
    test('should display Product Hunt feed', async ({ extensionPage, context }) => {
      // Mock Product Hunt API
      await mockProductHuntAPI(context, [
        {
          id: '1',
          name: 'Awesome Product',
          tagline: 'The best product ever',
          votesCount: 100,
          commentsCount: 25,
          thumbnail: { url: 'https://example.com/thumbnail.jpg' },
          topics: { edges: [{ node: { name: 'Productivity' } }] },
          user: { name: 'John Doe', username: 'johndoe' }
        }
      ])
      
      // Open dashboard
      const dashboard = await extensionPage.openNewTab()
      
      // Wait for Product Hunt widget
      const phWidget = await dashboard.waitForSelector('[data-widget-type="product-hunt-feed"]')
      
      // Verify feed loaded
      await expect(phWidget).toContainText('Product Hunt')
      
      // Wait for products to load
      const productCard = await dashboard.waitForSelector('[data-testid="product-card"]')
      await expect(productCard).toContainText('Awesome Product')
      await expect(productCard).toContainText('The best product ever')
      await expect(productCard).toContainText('100')
      await expect(productCard).toContainText('25')
      
      // Test refresh
      await dashboard.click('[data-testid="refresh-product-hunt"]')
      
      // Should show loading state
      await expect(phWidget).toContainText('Loading')
      
      // Wait for refresh to complete
      await dashboard.waitForSelector('[data-testid="product-card"]')
    })
    
    test('should display Hacker News feed', async ({ extensionPage, context }) => {
      // Mock HN API
      await mockHackerNewsAPI(context, {
        topStories: [1, 2, 3],
        items: {
          1: {
            id: 1,
            title: 'Important Tech News',
            url: 'https://example.com/news',
            score: 150,
            by: 'hackernews',
            descendants: 75,
            time: Math.floor(Date.now() / 1000)
          },
          2: {
            id: 2,
            title: 'Ask HN: Best PM tools?',
            text: 'What are your favorite product management tools?',
            score: 89,
            by: 'pmuser',
            descendants: 45,
            time: Math.floor(Date.now() / 1000) - 3600
          }
        }
      })
      
      const dashboard = await extensionPage.openNewTab()
      
      // Wait for HN widget
      const hnWidget = await dashboard.waitForSelector('[data-widget-type="hacker-news-feed"]')
      
      // Verify stories loaded
      const story1 = await dashboard.waitForSelector('[data-story-id="1"]')
      await expect(story1).toContainText('Important Tech News')
      await expect(story1).toContainText('150 points')
      await expect(story1).toContainText('75 comments')
      
      const story2 = await dashboard.waitForSelector('[data-story-id="2"]')
      await expect(story2).toContainText('Ask HN: Best PM tools?')
      await expect(story2).toContainText('What are your favorite')
      
      // Test story type toggle
      await dashboard.click('[data-testid="story-type-new"]')
      
      // Mock new stories API call
      await mockHackerNewsAPI(context, {
        newStories: [4, 5],
        items: {
          4: { 
            id: 4, 
            title: 'Brand New Story',
            score: 1,
            by: 'newuser',
            time: Math.floor(Date.now() / 1000)
          }
        }
      })
      
      // Should load new stories
      await dashboard.waitForSelector('[data-story-id="4"]')
    })
    
    test('should handle feed errors gracefully', async ({ extensionPage, context }) => {
      // Mock API errors
      await context.route('**/api.producthunt.com/**', route => {
        route.fulfill({ status: 500, body: 'Server Error' })
      })
      
      const dashboard = await extensionPage.openNewTab()
      const phWidget = await dashboard.waitForSelector('[data-widget-type="product-hunt-feed"]')
      
      // Should show error state
      await expect(phWidget).toContainText('Failed to load')
      
      // Should have retry button
      const retryButton = await phWidget.waitForSelector('button:has-text("Retry")')
      
      // Mock successful response
      await mockProductHuntAPI(context, [])
      
      // Click retry
      await retryButton.click()
      
      // Should clear error
      await expect(phWidget).not.toContainText('Failed to load')
    })
    
    test('should persist feed data across sessions', async ({ extensionPage, context }) => {
      // Mock initial load
      await mockProductHuntAPI(context, [
        { id: '1', name: 'Persistent Product' }
      ])
      
      const dashboard = await extensionPage.openNewTab()
      await dashboard.waitForSelector('[data-testid="product-card"]')
      
      // Close and reopen dashboard
      await dashboard.close()
      
      // Open new dashboard - should show cached data
      const newDashboard = await extensionPage.openNewTab()
      
      // Should immediately show cached product (no loading)
      const cachedProduct = await newDashboard.waitForSelector(
        '[data-testid="product-card"]:has-text("Persistent Product")',
        { timeout: 1000 } // Short timeout since it should be instant
      )
      
      expect(cachedProduct).toBeTruthy()
    })
    
    test('should respect feed refresh intervals', async ({ extensionPage }) => {
      const dashboard = await extensionPage.openNewTab()
      
      // Check background alarms
      const alarms = await extensionPage.evaluateInBackground(() => {
        return new Promise(resolve => {
          chrome.alarms.getAll(resolve)
        })
      })
      
      // Should have alarms for each feed
      expect(alarms).toContainEqual(
        expect.objectContaining({ name: 'fetch-product-hunt' })
      )
      expect(alarms).toContainEqual(
        expect.objectContaining({ name: 'fetch-hacker-news' })
      )
      
      // Test manual refresh updates alarm
      await dashboard.click('[data-testid="refresh-product-hunt"]')
      
      const updatedAlarms = await extensionPage.evaluateInBackground(() => {
        return new Promise(resolve => {
          chrome.alarms.get('fetch-product-hunt', alarm => resolve(alarm))
        })
      })
      
      // Next alarm should be ~30 minutes from now
      const expectedTime = Date.now() + 30 * 60 * 1000
      expect(updatedAlarms.scheduledTime).toBeGreaterThan(expectedTime - 60000)
      expect(updatedAlarms.scheduledTime).toBeLessThan(expectedTime + 60000)
    })
  })
  
  // e2e/helpers/api-mocks.ts
  export async function mockProductHuntAPI(
    context: BrowserContext,
    products: any[]
  ) {
    await context.route('**/api.producthunt.com/v2/api/graphql', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            posts: {
              edges: products.map(p => ({ node: p })),
              pageInfo: {
                hasNextPage: false,
                endCursor: null
              }
            }
          }
        })
      })
    })
  }
  
  export async function mockHackerNewsAPI(
    context: BrowserContext,
    data: { 
      topStories?: number[]
      newStories?: number[]
      items: Record<number, any>
    }
  ) {
    // Mock story lists
    if (data.topStories) {
      await context.route('**/topstories.json', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data.topStories)
        })
      })
    }
    
    if (data.newStories) {
      await context.route('**/newstories.json', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data.newStories)
        })
      })
    }
    
    // Mock individual items
    await context.route('**/item/*.json', async (route) => {
      const id = parseInt(route.request().url().match(/item\/(\d+)\.json/)?.[1] || '0')
      const item = data.items[id]
      
      await route.fulfill({
        status: item ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(item || null)
      })
    })
  }
  ```

#### Ticket 8.2.3: Test OAuth Flows
- **Description:** Integration tests for complete OAuth authentication flows
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Test GitHub OAuth
  - Test Jira OAuth
  - Test token refresh
  - Test error scenarios
  - Mock OAuth providers
- **Dependencies:** 8.2.1, Epic 6
- **Implementation Notes:**
  ```typescript
  // e2e/tests/oauth.spec.ts
  import { test, expect } from '../fixtures/extension'
  import { mockOAuthFlow } from '../helpers/auth'
  import { setExtensionStorage } from '../helpers/storage'
  
  test.describe('OAuth Authentication', () => {
    test('should complete GitHub OAuth flow', async ({ extensionPage, context }) => {
      // Mock GitHub OAuth
      await mockOAuthFlow(context, 'github', 'mock-github-token')
      
      // Mock user API
      await context.route('**/api.github.com/user', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg'
          })
        })
      })
      
      // Open settings
      const settings = await extensionPage.openOptionsPage()
      
      // Navigate to API keys
      await settings.click('[data-tab="api-keys"]')
      
      // Click connect GitHub
      const connectButton = await settings.waitForSelector(
        'button:has-text("Connect GitHub")'
      )
      await connectButton.click()
      
      // Should open OAuth window
      const [authPage] = await Promise.all([
        context.waitForEvent('page'),
        connectButton.click()
      ])
      
      // Wait for redirect
      await authPage.waitForURL(/chrome-extension:.*\/tabs\/auth\.html/)
      
      // Should show success
      await expect(authPage).toContainText('Connected to GitHub!')
      await expect(authPage).toContainText('This window will close')
      
      // Wait for auto-close
      await authPage.waitForEvent('close', { timeout: 5000 })
      
      // Settings should update
      await expect(settings).toContainText('testuser')
      await expect(settings).toContainText('Connected')
      
      // Verify token stored securely
      const storage = await extensionPage.evaluateInBackground(() => {
        return new Promise(resolve => {
          chrome.storage.local.get(['github-user'], resolve)
        })
      })
      
      expect(storage['github-user']).toEqual({
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg'
      })
    })
    
    test('should handle OAuth errors', async ({ extensionPage, context }) => {
      // Open settings
      const settings = await extensionPage.openOptionsPage()
      await settings.click('[data-tab="api-keys"]')
      
      // Mock OAuth error
      await context.route('**/oauth/authorize**', async (route) => {
        const url = new URL(route.request().url())
        const redirectUri = url.searchParams.get('redirect_uri')
        
        await route.fulfill({
          status: 302,
          headers: {
            Location: `${redirectUri}?error=access_denied&error_description=User+denied+access`
          }
        })
      })
      
      // Try to connect
      const [authPage] = await Promise.all([
        context.waitForEvent('page'),
        settings.click('button:has-text("Connect GitHub")')
      ])
      
      // Should show error
      await expect(authPage).toContainText('Authentication Failed')
      await expect(authPage).toContainText('User denied access')
      
      // Should have retry button
      await authPage.click('button:has-text("Try Again")')
      
      // Should reload auth flow
      await authPage.waitForURL(/oauth\/authorize/)
    })
    
    test('should refresh expired tokens', async ({ extensionPage, context }) => {
      // Setup expired token
      await extensionPage.evaluateInBackground(() => {
        return new Promise(resolve => {
          // Mock secure storage
          window.secureStorage = {
            get: async (key) => {
              if (key === 'oauth-tokens-github') {
                return {
                  accessToken: 'expired-token',
                  refreshToken: 'refresh-token',
                  expiresAt: Date.now() - 1000 // Expired
                }
              }
            },
            set: jest.fn()
          }
          resolve(null)
        })
      })
      
      // Mock token refresh
      await context.route('**/oauth/token', async (route) => {
        const body = await route.request().postData()
        
        if (body?.includes('grant_type=refresh_token')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'new-token',
              expires_in: 3600
            })
          })
        }
      })
      
      // Mock API call that triggers refresh
      await context.route('**/api.github.com/user/repos', async (route) => {
        const auth = route.request().headers()['authorization']
        
        if (auth === 'Bearer new-token') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ name: 'test-repo' }])
          })
        } else {
          await route.fulfill({ status: 401 })
        }
      })
      
      // Open dashboard with GitHub widget
      await setExtensionStorage(extensionPage.page, {
        'dashboard-layout': [{
          id: 'github-widget',
          type: 'github-stats',
          visible: true
        }]
      })
      
      const dashboard = await extensionPage.openNewTab()
      
      // Widget should load with refreshed token
      await expect(dashboard).toContainText('test-repo')
      
      // Verify token was refreshed
      const refreshCalled = await extensionPage.evaluateInBackground(() => {
        return window.secureStorage.set.mock.calls.some(
          call => call[0] === 'oauth-tokens-github' && 
                  call[1].accessToken === 'new-token'
        )
      })
      
      expect(refreshCalled).toBeTruthy()
    })
    
    test('should handle concurrent OAuth flows', async ({ extensionPage, context }) => {
      // Setup mock OAuth for multiple providers
      await mockOAuthFlow(context, 'github', 'github-token')
      await mockOAuthFlow(context, 'jira', 'jira-token')
      
      const settings = await extensionPage.openOptionsPage()
      await settings.click('[data-tab="api-keys"]')
      
      // Start both OAuth flows
      const [githubAuth, jiraAuth] = await Promise.all([
        context.waitForEvent('page'),
        context.waitForEvent('page'),
        settings.click('button:has-text("Connect GitHub")'),
        settings.click('button:has-text("Connect Jira")')
      ])
      
      // Both should complete successfully
      await Promise.all([
        expect(githubAuth).toContainText('Connected to GitHub!'),
        expect(jiraAuth).toContainText('Connected to Jira!')
      ])
      
      // Settings should show both connected
      await expect(settings).toContainText('GitHub: Connected')
      await expect(settings).toContainText('Jira: Connected')
    })
  })
  ```

---

## Story 8.3: Build & Package
**Description:** Configure production build process and packaging for distribution.

**Acceptance Criteria:**
- Optimized production builds
- Code splitting and lazy loading
- Asset optimization
- Multiple browser support
- Version management

### Tickets:

#### Ticket 8.3.1: Configure Production Build Optimizations
- **Description:** Setup build process with minification, tree shaking, and optimizations
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Configure webpack optimizations
  - Enable code splitting
  - Optimize bundle sizes
  - Generate source maps
  - Add build analysis
- **Dependencies:** Epic 1
- **Implementation Notes:**
  ```typescript
  // build.config.ts
  import { defineConfig } from 'plasmo'
  
  export default defineConfig({
    manifest: {
      version: process.env.VERSION || '1.0.0'
    },
    
    build: {
      // Enable production optimizations
      overrides: {
        optimization: {
          minimize: true,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
                priority: 10,
                reuseExistingChunk: true
              },
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true
              },
              // Separate heavy libraries
              charts: {
                test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
                name: 'charts',
                priority: 20
              },
              icons: {
                test: /[\\/]node_modules[\\/]@heroicons[\\/]/,
                name: 'icons',
                priority: 15
              }
            }
          },
          // Tree shaking
          usedExports: true,
          sideEffects: false
        },
        
        module: {
          rules: [
            {
              test: /\.(js|jsx|ts|tsx)$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    ['@babel/preset-env', {
                      targets: 'last 2 Chrome versions',
                      modules: false
                    }],
                    '@babel/preset-react',
                    '@babel/preset-typescript'
                  ],
                  plugins: [
                    // Remove console logs in production
                    process.env.NODE_ENV === 'production' && 
                      ['transform-remove-console', { exclude: ['error', 'warn'] }],
                    // Dynamic imports for code splitting
                    '@babel/plugin-syntax-dynamic-import'
                  ].filter(Boolean)
                }
              }
            }
          ]
        },
        
        // Production source maps
        devtool: process.env.NODE_ENV === 'production' 
          ? 'hidden-source-map' 
          : 'cheap-module-source-map'
      }
    }
  })
  
  // scripts/optimize-build.ts
  import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
  import TerserPlugin from 'terser-webpack-plugin'
  import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
  import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin'
  
  export function getOptimizationConfig(analyze = false) {
    return {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: { ecma: 8 },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: true,
              drop_debugger: true
            },
            mangle: { safari10: true },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true
            }
          }
        }),
        
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: true
              }
            ]
          }
        })
      ],
      
      plugins: [
        // Optimize images
        new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.imageminMinify,
            options: {
              plugins: [
                ['imagemin-gifsicle', { interlaced: true }],
                ['imagemin-mozjpeg', { progressive: true }],
                ['imagemin-pngquant', { quality: [0.6, 0.8] }],
                ['imagemin-svgo', { plugins: [{ name: 'preset-default' }] }]
              ]
            }
          }
        }),
        
        // Bundle analysis
        analyze && new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
          openAnalyzer: false
        })
      ].filter(Boolean)
    }
  }
  
  // scripts/build-production.ts
  import { execSync } from 'child_process'
  import fs from 'fs-extra'
  import path from 'path'
  import { zip } from 'zip-a-folder'
  
  async function buildProduction() {
    console.log('🏗️  Building production extension...')
    
    // Clean build directory
    await fs.remove('./build')
    
    // Set production env
    process.env.NODE_ENV = 'production'
    process.env.VERSION = require('../package.json').version
    
    // Run Plasmo build
    execSync('plasmo build', { stdio: 'inherit' })
    
    // Additional optimizations
    await optimizeBuild()
    
    // Generate zip for each browser
    await createDistributions()
    
    console.log('✅ Production build complete!')
  }
  
  async function optimizeBuild() {
    const buildDir = './build'
    
    // Remove unnecessary files
    const unnecessaryFiles = [
      '.map',
      '.DS_Store',
      'Thumbs.db',
      '.gitkeep'
    ]
    
    const files = await fs.readdir(buildDir, { recursive: true })
    
    for (const file of files) {
      if (unnecessaryFiles.some(pattern => file.includes(pattern))) {
        await fs.remove(path.join(buildDir, file))
      }
    }
    
    // Optimize manifest.json
    const manifestPath = path.join(buildDir, 'manifest.json')
    const manifest = await fs.readJson(manifestPath)
    
    // Remove development permissions
    if (manifest.permissions) {
      manifest.permissions = manifest.permissions.filter(
        p => !['debugger', 'management'].includes(p)
      )
    }
    
    await fs.writeJson(manifestPath, manifest, { spaces: 0 })
  }
  
  async function createDistributions() {
    const version = require('../package.json').version
    const distDir = './dist'
    
    await fs.ensureDir(distDir)
    
    // Chrome distribution
    await zip('./build/chrome-mv3', `${distDir}/pm-dashboard-chrome-${version}.zip`)
    
    // Firefox distribution (if built)
    if (await fs.pathExists('./build/firefox-mv2')) {
      await zip('./build/firefox-mv2', `${distDir}/pm-dashboard-firefox-${version}.zip`)
    }
    
    // Generate checksums
    const crypto = require('crypto')
    const files = await fs.readdir(distDir)
    
    for (const file of files) {
      if (file.endsWith('.zip')) {
        const content = await fs.readFile(path.join(distDir, file))
        const hash = crypto.createHash('sha256').update(content).digest('hex')
        await fs.writeFile(
          path.join(distDir, `${file}.sha256`),
          `${hash}  ${file}\n`
        )
      }
    }
  }
  
  buildProduction().catch(console.error)
  ```

#### Ticket 8.3.2: Setup Build Scripts for Multiple Browsers
- **Description:** Create build configurations for Chrome, Firefox, and Edge
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Chrome Manifest V3 build
  - Firefox Manifest V2 build
  - Edge compatibility
  - Browser-specific polyfills
  - Conditional features
- **Dependencies:** 8.3.1
- **Implementation Notes:**
  ```typescript
  // package.json scripts
  {
    "scripts": {
      "dev": "plasmo dev",
      "dev:firefox": "plasmo dev --target=firefox-mv2",
      "build": "plasmo build",
      "build:chrome": "plasmo build --target=chrome-mv3",
      "build:firefox": "plasmo build --target=firefox-mv2",
      "build:edge": "plasmo build --target=edge-mv3",
      "build:all": "npm-run-all build:chrome build:firefox build:edge",
      "package": "plasmo package",
      "package:all": "ts-node scripts/package-all.ts"
    }
  }
  
  // scripts/package-all.ts
  import { execSync } from 'child_process'
  import fs from 'fs-extra'
  import path from 'path'
  
  interface BrowserConfig {
    target: string
    outputDir: string
    modifications?: (manifest: any) => any
  }
  
  const browsers: Record<string, BrowserConfig> = {
    chrome: {
      target: 'chrome-mv3',
      outputDir: 'build/chrome'
    },
    firefox: {
      target: 'firefox-mv2',
      outputDir: 'build/firefox',
      modifications: (manifest) => {
        // Firefox-specific modifications
        delete manifest.background.service_worker
        manifest.background.scripts = ['background.js']
        
        // Firefox doesn't support some Chrome APIs
        if (manifest.permissions) {
          manifest.permissions = manifest.permissions.filter(
            p => !['offscreen'].includes(p)
          )
        }
        
        // Add Firefox-specific permissions
        manifest.permissions.push('browserSettings')
        
        // Browser-specific settings
        manifest.browser_specific_settings = {
          gecko: {
            id: 'pm-dashboard@example.com',
            strict_min_version: '91.0'
          }
        }
        
        return manifest
      }
    },
    edge: {
      target: 'edge-mv3',
      outputDir: 'build/edge',
      modifications: (manifest) => {
        // Edge-specific modifications
        manifest.browser_specific_settings = {
          edge: {
            browser_action_next_to_addressbar: true
          }
        }
        return manifest
      }
    }
  }
  
  async function buildAllBrowsers() {
    for (const [browser, config] of Object.entries(browsers)) {
      console.log(`\n🏗️  Building for ${browser}...`)
      
      try {
        // Clean output directory
        await fs.remove(config.outputDir)
        
        // Build with Plasmo
        execSync(`plasmo build --target=${config.target}`, { 
          stdio: 'inherit' 
        })
        
        // Apply browser-specific modifications
        if (config.modifications) {
          const manifestPath = path.join(config.outputDir, 'manifest.json')
          const manifest = await fs.readJson(manifestPath)
          const modified = config.modifications(manifest)
          await fs.writeJson(manifestPath, modified, { spaces: 2 })
        }
        
        // Copy browser-specific files if they exist
        const browserSpecificDir = `src/browser-specific/${browser}`
        if (await fs.pathExists(browserSpecificDir)) {
          await fs.copy(browserSpecificDir, config.outputDir)
        }
        
        // Package
        execSync(`plasmo package --target=${config.target}`, {
          stdio: 'inherit'
        })
        
        console.log(`✅ ${browser} build complete!`)
      } catch (error) {
        console.error(`❌ ${browser} build failed:`, error)
      }
    }
  }
  
  // Browser-specific code handling
  // src/lib/browser-compat.ts
  export const browserCompat = {
    isFirefox: () => {
      return navigator.userAgent.includes('Firefox')
    },
    
    isEdge: () => {
      return navigator.userAgent.includes('Edg/')
    },
    
    storage: {
      // Firefox doesn't support storage.session
      session: browserCompat.isFirefox() 
        ? chrome.storage.local 
        : chrome.storage.session
    },
    
    // Handle API differences
    tabs: {
      captureVisibleTab: async (windowId?: number, options?: any) => {
        if (browserCompat.isFirefox()) {
          // Firefox requires different parameters
          return browser.tabs.captureVisibleTab(windowId, options)
        }
        return chrome.tabs.captureVisibleTab(windowId, options)
      }
    },
    
    // Polyfill missing APIs
    action: chrome.action || chrome.browserAction,
    
    // Handle permission differences
    permissions: {
      request: async (permissions: chrome.permissions.Permissions) => {
        // Filter out unsupported permissions for each browser
        const filtered = { ...permissions }
        
        if (browserCompat.isFirefox()) {
          filtered.permissions = filtered.permissions?.filter(
            p => !['offscreen', 'sidePanel'].includes(p)
          )
        }
        
        return chrome.permissions.request(filtered)
      }
    }
  }
  
  // Use browser compatibility layer
  // src/background.ts
  import { browserCompat } from '~/lib/browser-compat'
  
  // Use compat layer instead of direct Chrome APIs
  browserCompat.action.onClicked.addListener(() => {
    browserCompat.tabs.create({ url: 'newtab.html' })
  })
  ```

#### Ticket 8.3.3: Create Release Automation
- **Description:** Automate version bumping, changelog generation, and release creation
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Semantic versioning
  - Automated changelog
  - Git tagging
  - GitHub release creation
  - Asset uploading
- **Dependencies:** 8.3.2
- **Implementation Notes:**
  ```typescript
  // scripts/release.ts
  import { execSync } from 'child_process'
  import fs from 'fs-extra'
  import path from 'path'
  import semver from 'semver'
  import { Octokit } from '@octokit/rest'
  import conventionalChangelog from 'conventional-changelog'
  
  interface ReleaseOptions {
    type: 'patch' | 'minor' | 'major' | 'prerelease'
    prerelease?: boolean
    dryRun?: boolean
  }
  
  async function release(options: ReleaseOptions) {
    const { type, prerelease, dryRun } = options
    
    console.log('🚀 Starting release process...')
    
    // Check git status
    const gitStatus = execSync('git status --porcelain').toString()
    if (gitStatus && !dryRun) {
      throw new Error('Working directory is not clean. Commit or stash changes.')
    }
    
    // Get current version
    const packageJson = await fs.readJson('./package.json')
    const currentVersion = packageJson.version
    
    // Calculate new version
    const newVersion = semver.inc(currentVersion, type, prerelease ? 'beta' : undefined)
    if (!newVersion) {
      throw new Error('Failed to calculate new version')
    }
    
    console.log(`📦 Bumping version from ${currentVersion} to ${newVersion}`)
    
    if (!dryRun) {
      // Update package.json
      packageJson.version = newVersion
      await fs.writeJson('./package.json', packageJson, { spaces: 2 })
      
      // Update manifest.json version
      const manifestPath = './src/manifest.json'
      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJson(manifestPath)
        manifest.version = newVersion
        await fs.writeJson(manifestPath, manifest, { spaces: 2 })
      }
    }
    
    // Generate changelog
    const changelog = await generateChangelog(currentVersion, newVersion)
    console.log('📝 Generated changelog')
    
    if (!dryRun) {
      // Update CHANGELOG.md
      await updateChangelog(changelog, newVersion)
      
      // Commit changes
      execSync('git add -A')
      execSync(`git commit -m "chore(release): v${newVersion}"`)
      
      // Create tag
      execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`)
      
      console.log('🏗️  Building release artifacts...')
      
      // Build all versions
      execSync('npm run build:all', { stdio: 'inherit' })
      
      // Create GitHub release
      await createGitHubRelease(newVersion, changelog, prerelease)
      
      // Push changes
      execSync('git push')
      execSync('git push --tags')
    }
    
    console.log(`✅ Release ${newVersion} complete!`)
    
    if (dryRun) {
      console.log('\n📋 Dry run complete. No changes were made.')
      console.log('\nChangelog preview:')
      console.log(changelog)
    }
  }
  
  async function generateChangelog(fromVersion: string, toVersion: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let changelog = ''
      
      const stream = conventionalChangelog({
        preset: 'angular',
        releaseCount: 1,
        tagPrefix: 'v'
      })
      
      stream.on('data', (chunk) => {
        changelog += chunk.toString()
      })
      
      stream.on('end', () => {
        resolve(changelog)
      })
      
      stream.on('error', reject)
    })
  }
  
  async function updateChangelog(newContent: string, version: string) {
    const changelogPath = './CHANGELOG.md'
    
    let existingContent = ''
    if (await fs.pathExists(changelogPath)) {
      existingContent = await fs.readFile(changelogPath, 'utf-8')
    }
    
    // Add header if new file
    if (!existingContent) {
      existingContent = '# Changelog\n\nAll notable changes to PM Dashboard will be documented in this file.\n\n'
    }
    
    // Insert new version content after header
    const headerEnd = existingContent.indexOf('\n## ')
    
    if (headerEnd > -1) {
      existingContent = 
        existingContent.slice(0, headerEnd) + 
        '\n' + newContent + 
        existingContent.slice(headerEnd)
    } else {
      existingContent += '\n' + newContent
    }
    
    await fs.writeFile(changelogPath, existingContent)
  }
  
  async function createGitHubRelease(
    version: string,
    changelog: string,
    prerelease = false
  ) {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })
    
    const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') || []
    
    if (!owner || !repo) {
      console.warn('⚠️  Skipping GitHub release (GITHUB_REPOSITORY not set)')
      return
    }
    
    // Create release
    const release = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: `v${version}`,
      name: `v${version}`,
      body: changelog,
      draft: false,
      prerelease
    })
    
    console.log('📦 Uploading release assets...')
    
    // Upload distribution files
    const distDir = './dist'
    const files = await fs.readdir(distDir)
    
    for (const file of files) {
      if (file.endsWith('.zip') || file.endsWith('.sha256')) {
        const filePath = path.join(distDir, file)
        const content = await fs.readFile(filePath)
        
        await octokit.repos.uploadReleaseAsset({
          owner,
          repo,
          release_id: release.data.id,
          name: file,
          data: content as any
        })
        
        console.log(`  ✅ Uploaded ${file}`)
      }
    }
  }
  
  // CLI interface
  import { program } from 'commander'
  
  program
    .option('-t, --type <type>', 'Release type', 'patch')
    .option('-p, --prerelease', 'Create prerelease')
    .option('-d, --dry-run', 'Perform dry run')
    .parse()
  
  const options = program.opts()
  
  release({
    type: options.type,
    prerelease: options.prerelease,
    dryRun: options.dryRun
  }).catch(console.error)
  ```

---

## Story 8.4: CI/CD & Store Submission
**Description:** Setup continuous integration, deployment pipelines, and automated store submission.

**Acceptance Criteria:**
- GitHub Actions workflow
- Automated testing in CI
- Build validation
- Chrome Web Store submission
- Release notifications

### Tickets:

#### Ticket 8.4.1: Setup GitHub Actions Workflow
- **Description:** Create CI/CD pipeline with testing, building, and deployment stages
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Run tests on PR
  - Build validation
  - Security scanning
  - Artifact generation
  - Cache optimization
- **Dependencies:** None
- **Implementation Notes:**
  ```yaml
  # .github/workflows/ci.yml
  name: CI
  
  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]
  
  env:
    NODE_VERSION: '18'
    PNPM_VERSION: '8'
  
  jobs:
    lint:
      name: Lint
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        
        - uses: pnpm/action-setup@v2
          with:
            version: ${{ env.PNPM_VERSION }}
        
        - uses: actions/setup-node@v4
          with:
            node-version: ${{ env.NODE_VERSION }}
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Run ESLint
          run: pnpm lint
        
        - name: Check TypeScript
          run: pnpm typecheck
        
        - name: Check formatting
          run: pnpm format:check
  
    test:
      name: Test
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        
        - uses: pnpm/action-setup@v2
          with:
            version: ${{ env.PNPM_VERSION }}
        
        - uses: actions/setup-node@v4
          with:
            node-version: ${{ env.NODE_VERSION }}
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Run unit tests
          run: pnpm test:unit --coverage
        
        - name: Upload coverage
          uses: codecov/codecov-action@v3
          with:
            files: ./coverage/lcov.info
            flags: unit
        
        - name: Check coverage thresholds
          run: pnpm test:coverage-check
  
    e2e:
      name: E2E Tests
      runs-on: ubuntu-latest
      strategy:
        matrix:
          browser: [chromium, firefox]
      steps:
        - uses: actions/checkout@v4
        
        - uses: pnpm/action-setup@v2
          with:
            version: ${{ env.PNPM_VERSION }}
        
        - uses: actions/setup-node@v4
          with:
            node-version: ${{ env.NODE_VERSION }}
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Install Playwright browsers
          run: pnpm playwright install --with-deps ${{ matrix.browser }}
        
        - name: Build extension
          run: pnpm build:test
        
        - name: Run E2E tests
          run: pnpm test:e2e --project=${{ matrix.browser }}
        
        - name: Upload test results
          uses: actions/upload-artifact@v3
          if: always()
          with:
            name: playwright-results-${{ matrix.browser }}
            path: test-results/
            retention-days: 30
  
    build:
      name: Build
      runs-on: ubuntu-latest
      needs: [lint, test]
      strategy:
        matrix:
          target: [chrome, firefox, edge]
      steps:
        - uses: actions/checkout@v4
        
        - uses: pnpm/action-setup@v2
          with:
            version: ${{ env.PNPM_VERSION }}
        
        - uses: actions/setup-node@v4
          with:
            node-version: ${{ env.NODE_VERSION }}
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Build for ${{ matrix.target }}
          run: pnpm build:${{ matrix.target }}
        
        - name: Validate manifest
          run: |
            node scripts/validate-manifest.js build/${{ matrix.target }}/manifest.json
        
        - name: Check bundle size
          run: |
            node scripts/check-bundle-size.js build/${{ matrix.target }}
        
        - name: Upload build artifact
          uses: actions/upload-artifact@v3
          with:
            name: build-${{ matrix.target }}
            path: build/${{ matrix.target }}/
            retention-days: 7
  
    security:
      name: Security Scan
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        
        - name: Run Snyk security scan
          uses: snyk/actions/node@master
          env:
            SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        
        - name: Run CodeQL analysis
          uses: github/codeql-action/analyze@v2
  
    release:
      name: Release
      runs-on: ubuntu-latest
      needs: [build, security]
      if: github.ref == 'refs/heads/main' && github.event_name == 'push'
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0
        
        - uses: pnpm/action-setup@v2
          with:
            version: ${{ env.PNPM_VERSION }}
        
        - uses: actions/setup-node@v4
          with:
            node-version: ${{ env.NODE_VERSION }}
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Check for release
          id: check_release
          run: |
            if git diff HEAD^ HEAD --name-only | grep -E "(package\.json|CHANGELOG\.md)"; then
              echo "should_release=true" >> $GITHUB_OUTPUT
            else
              echo "should_release=false" >> $GITHUB_OUTPUT
            fi
        
        - name: Build all targets
          if: steps.check_release.outputs.should_release == 'true'
          run: pnpm build:all
        
        - name: Package releases
          if: steps.check_release.outputs.should_release == 'true'
          run: pnpm package:all
        
        - name: Create GitHub release
          if: steps.check_release.outputs.should_release == 'true'
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          run: |
            VERSION=$(node -p "require('./package.json').version")
            gh release create "v${VERSION}" \
              --title "v${VERSION}" \
              --notes-file CHANGELOG.md \
              dist/*.zip dist/*.sha256
  
  # .github/workflows/codeql.yml
  name: CodeQL
  
  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]
    schedule:
      - cron: '0 0 * * 1'
  
  jobs:
    analyze:
      name: Analyze
      runs-on: ubuntu-latest
      permissions:
        actions: read
        contents: read
        security-events: write
      
      strategy:
        fail-fast: false
        matrix:
          language: ['javascript', 'typescript']
      
      steps:
        - uses: actions/checkout@v4
        
        - name: Initialize CodeQL
          uses: github/codeql-action/init@v2
          with:
            languages: ${{ matrix.language }}
        
        - name: Autobuild
          uses: github/codeql-action/autobuild@v2
        
        - name: Perform CodeQL Analysis
          uses: github/codeql-action/analyze@v2
  ```

#### Ticket 8.4.2: Configure Automated Testing in CI
- **Description:** Setup comprehensive test suites to run in CI environment
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Parallel test execution
  - Test result reporting
  - Coverage tracking
  - Performance benchmarks
  - Flaky test detection
- **Dependencies:** 8.4.1
- **Implementation Notes:**
  ```yaml
  # .github/workflows/test-suite.yml
  name: Test Suite
  
  on:
    pull_request:
    push:
      branches: [main, develop]
  
  jobs:
    test-matrix:
      name: Test Matrix
      runs-on: ${{ matrix.os }}
      strategy:
        matrix:
          os: [ubuntu-latest, windows-latest, macos-latest]
          node: [18, 20]
          exclude:
            # Skip some combinations to save CI time
            - os: windows-latest
              node: 18
            - os: macos-latest
              node: 18
      
      steps:
        - uses: actions/checkout@v4
        
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        
        - uses: actions/setup-node@v4
          with:
            node-version: ${{ matrix.node }}
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Run tests with retry
          uses: nick-invision/retry@v2
          with:
            timeout_minutes: 10
            max_attempts: 3
            command: pnpm test:unit --maxWorkers=2
        
        - name: Upload test results
          uses: actions/upload-artifact@v3
          if: always()
          with:
            name: test-results-${{ matrix.os }}-node${{ matrix.node }}
            path: |
              test-results/
              coverage/
  
    performance:
      name: Performance Tests
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        
        - uses: actions/setup-node@v4
          with:
            node-version: 18
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Build extension
          run: pnpm build
        
        - name: Run performance benchmarks
          run: |
            node scripts/performance-test.js \
              --baseline main \
              --compare ${{ github.sha }} \
              --output performance-report.json
        
        - name: Comment PR with results
          uses: actions/github-script@v6
          if: github.event_name == 'pull_request'
          with:
            script: |
              const fs = require('fs')
              const report = JSON.parse(fs.readFileSync('performance-report.json'))
              
              const comment = `## Performance Report
              
              | Metric | Baseline | Current | Change |
              |--------|----------|---------|--------|
              | Bundle Size | ${report.baseline.bundleSize} | ${report.current.bundleSize} | ${report.change.bundleSize} |
              | Load Time | ${report.baseline.loadTime}ms | ${report.current.loadTime}ms | ${report.change.loadTime} |
              | Memory Usage | ${report.baseline.memory}MB | ${report.current.memory}MB | ${report.change.memory} |
              
              ${report.regression ? '⚠️ Performance regression detected!' : '✅ No performance regression'}
              `
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              })
  
    visual-regression:
      name: Visual Regression Tests
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0
        
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        
        - uses: actions/setup-node@v4
          with:
            node-version: 18
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Build extension
          run: pnpm build:test
        
        - name: Run visual tests
          run: |
            pnpm playwright install chromium
            pnpm test:visual
        
        - name: Upload visual diff
          uses: actions/upload-artifact@v3
          if: failure()
          with:
            name: visual-regression-diff
            path: test-results/visual-diff/
  
  # scripts/performance-test.js
  const puppeteer = require('puppeteer')
  const fs = require('fs-extra')
  const path = require('path')
  
  async function runPerformanceTest(extensionPath) {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    })
    
    const page = await browser.newPage()
    
    // Enable performance metrics
    await page.evaluateOnNewDocument(() => {
      window.__PERFORMANCE_METRICS__ = {
        startTime: Date.now(),
        marks: []
      }
      
      // Override performance.mark
      const originalMark = performance.mark
      performance.mark = function(name) {
        window.__PERFORMANCE_METRICS__.marks.push({
          name,
          time: Date.now() - window.__PERFORMANCE_METRICS__.startTime
        })
        return originalMark.call(this, name)
      }
    })
    
    // Navigate to extension
    await page.goto('chrome://newtab')
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-loaded"]', {
      timeout: 10000
    })
    
    // Collect metrics
    const metrics = await page.evaluate(() => window.__PERFORMANCE_METRICS__)
    
    const performanceData = await page.metrics()
    
    const coverage = await page.coverage.startJSCoverage()
    await page.reload()
    const jsCoverage = await page.coverage.stopJSCoverage()
    
    // Calculate bundle size
    const bundleSize = await calculateBundleSize(extensionPath)
    
    await browser.close()
    
    return {
      loadTime: metrics.marks.find(m => m.name === 'dashboard-loaded')?.time || 0,
      memory: Math.round(performanceData.JSHeapUsedSize / 1024 / 1024),
      bundleSize,
      unusedCode: calculateUnusedCode(jsCoverage)
    }
  }
  
  async function calculateBundleSize(extensionPath) {
    const files = await fs.readdir(extensionPath, { recursive: true })
    let totalSize = 0
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const stats = await fs.stat(path.join(extensionPath, file))
        totalSize += stats.size
      }
    }
    
    return `${(totalSize / 1024).toFixed(2)}KB`
  }
  
  function calculateUnusedCode(coverage) {
    let totalBytes = 0
    let usedBytes = 0
    
    for (const entry of coverage) {
      totalBytes += entry.text.length
      
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start
      }
    }
    
    return ((totalBytes - usedBytes) / totalBytes * 100).toFixed(2)
  }
  ```

#### Ticket 8.4.3: Implement Chrome Web Store Submission
- **Description:** Automate the process of submitting the extension to Chrome Web Store
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Use Chrome Web Store API
  - Upload extension package
  - Update listing details
  - Submit for review
  - Track submission status
- **Dependencies:** 8.4.1
- **Implementation Notes:**
  ```yaml
  # .github/workflows/store-submit.yml
  name: Chrome Web Store Submit
  
  on:
    release:
      types: [published]
    workflow_dispatch:
      inputs:
        target:
          description: 'Submission target'
          required: true
          default: 'production'
          type: choice
          options:
            - production
            - trusted-testers
            - draft
  
  jobs:
    submit:
      name: Submit to Chrome Web Store
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        
        - uses: actions/setup-node@v4
          with:
            node-version: 18
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Build extension
          run: pnpm build:chrome
        
        - name: Package extension
          run: pnpm package:chrome
        
        - name: Validate submission
          run: |
            node scripts/validate-store-submission.js \
              --package dist/pm-dashboard-chrome-*.zip \
              --listing store-assets/chrome/
        
        - name: Submit to Chrome Web Store
          uses: PlasmoHQ/bpp@v3
          with:
            keys: ${{ secrets.CHROME_STORE_KEYS }}
            artifact: dist/pm-dashboard-chrome-*.zip
            target: ${{ github.event.inputs.target || 'production' }}
        
        - name: Update store listing
          env:
            CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
            CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
            CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
          run: |
            node scripts/update-store-listing.js \
              --version ${{ github.event.release.tag_name }}
        
        - name: Notify team
          uses: 8398a7/action-slack@v3
          with:
            status: ${{ job.status }}
            text: |
              Chrome Web Store submission ${{ job.status }}
              Version: ${{ github.event.release.tag_name }}
              Target: ${{ github.event.inputs.target || 'production' }}
            webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  
  # scripts/update-store-listing.js
  const { google } = require('googleapis')
  const fs = require('fs-extra')
  const path = require('path')
  
  async function updateStoreListing(version) {
    const auth = new google.auth.OAuth2(
      process.env.CHROME_CLIENT_ID,
      process.env.CHROME_CLIENT_SECRET
    )
    
    auth.setCredentials({
      refresh_token: process.env.CHROME_REFRESH_TOKEN
    })
    
    const webstore = google.chromewebstore({
      version: 'v1.1',
      auth
    })
    
    const extensionId = await getExtensionId()
    
    // Update listing details
    const listingPath = path.join(__dirname, '../store-assets/chrome/listing.json')
    const listing = await fs.readJson(listingPath)
    
    // Update version-specific fields
    listing.version = version.replace('v', '')
    listing.detailedDescription = listing.detailedDescription.replace(
      /Version: \d+\.\d+\.\d+/,
      `Version: ${listing.version}`
    )
    
    // Upload new screenshots if available
    const screenshotsDir = path.join(__dirname, '../store-assets/chrome/screenshots')
    const screenshots = await fs.readdir(screenshotsDir)
    
    for (const [index, screenshot] of screenshots.entries()) {
      const screenshotPath = path.join(screenshotsDir, screenshot)
      const screenshotData = await fs.readFile(screenshotPath)
      
      await webstore.items.update({
        itemId: extensionId,
        resource: {
          screenshot: screenshotData.toString('base64'),
          screenshotIndex: index
        }
      })
    }
    
    // Update promotional images
    const promoImagesDir = path.join(__dirname, '../store-assets/chrome/promo')
    const promoSizes = {
      'small.png': 'SMALL',
      'large.png': 'LARGE',
      'marquee.png': 'MARQUEE'
    }
    
    for (const [filename, size] of Object.entries(promoSizes)) {
      const imagePath = path.join(promoImagesDir, filename)
      if (await fs.pathExists(imagePath)) {
        const imageData = await fs.readFile(imagePath)
        
        await webstore.items.update({
          itemId: extensionId,
          resource: {
            promotionalImage: imageData.toString('base64'),
            promotionalImageSize: size
          }
        })
      }
    }
    
    // Update listing metadata
    await webstore.items.update({
      itemId: extensionId,
      resource: listing
    })
    
    console.log(`✅ Store listing updated for version ${version}`)
  }
  
  async function getExtensionId() {
    const keysPath = path.join(__dirname, '../keys.json')
    if (await fs.pathExists(keysPath)) {
      const keys = await fs.readJson(keysPath)
      return keys.chrome?.extId
    }
    
    // Fallback to manifest
    const manifestPath = path.join(__dirname, '../build/chrome/manifest.json')
    const manifest = await fs.readJson(manifestPath)
    return manifest.key // Chrome store ID derived from key
  }
  
  // Store listing template
  // store-assets/chrome/listing.json
  {
    "name": "PM Dashboard - Product Manager's Toolkit",
    "shortDescription": "Comprehensive dashboard for Product Managers with calculators, feeds, and productivity tools",
    "detailedDescription": "PM Dashboard transforms your new tab into a powerful command center designed specifically for Product Managers.\n\n🚀 Key Features:\n\n📊 PM Calculators\n• RICE Score Calculator for feature prioritization\n• TAM/SAM/SOM market sizing tools\n• ROI calculator with NPV and IRR\n• A/B test statistical significance calculator\n\n📰 Real-time Feeds\n• Product Hunt latest launches\n• Hacker News top stories\n• Jira ticket tracking\n• RSS feed aggregator\n\n📎 Web Clipper\n• Capture competitive intelligence\n• Save user feedback and insights\n• Organize with tags and categories\n• Quick annotations\n\n🔌 Integrations\n• GitHub repository insights\n• Jira project management\n• Analytics dashboards\n• Secure OAuth authentication\n\n✨ Additional Features\n• Customizable dashboard layout\n• Dark mode support\n• Keyboard shortcuts\n• Data export capabilities\n• Privacy-focused design\n\nVersion: 1.0.0\n\nPerfect for Product Managers who want to stay organized, make data-driven decisions, and keep up with industry trends - all from their new tab!",
    "primaryCategory": "PRODUCTIVITY",
    "secondaryCategory": "DEVELOPER_TOOLS",
    "language": "en",
    "supportEmail": "support@pmdashboard.app",
    "privacyPolicyUrl": "https://pmdashboard.app/privacy",
    "websiteUrl": "https://pmdashboard.app"
  }
  
  # scripts/validate-store-submission.js
  const fs = require('fs-extra')
  const path = require('path')
  const AdmZip = require('adm-zip')
  
  async function validateSubmission(packagePath, listingPath) {
    console.log('🔍 Validating Chrome Web Store submission...')
    
    const errors = []
    const warnings = []
    
    // Validate package
    if (!await fs.pathExists(packagePath)) {
      errors.push(`Package not found: ${packagePath}`)
      return { errors, warnings }
    }
    
    const zip = new AdmZip(packagePath)
    const entries = zip.getEntries()
    
    // Check manifest
    const manifestEntry = entries.find(e => e.entryName === 'manifest.json')
    if (!manifestEntry) {
      errors.push('manifest.json not found in package')
    } else {
      const manifest = JSON.parse(manifestEntry.getData().toString())
      
      // Validate required fields
      const requiredFields = ['name', 'version', 'manifest_version', 'description']
      for (const field of requiredFields) {
        if (!manifest[field]) {
          errors.push(`Missing required field: ${field}`)
        }
      }
      
      // Check permissions
      const dangerousPermissions = ['debugger', 'management', 'proxy']
      const usedDangerous = manifest.permissions?.filter(p => 
        dangerousPermissions.includes(p)
      )
      
      if (usedDangerous?.length > 0) {
        warnings.push(`Using sensitive permissions: ${usedDangerous.join(', ')}`)
      }
      
      // Check version format
      if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        errors.push(`Invalid version format: ${manifest.version}`)
      }
    }
    
    // Check package size
    const stats = await fs.stat(packagePath)
    const sizeMB = stats.size / 1024 / 1024
    
    if (sizeMB > 100) {
      errors.push(`Package too large: ${sizeMB.toFixed(2)}MB (max 100MB)`)
    } else if (sizeMB > 50) {
      warnings.push(`Large package size: ${sizeMB.toFixed(2)}MB`)
    }
    
    // Validate listing assets
    const requiredAssets = [
      'listing.json',
      'screenshots/1.png',
      'screenshots/2.png',
      'icon-128.png'
    ]
    
    for (const asset of requiredAssets) {
      const assetPath = path.join(listingPath, asset)
      if (!await fs.pathExists(assetPath)) {
        errors.push(`Missing listing asset: ${asset}`)
      }
    }
    
    // Check screenshot dimensions
    const screenshotsDir = path.join(listingPath, 'screenshots')
    if (await fs.pathExists(screenshotsDir)) {
      const screenshots = await fs.readdir(screenshotsDir)
      
      for (const screenshot of screenshots) {
        if (screenshot.endsWith('.png')) {
          const dimensions = await getImageDimensions(
            path.join(screenshotsDir, screenshot)
          )
          
          if (dimensions.width !== 1280 || dimensions.height !== 800) {
            warnings.push(
              `Screenshot ${screenshot} has incorrect dimensions: ` +
              `${dimensions.width}x${dimensions.height} (expected 1280x800)`
            )
          }
        }
      }
    }
    
    // Summary
    console.log(`\n📊 Validation Results:`)
    console.log(`   Errors: ${errors.length}`)
    console.log(`   Warnings: ${warnings.length}`)
    
    if (errors.length > 0) {
      console.error('\n❌ Errors found:')
      errors.forEach(e => console.error(`   - ${e}`))
    }
    
    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:')
      warnings.forEach(w => console.warn(`   - ${w}`))
    }
    
    if (errors.length === 0) {
      console.log('\n✅ Validation passed!')
    }
    
    return { errors, warnings }
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ Comprehensive test suite with 80%+ coverage
- ✅ E2E testing with Playwright
- ✅ Optimized production builds
- ✅ Multi-browser support
- ✅ CI/CD pipeline with automated deployment
- ✅ Chrome Web Store submission automation

### Key Milestones:
1. **Testing Framework Ready** - Jest and Playwright configured
2. **All Tests Passing** - Unit, integration, and E2E tests green
3. **Build Pipeline Complete** - Automated builds for all browsers
4. **Store Submission Ready** - Automated submission to Chrome Web Store

### Next Steps:
- Monitor production metrics and errors
- Set up user analytics and feedback
- Plan feature rollout strategy
- Create beta testing program
- Implement feature flags for gradual rollout