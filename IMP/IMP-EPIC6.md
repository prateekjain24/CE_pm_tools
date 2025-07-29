# Epic 6: API Integrations & Authentication

## Epic Overview
Implement secure authentication flows and API integrations for external services including Jira, GitHub, and analytics platforms. This epic focuses on building a robust authentication system using OAuth 2.0, secure credential storage, and reusable API client architecture.

**Epic Goals:**
- Implement secure credential storage with encryption
- Build OAuth 2.0 authentication flows
- Create API clients for major platforms
- Handle token refresh and error recovery
- Provide seamless integration experience

**Total Story Points:** 20 SP  
**Total Stories:** 4  
**Total Tickets:** 16  

---

## Story 6.1: Secure Storage Setup
**Description:** Implement SecureStorage system for safely storing API keys, tokens, and sensitive user data with encryption.

**Acceptance Criteria:**
- Master password protection for sensitive data
- Encryption/decryption of stored credentials
- Secure key derivation
- Auto-lock after inactivity
- Password recovery mechanism

### Tickets:

#### Ticket 6.1.1: Implement SecureStorage for API Keys
- **Description:** Build secure storage system using Plasmo's SecureStorage with encryption
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Use Web Crypto API for encryption
  - Implement AES-GCM encryption
  - Secure key derivation with PBKDF2
  - Handle storage migration
  - Implement storage versioning
- **Dependencies:** Epic 1 completion
- **Implementation Notes:**
  ```typescript
  // src/lib/security/SecureStorage.ts
  import { SecureStorage as PlasmoSecureStorage } from "@plasmohq/storage/secure"
  
  export class SecureStorage {
    private storage: PlasmoSecureStorage
    private encryptionKey: CryptoKey | null = null
    private isUnlocked = false
    private autoLockTimeout: NodeJS.Timeout | null = null
    private readonly AUTO_LOCK_DURATION = 15 * 60 * 1000 // 15 minutes
    
    constructor() {
      this.storage = new PlasmoSecureStorage()
      this.initializeAutoLock()
    }
    
    async setMasterPassword(password: string): Promise<void> {
      // Derive encryption key from password
      const salt = await this.getOrCreateSalt()
      this.encryptionKey = await this.deriveKey(password, salt)
      
      // Store password hash for verification
      const passwordHash = await this.hashPassword(password, salt)
      await chrome.storage.local.set({ 
        'secure-storage-hash': passwordHash,
        'secure-storage-salt': this.bufferToBase64(salt)
      })
      
      // Encrypt existing data if migrating
      await this.migrateExistingData()
      
      this.isUnlocked = true
      this.resetAutoLock()
    }
    
    async unlock(password: string): Promise<boolean> {
      const stored = await chrome.storage.local.get(['secure-storage-hash', 'secure-storage-salt'])
      if (!stored['secure-storage-hash']) {
        throw new Error('No master password set')
      }
      
      const salt = this.base64ToBuffer(stored['secure-storage-salt'])
      const passwordHash = await this.hashPassword(password, salt)
      
      if (passwordHash !== stored['secure-storage-hash']) {
        return false
      }
      
      this.encryptionKey = await this.deriveKey(password, salt)
      this.isUnlocked = true
      this.resetAutoLock()
      
      return true
    }
    
    async set(key: string, value: any): Promise<void> {
      if (!this.isUnlocked || !this.encryptionKey) {
        throw new Error('SecureStorage is locked')
      }
      
      const encrypted = await this.encrypt(JSON.stringify(value))
      await this.storage.set(key, encrypted)
      this.resetAutoLock()
    }
    
    async get<T>(key: string): Promise<T | null> {
      if (!this.isUnlocked || !this.encryptionKey) {
        throw new Error('SecureStorage is locked')
      }
      
      const encrypted = await this.storage.get(key)
      if (!encrypted) return null
      
      const decrypted = await this.decrypt(encrypted)
      this.resetAutoLock()
      
      return JSON.parse(decrypted)
    }
    
    async remove(key: string): Promise<void> {
      if (!this.isUnlocked) {
        throw new Error('SecureStorage is locked')
      }
      
      await this.storage.remove(key)
    }
    
    lock(): void {
      this.encryptionKey = null
      this.isUnlocked = false
      
      if (this.autoLockTimeout) {
        clearTimeout(this.autoLockTimeout)
        this.autoLockTimeout = null
      }
      
      // Notify UI
      chrome.runtime.sendMessage({ type: 'SECURE_STORAGE_LOCKED' })
    }
    
    private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
      const encoder = new TextEncoder()
      const passwordBuffer = encoder.encode(password)
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      )
      
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
    }
    
    private async encrypt(data: string): Promise<string> {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        dataBuffer
      )
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.byteLength + encrypted.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(encrypted), iv.byteLength)
      
      return this.bufferToBase64(combined)
    }
    
    private async decrypt(encryptedData: string): Promise<string> {
      const combined = this.base64ToBuffer(encryptedData)
      
      const iv = combined.slice(0, 12)
      const data = combined.slice(12)
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        data
      )
      
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    }
    
    private async hashPassword(password: string, salt: Uint8Array): Promise<string> {
      const encoder = new TextEncoder()
      const data = encoder.encode(password + this.bufferToBase64(salt))
      const hash = await crypto.subtle.digest('SHA-256', data)
      return this.bufferToBase64(new Uint8Array(hash))
    }
    
    private async getOrCreateSalt(): Promise<Uint8Array> {
      const stored = await chrome.storage.local.get('secure-storage-salt')
      
      if (stored['secure-storage-salt']) {
        return this.base64ToBuffer(stored['secure-storage-salt'])
      }
      
      return crypto.getRandomValues(new Uint8Array(16))
    }
    
    private resetAutoLock(): void {
      if (this.autoLockTimeout) {
        clearTimeout(this.autoLockTimeout)
      }
      
      this.autoLockTimeout = setTimeout(() => {
        this.lock()
      }, this.AUTO_LOCK_DURATION)
    }
    
    private initializeAutoLock(): void {
      // Lock on browser idle
      chrome.idle.onStateChanged.addListener((state) => {
        if (state === 'locked') {
          this.lock()
        }
      })
      
      // Lock on extension suspend
      chrome.runtime.onSuspend.addListener(() => {
        this.lock()
      })
    }
    
    private bufferToBase64(buffer: Uint8Array): string {
      return btoa(String.fromCharCode(...buffer))
    }
    
    private base64ToBuffer(base64: string): Uint8Array {
      return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    }
    
    private async migrateExistingData(): Promise<void> {
      // Migrate any existing unencrypted sensitive data
      const keysToMigrate = [
        'jira-api-key',
        'github-token',
        'analytics-api-key'
      ]
      
      for (const key of keysToMigrate) {
        const unencrypted = await chrome.storage.local.get(key)
        if (unencrypted[key]) {
          await this.set(key, unencrypted[key])
          await chrome.storage.local.remove(key)
        }
      }
    }
  }
  
  // Singleton instance
  export const secureStorage = new SecureStorage()
  ```

#### Ticket 6.1.2: Create Master Password Flow
- **Description:** Build UI components for setting and entering master password
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Password strength indicator
  - Confirmation field validation
  - Remember password option (session only)
  - Forgot password flow
  - Auto-focus and keyboard handling
- **Dependencies:** 6.1.1
- **Implementation Notes:**
  ```typescript
  // src/components/security/MasterPasswordDialog.tsx
  interface MasterPasswordDialogProps {
    mode: 'create' | 'unlock'
    onSuccess: () => void
    onCancel?: () => void
  }
  
  export function MasterPasswordDialog({ 
    mode, 
    onSuccess, 
    onCancel 
  }: MasterPasswordDialogProps) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string>()
    const [loading, setLoading] = useState(false)
    const [rememberSession, setRememberSession] = useState(false)
    
    const passwordStrength = useMemo(() => 
      calculatePasswordStrength(password), [password]
    )
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(undefined)
      
      if (mode === 'create') {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          return
        }
        
        if (passwordStrength.score < 3) {
          setError('Password is too weak')
          return
        }
      }
      
      setLoading(true)
      
      try {
        if (mode === 'create') {
          await secureStorage.setMasterPassword(password)
        } else {
          const success = await secureStorage.unlock(password)
          if (!success) {
            setError('Incorrect password')
            return
          }
        }
        
        if (rememberSession) {
          // Store in session storage (cleared on browser close)
          sessionStorage.setItem('pm-dashboard-session', password)
        }
        
        onSuccess()
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <Dialog open onOpenChange={(open) => !open && onCancel?.()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Set Master Password' : 'Enter Master Password'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Create a strong password to protect your API keys and sensitive data.'
                : 'Enter your master password to access secure storage.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              
              {mode === 'create' && password && (
                <PasswordStrengthIndicator strength={passwordStrength} />
              )}
            </div>
            
            {mode === 'create' && (
              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm master password"
                  required
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberSession}
                onCheckedChange={setRememberSession}
              />
              <Label htmlFor="remember" className="text-sm">
                Remember for this session
              </Label>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                {mode === 'create' ? 'Set Password' : 'Unlock'}
              </Button>
            </DialogFooter>
          </form>
          
          {mode === 'unlock' && (
            <div className="mt-4 text-center">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => handleForgotPassword()}
              >
                Forgot password?
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }
  
  function PasswordStrengthIndicator({ strength }: { 
    strength: { score: number; feedback: string[] } 
  }) {
    const colors = ['red', 'orange', 'yellow', 'lime', 'green']
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    
    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded",
                i <= strength.score 
                  ? `bg-${colors[strength.score]}-500`
                  : "bg-gray-300"
              )}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {labels[strength.score]}
          </span>
          {strength.feedback.length > 0 && (
            <span className="text-xs text-gray-500">
              {strength.feedback[0]}
            </span>
          )}
        </div>
      </div>
    )
  }
  
  function calculatePasswordStrength(password: string): {
    score: number
    feedback: string[]
  } {
    let score = 0
    const feedback: string[] = []
    
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    
    if (password.length < 8) feedback.push('Use at least 8 characters')
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      feedback.push('Mix uppercase and lowercase')
    }
    if (!/\d/.test(password)) feedback.push('Add numbers')
    if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add symbols')
    
    return { score: Math.min(score, 4), feedback }
  }
  ```

#### Ticket 6.1.3: Add Encryption for Sensitive Data
- **Description:** Implement encryption/decryption utilities for API responses and cached data
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Encrypt API responses before caching
  - Decrypt on retrieval
  - Handle large data efficiently
  - Implement data integrity checks
  - Support different encryption contexts
- **Dependencies:** 6.1.1
- **Implementation Notes:**
  ```typescript
  // src/lib/security/DataEncryption.ts
  export class DataEncryption {
    private contextKeys = new Map<string, CryptoKey>()
    
    async encryptData(
      data: any, 
      context: string = 'default'
    ): Promise<EncryptedData> {
      const key = await this.getContextKey(context)
      const plaintext = JSON.stringify(data)
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encoder = new TextEncoder()
      const encoded = encoder.encode(plaintext)
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      )
      
      // Calculate checksum for integrity
      const checksum = await this.calculateChecksum(encoded)
      
      return {
        data: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        checksum,
        context,
        timestamp: Date.now()
      }
    }
    
    async decryptData(encryptedData: EncryptedData): Promise<any> {
      const key = await this.getContextKey(encryptedData.context)
      
      const encrypted = this.base64ToArrayBuffer(encryptedData.data)
      const iv = this.base64ToArrayBuffer(encryptedData.iv)
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      )
      
      const decoder = new TextDecoder()
      const plaintext = decoder.decode(decrypted)
      
      // Verify integrity
      const encoder = new TextEncoder()
      const checksum = await this.calculateChecksum(encoder.encode(plaintext))
      
      if (checksum !== encryptedData.checksum) {
        throw new Error('Data integrity check failed')
      }
      
      return JSON.parse(plaintext)
    }
    
    async encryptApiResponse(
      response: any,
      apiName: string
    ): Promise<string> {
      // Use API-specific context for isolation
      const encrypted = await this.encryptData(response, `api:${apiName}`)
      
      // Store with expiration
      const storage = {
        encrypted,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
      }
      
      return JSON.stringify(storage)
    }
    
    async decryptApiResponse(
      encryptedResponse: string,
      apiName: string
    ): Promise<any> {
      const storage = JSON.parse(encryptedResponse)
      
      // Check expiration
      if (Date.now() > storage.expiresAt) {
        throw new Error('Cached response expired')
      }
      
      return this.decryptData(storage.encrypted)
    }
    
    private async getContextKey(context: string): Promise<CryptoKey> {
      if (this.contextKeys.has(context)) {
        return this.contextKeys.get(context)!
      }
      
      // Derive context-specific key from master key
      const masterKey = await secureStorage.getMasterKey()
      const salt = new TextEncoder().encode(`context:${context}`)
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 1000,
          hash: 'SHA-256'
        },
        masterKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
      
      this.contextKeys.set(context, key)
      return key
    }
    
    private async calculateChecksum(data: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest('SHA-256', data)
      return this.arrayBufferToBase64(hash).substring(0, 8)
    }
    
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      bytes.forEach(byte => binary += String.fromCharCode(byte))
      return btoa(binary)
    }
    
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes.buffer
    }
  }
  
  interface EncryptedData {
    data: string
    iv: string
    checksum: string
    context: string
    timestamp: number
  }
  
  export const dataEncryption = new DataEncryption()
  ```

---

## Story 6.2: OAuth Implementation
**Description:** Build generic OAuth 2.0 flow handler that can be reused across different services like Jira, GitHub, and others.

**Acceptance Criteria:**
- Support authorization code flow
- Handle PKCE for enhanced security
- Automatic token refresh
- State parameter validation
- Error handling and recovery

### Tickets:

#### Ticket 6.2.1: Build Generic OAuth Handler
- **Description:** Create reusable OAuth 2.0 client that handles the complete auth flow
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Support different OAuth providers
  - Implement PKCE flow
  - Handle state validation
  - Support custom scopes
  - Implement token storage
- **Dependencies:** 6.1.1
- **Implementation Notes:**
  ```typescript
  // src/lib/auth/OAuthClient.ts
  export interface OAuthConfig {
    providerId: string
    clientId: string
    authorizationUrl: string
    tokenUrl: string
    redirectUri?: string
    scopes: string[]
    usePKCE?: boolean
    additionalParams?: Record<string, string>
  }
  
  export class OAuthClient {
    private config: OAuthConfig
    private codeVerifier?: string
    
    constructor(config: OAuthConfig) {
      this.config = {
        ...config,
        redirectUri: config.redirectUri || chrome.identity.getRedirectURL(),
        usePKCE: config.usePKCE ?? true
      }
    }
    
    async startAuthFlow(): Promise<OAuthTokens> {
      // Generate state for CSRF protection
      const state = this.generateState()
      await chrome.storage.local.set({ 
        [`oauth-state-${this.config.providerId}`]: state 
      })
      
      // Generate PKCE challenge if enabled
      let codeChallenge: string | undefined
      if (this.config.usePKCE) {
        this.codeVerifier = this.generateCodeVerifier()
        codeChallenge = await this.generateCodeChallenge(this.codeVerifier)
      }
      
      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(state, codeChallenge)
      
      // Launch auth flow
      const redirectUrl = await this.launchWebAuthFlow(authUrl)
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(redirectUrl)
      
      // Store tokens securely
      await this.storeTokens(tokens)
      
      return tokens
    }
    
    async refreshAccessToken(): Promise<OAuthTokens> {
      const tokens = await this.getStoredTokens()
      
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available')
      }
      
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: this.config.clientId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new OAuthError('Token refresh failed', error)
      }
      
      const newTokens = await response.json()
      const updatedTokens: OAuthTokens = {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresAt: Date.now() + (newTokens.expires_in * 1000),
        scope: newTokens.scope || tokens.scope
      }
      
      await this.storeTokens(updatedTokens)
      return updatedTokens
    }
    
    async getValidAccessToken(): Promise<string> {
      let tokens = await this.getStoredTokens()
      
      if (!tokens) {
        tokens = await this.startAuthFlow()
      }
      
      // Check if token is expired or about to expire
      if (Date.now() >= tokens.expiresAt - 60000) { // 1 minute buffer
        tokens = await this.refreshAccessToken()
      }
      
      return tokens.accessToken
    }
    
    async revokeTokens(): Promise<void> {
      const tokens = await this.getStoredTokens()
      if (!tokens) return
      
      // Attempt to revoke tokens on server
      try {
        if (this.config.revokeUrl) {
          await fetch(this.config.revokeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              token: tokens.accessToken,
              client_id: this.config.clientId
            })
          })
        }
      } catch (error) {
        console.error('Token revocation failed:', error)
      }
      
      // Remove from storage
      await secureStorage.remove(`oauth-tokens-${this.config.providerId}`)
    }
    
    private buildAuthorizationUrl(
      state: string, 
      codeChallenge?: string
    ): string {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri!,
        response_type: 'code',
        scope: this.config.scopes.join(' '),
        state,
        ...this.config.additionalParams
      })
      
      if (codeChallenge) {
        params.append('code_challenge', codeChallenge)
        params.append('code_challenge_method', 'S256')
      }
      
      return `${this.config.authorizationUrl}?${params.toString()}`
    }
    
    private async launchWebAuthFlow(authUrl: string): Promise<string> {
      return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: authUrl,
            interactive: true
          },
          (redirectUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else if (redirectUrl) {
              resolve(redirectUrl)
            } else {
              reject(new Error('No redirect URL received'))
            }
          }
        )
      })
    }
    
    private async exchangeCodeForTokens(redirectUrl: string): Promise<OAuthTokens> {
      const url = new URL(redirectUrl)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      
      if (!code) {
        throw new OAuthError('No authorization code received', {
          error: url.searchParams.get('error'),
          error_description: url.searchParams.get('error_description')
        })
      }
      
      // Validate state
      const storedState = await chrome.storage.local.get(
        `oauth-state-${this.config.providerId}`
      )
      if (state !== storedState[`oauth-state-${this.config.providerId}`]) {
        throw new Error('Invalid state parameter')
      }
      
      // Exchange code for tokens
      const tokenParams: Record<string, string> = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri!,
        client_id: this.config.clientId
      }
      
      if (this.codeVerifier) {
        tokenParams.code_verifier = this.codeVerifier
      }
      
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(tokenParams)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new OAuthError('Token exchange failed', error)
      }
      
      const tokenResponse = await response.json()
      
      return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
        scope: tokenResponse.scope
      }
    }
    
    private async storeTokens(tokens: OAuthTokens): Promise<void> {
      await secureStorage.set(
        `oauth-tokens-${this.config.providerId}`,
        tokens
      )
    }
    
    private async getStoredTokens(): Promise<OAuthTokens | null> {
      return secureStorage.get(`oauth-tokens-${this.config.providerId}`)
    }
    
    private generateState(): string {
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      return this.base64UrlEncode(array)
    }
    
    private generateCodeVerifier(): string {
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      return this.base64UrlEncode(array)
    }
    
    private async generateCodeChallenge(verifier: string): Promise<string> {
      const encoder = new TextEncoder()
      const data = encoder.encode(verifier)
      const hash = await crypto.subtle.digest('SHA-256', data)
      return this.base64UrlEncode(new Uint8Array(hash))
    }
    
    private base64UrlEncode(buffer: Uint8Array): string {
      return btoa(String.fromCharCode(...buffer))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }
  }
  
  export interface OAuthTokens {
    accessToken: string
    refreshToken?: string
    expiresAt: number
    scope?: string
  }
  
  export class OAuthError extends Error {
    constructor(message: string, public details: any) {
      super(message)
      this.name = 'OAuthError'
    }
  }
  ```

#### Ticket 6.2.2: Create auth.tsx Tab for Redirect
- **Description:** Build the OAuth redirect handler page that processes auth callbacks
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Handle success and error cases
  - Show loading state during processing
  - Auto-close on success
  - Display clear error messages
  - Support different OAuth providers
- **Dependencies:** 6.2.1
- **Implementation Notes:**
  ```typescript
  // src/tabs/auth.tsx
  import { useEffect, useState } from "react"
  import { sendToBackground } from "@plasmohq/messaging"
  
  type AuthStatus = 'processing' | 'success' | 'error'
  
  interface AuthResult {
    provider: string
    success: boolean
    error?: string
  }
  
  export default function AuthPage() {
    const [status, setStatus] = useState<AuthStatus>('processing')
    const [result, setResult] = useState<AuthResult>()
    const [countdown, setCountdown] = useState(3)
    
    useEffect(() => {
      handleAuthCallback()
    }, [])
    
    useEffect(() => {
      if (status === 'success' && countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1)
        }, 1000)
        
        return () => clearTimeout(timer)
      } else if (status === 'success' && countdown === 0) {
        window.close()
      }
    }, [status, countdown])
    
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const provider = params.get('state')?.split(':')[0] || 'unknown'
      
      try {
        // Send full URL to background for processing
        const response = await sendToBackground({
          name: "oauth-callback",
          body: {
            url: window.location.href,
            provider
          }
        })
        
        if (response.success) {
          setStatus('success')
          setResult({ provider, success: true })
        } else {
          throw new Error(response.error || 'Authentication failed')
        }
      } catch (error) {
        setStatus('error')
        setResult({
          provider,
          success: false,
          error: error.message
        })
      }
    }
    
    const getProviderInfo = (provider: string) => {
      const providers: Record<string, { name: string; icon: string }> = {
        jira: { name: 'Jira', icon: '🔷' },
        github: { name: 'GitHub', icon: '🐙' },
        google: { name: 'Google Analytics', icon: '📊' }
      }
      
      return providers[provider] || { name: provider, icon: '🔑' }
    }
    
    const providerInfo = result ? getProviderInfo(result.provider) : null
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            
            {/* Status Content */}
            {status === 'processing' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
                  <div className="w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Authenticating...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we complete the authentication process.
                </p>
              </div>
            )}
            
            {status === 'success' && providerInfo && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <span className="text-3xl">{providerInfo.icon}</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connected to {providerInfo.name}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Authentication successful. You can now use {providerInfo.name} features.
                </p>
                <p className="text-sm text-gray-500">
                  This window will close in {countdown} seconds...
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Authentication Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {result?.error || 'An error occurred during authentication.'}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.close()}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Having trouble? Check the{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                chrome.tabs.create({ url: chrome.runtime.getURL('tabs/help.html') })
              }}
              className="text-blue-600 hover:underline"
            >
              help documentation
            </a>
          </p>
        </div>
      </div>
    )
  }
  ```

#### Ticket 6.2.3: Implement Token Refresh Mechanism
- **Description:** Build automatic token refresh system that runs in background
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Monitor token expiration
  - Refresh before expiry
  - Handle refresh failures
  - Retry with exponential backoff
  - Notify UI of auth changes
- **Dependencies:** 6.2.1
- **Implementation Notes:**
  ```typescript
  // src/lib/auth/TokenManager.ts
  export class TokenManager {
    private refreshTimers = new Map<string, NodeJS.Timeout>()
    private refreshPromises = new Map<string, Promise<OAuthTokens>>()
    private retryAttempts = new Map<string, number>()
    
    constructor() {
      this.initializeTokenMonitoring()
    }
    
    async initializeTokenMonitoring(): Promise<void> {
      // Check all stored tokens on startup
      const providers = await this.getAllProviders()
      
      for (const provider of providers) {
        await this.scheduleTokenRefresh(provider)
      }
      
      // Listen for new token storage
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return
        
        Object.keys(changes).forEach(key => {
          if (key.startsWith('oauth-tokens-')) {
            const provider = key.replace('oauth-tokens-', '')
            this.scheduleTokenRefresh(provider)
          }
        })
      })
    }
    
    async scheduleTokenRefresh(providerId: string): Promise<void> {
      // Clear existing timer
      if (this.refreshTimers.has(providerId)) {
        clearTimeout(this.refreshTimers.get(providerId)!)
      }
      
      const tokens = await secureStorage.get<OAuthTokens>(
        `oauth-tokens-${providerId}`
      )
      
      if (!tokens || !tokens.refreshToken) return
      
      // Calculate time until refresh needed (5 minutes before expiry)
      const refreshTime = tokens.expiresAt - Date.now() - (5 * 60 * 1000)
      
      if (refreshTime <= 0) {
        // Token already expired or about to expire
        await this.refreshToken(providerId)
      } else {
        // Schedule refresh
        const timer = setTimeout(() => {
          this.refreshToken(providerId)
        }, refreshTime)
        
        this.refreshTimers.set(providerId, timer)
      }
    }
    
    async refreshToken(providerId: string): Promise<OAuthTokens> {
      // Avoid concurrent refreshes
      if (this.refreshPromises.has(providerId)) {
        return this.refreshPromises.get(providerId)!
      }
      
      const refreshPromise = this.performTokenRefresh(providerId)
      this.refreshPromises.set(providerId, refreshPromise)
      
      try {
        const tokens = await refreshPromise
        this.retryAttempts.delete(providerId)
        
        // Schedule next refresh
        await this.scheduleTokenRefresh(providerId)
        
        // Notify UI
        chrome.runtime.sendMessage({
          type: 'TOKEN_REFRESHED',
          providerId
        })
        
        return tokens
      } catch (error) {
        await this.handleRefreshError(providerId, error)
        throw error
      } finally {
        this.refreshPromises.delete(providerId)
      }
    }
    
    private async performTokenRefresh(providerId: string): Promise<OAuthTokens> {
      const config = await this.getProviderConfig(providerId)
      const client = new OAuthClient(config)
      
      return client.refreshAccessToken()
    }
    
    private async handleRefreshError(
      providerId: string, 
      error: Error
    ): Promise<void> {
      const attempts = (this.retryAttempts.get(providerId) || 0) + 1
      this.retryAttempts.set(providerId, attempts)
      
      if (attempts >= 3) {
        // Max retries reached, require re-authentication
        await this.invalidateTokens(providerId)
        
        chrome.runtime.sendMessage({
          type: 'AUTH_REQUIRED',
          providerId,
          reason: 'Token refresh failed'
        })
        
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icon-128.png',
          title: 'Authentication Required',
          message: `Please re-authenticate with ${providerId}`,
          buttons: [{ title: 'Authenticate' }]
        })
      } else {
        // Schedule retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000)
        
        setTimeout(() => {
          this.refreshToken(providerId)
        }, delay)
      }
    }
    
    async invalidateTokens(providerId: string): Promise<void> {
      // Clear refresh timer
      if (this.refreshTimers.has(providerId)) {
        clearTimeout(this.refreshTimers.get(providerId)!)
        this.refreshTimers.delete(providerId)
      }
      
      // Remove tokens
      await secureStorage.remove(`oauth-tokens-${providerId}`)
      
      // Clear retry attempts
      this.retryAttempts.delete(providerId)
    }
    
    async getValidToken(providerId: string): Promise<string> {
      const tokens = await secureStorage.get<OAuthTokens>(
        `oauth-tokens-${providerId}`
      )
      
      if (!tokens) {
        throw new Error(`No tokens found for ${providerId}`)
      }
      
      // Check if refresh is needed
      if (Date.now() >= tokens.expiresAt - 60000) {
        const refreshed = await this.refreshToken(providerId)
        return refreshed.accessToken
      }
      
      return tokens.accessToken
    }
    
    private async getAllProviders(): Promise<string[]> {
      const allKeys = await chrome.storage.local.get()
      
      return Object.keys(allKeys)
        .filter(key => key.startsWith('oauth-tokens-'))
        .map(key => key.replace('oauth-tokens-', ''))
    }
    
    private async getProviderConfig(providerId: string): Promise<OAuthConfig> {
      // Load provider configurations
      const configs: Record<string, OAuthConfig> = {
        jira: {
          providerId: 'jira',
          clientId: process.env.PLASMO_PUBLIC_JIRA_CLIENT_ID!,
          authorizationUrl: 'https://auth.atlassian.com/authorize',
          tokenUrl: 'https://auth.atlassian.com/oauth/token',
          scopes: ['read:jira-work', 'read:jira-user'],
          usePKCE: true
        },
        github: {
          providerId: 'github',
          clientId: process.env.PLASMO_PUBLIC_GITHUB_CLIENT_ID!,
          authorizationUrl: 'https://github.com/login/oauth/authorize',
          tokenUrl: 'https://github.com/login/oauth/access_token',
          scopes: ['repo', 'read:user'],
          usePKCE: false
        }
      }
      
      if (!configs[providerId]) {
        throw new Error(`Unknown provider: ${providerId}`)
      }
      
      return configs[providerId]
    }
  }
  
  export const tokenManager = new TokenManager()
  ```

#### Ticket 6.2.4: Handle Authorization Code Exchange
- **Description:** Implement secure authorization code exchange in background script
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Validate redirect URL
  - Extract authorization code
  - Exchange for tokens
  - Handle error responses
  - Store tokens securely
- **Dependencies:** 6.2.2
- **Implementation Notes:**
  ```typescript
  // src/background/messages/oauth-callback.ts
  import type { PlasmoMessaging } from "@plasmohq/messaging"
  import { OAuthClient } from "~/lib/auth/OAuthClient"
  import { secureStorage } from "~/lib/security/SecureStorage"
  
  const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    const { url, provider } = req.body
    
    try {
      // Parse callback URL
      const callbackUrl = new URL(url)
      const code = callbackUrl.searchParams.get('code')
      const state = callbackUrl.searchParams.get('state')
      const error = callbackUrl.searchParams.get('error')
      
      // Handle error response
      if (error) {
        const errorDescription = callbackUrl.searchParams.get('error_description')
        throw new Error(errorDescription || error)
      }
      
      if (!code) {
        throw new Error('No authorization code received')
      }
      
      // Validate state parameter
      const storedState = await chrome.storage.local.get(`oauth-state-${provider}`)
      const expectedState = storedState[`oauth-state-${provider}`]
      
      if (!state || !expectedState || !state.startsWith(expectedState)) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }
      
      // Get provider configuration
      const config = await getProviderConfig(provider)
      
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, config)
      
      // Store tokens securely
      await secureStorage.set(`oauth-tokens-${provider}`, tokens)
      
      // Clean up state
      await chrome.storage.local.remove(`oauth-state-${provider}`)
      
      // Fetch user info if applicable
      const userInfo = await fetchUserInfo(provider, tokens.accessToken)
      if (userInfo) {
        await chrome.storage.local.set({
          [`${provider}-user`]: userInfo
        })
      }
      
      // Schedule token refresh
      await tokenManager.scheduleTokenRefresh(provider)
      
      res.send({ success: true, provider })
      
    } catch (error) {
      console.error('OAuth callback error:', error)
      res.send({ 
        success: false, 
        error: error.message,
        provider 
      })
    }
  }
  
  async function exchangeCodeForTokens(
    code: string,
    config: OAuthConfig
  ): Promise<OAuthTokens> {
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri!,
      client_id: config.clientId
    })
    
    // Add client secret if not using PKCE
    if (!config.usePKCE && config.clientSecret) {
      tokenParams.append('client_secret', config.clientSecret)
    }
    
    // Add PKCE verifier if stored
    const pkceData = await chrome.storage.local.get(`pkce-verifier-${config.providerId}`)
    if (pkceData[`pkce-verifier-${config.providerId}`]) {
      tokenParams.append('code_verifier', pkceData[`pkce-verifier-${config.providerId}`])
      await chrome.storage.local.remove(`pkce-verifier-${config.providerId}`)
    }
    
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }
    
    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + ((data.expires_in || 3600) * 1000),
      scope: data.scope,
      tokenType: data.token_type || 'Bearer'
    }
  }
  
  async function fetchUserInfo(
    provider: string,
    accessToken: string
  ): Promise<any> {
    const userEndpoints: Record<string, string> = {
      github: 'https://api.github.com/user',
      jira: 'https://api.atlassian.com/me'
    }
    
    const endpoint = userEndpoints[provider]
    if (!endpoint) return null
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('Failed to fetch user info:', response.status)
        return null
      }
      
      return response.json()
    } catch (error) {
      console.error('Error fetching user info:', error)
      return null
    }
  }
  
  export default handler
  ```

---

## Story 6.3: GitHub Integration
**Description:** Implement GitHub API integration for repository insights, pull requests, and issue tracking.

**Acceptance Criteria:**
- OAuth authentication with GitHub
- Fetch repository statistics
- Display PRs and issues
- Show commit activity
- Support GitHub Enterprise

### Tickets:

#### Ticket 6.3.1: Create GitHub API Client
- **Description:** Build API client for GitHub REST and GraphQL APIs
- **Story Points:** 1 SP
- **Technical Requirements:**
  - Support both REST and GraphQL
  - Handle pagination
  - Implement rate limiting
  - Cache responses
  - Support GitHub Enterprise
- **Dependencies:** 6.2.1
- **Implementation Notes:**
  ```typescript
  // src/lib/api/GitHubClient.ts
  export class GitHubClient {
    private baseUrl: string
    private graphqlUrl: string
    
    constructor(
      private providerId: string = 'github',
      isEnterprise: boolean = false,
      enterpriseUrl?: string
    ) {
      if (isEnterprise && enterpriseUrl) {
        this.baseUrl = `${enterpriseUrl}/api/v3`
        this.graphqlUrl = `${enterpriseUrl}/api/graphql`
      } else {
        this.baseUrl = 'https://api.github.com'
        this.graphqlUrl = 'https://api.github.com/graphql'
      }
    }
    
    async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      const token = await tokenManager.getValidToken(this.providerId)
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          ...options.headers
        }
      })
      
      // Handle rate limiting
      const remaining = response.headers.get('X-RateLimit-Remaining')
      const reset = response.headers.get('X-RateLimit-Reset')
      
      if (remaining === '0' && reset) {
        const resetTime = parseInt(reset) * 1000
        const waitTime = resetTime - Date.now()
        
        if (waitTime > 0) {
          throw new RateLimitError(waitTime)
        }
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new GitHubError(error.message, response.status, error)
      }
      
      return response.json()
    }
    
    async graphql<T>(query: string, variables?: any): Promise<T> {
      const token = await tokenManager.getValidToken(this.providerId)
      
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, variables })
      })
      
      const data = await response.json()
      
      if (data.errors) {
        throw new GitHubError(
          data.errors[0].message,
          response.status,
          data.errors
        )
      }
      
      return data.data
    }
    
    async *paginate<T>(
      endpoint: string,
      options: RequestInit = {}
    ): AsyncGenerator<T[], void, unknown> {
      let url = endpoint
      
      while (url) {
        const response = await fetch(`${this.baseUrl}${url}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${await tokenManager.getValidToken(this.providerId)}`,
            'Accept': 'application/vnd.github.v3+json',
            ...options.headers
          }
        })
        
        const data = await response.json()
        yield data
        
        // Get next page URL from Link header
        const linkHeader = response.headers.get('Link')
        url = this.getNextPageUrl(linkHeader)
      }
    }
    
    async getRepositories(options: {
      type?: 'all' | 'owner' | 'member'
      sort?: 'created' | 'updated' | 'pushed' | 'full_name'
      per_page?: number
    } = {}): Promise<Repository[]> {
      const params = new URLSearchParams({
        type: options.type || 'all',
        sort: options.sort || 'updated',
        per_page: String(options.per_page || 30)
      })
      
      return this.request<Repository[]>(`/user/repos?${params}`)
    }
    
    async getRepository(owner: string, repo: string): Promise<Repository> {
      // Check cache first
      const cacheKey = `github-repo-${owner}-${repo}`
      const cached = await this.getCached<Repository>(cacheKey)
      if (cached) return cached
      
      const data = await this.request<Repository>(`/repos/${owner}/${repo}`)
      
      // Cache for 5 minutes
      await this.setCached(cacheKey, data, 5 * 60 * 1000)
      
      return data
    }
    
    async getPullRequests(
      owner: string,
      repo: string,
      options: {
        state?: 'open' | 'closed' | 'all'
        sort?: 'created' | 'updated' | 'popularity'
        direction?: 'asc' | 'desc'
      } = {}
    ): Promise<PullRequest[]> {
      const params = new URLSearchParams({
        state: options.state || 'open',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc'
      })
      
      return this.request<PullRequest[]>(
        `/repos/${owner}/${repo}/pulls?${params}`
      )
    }
    
    async getIssues(
      owner: string,
      repo: string,
      options: {
        state?: 'open' | 'closed' | 'all'
        labels?: string
        assignee?: string
        creator?: string
        mentioned?: string
      } = {}
    ): Promise<Issue[]> {
      const params = new URLSearchParams()
      Object.entries(options).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      return this.request<Issue[]>(
        `/repos/${owner}/${repo}/issues?${params}`
      )
    }
    
    async getRepositoryInsights(
      owner: string,
      repo: string
    ): Promise<RepositoryInsights> {
      const query = `
        query GetRepositoryInsights($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            stargazerCount
            forkCount
            issues(states: OPEN) { totalCount }
            pullRequests(states: OPEN) { totalCount }
            
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 1) {
                    totalCount
                    edges {
                      node {
                        committedDate
                        author { name email }
                      }
                    }
                  }
                }
              }
            }
            
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                node { name color }
                size
              }
              totalSize
            }
            
            collaborators { totalCount }
          }
        }
      `
      
      const data = await this.graphql<any>(query, { owner, name: repo })
      
      return {
        stars: data.repository.stargazerCount,
        forks: data.repository.forkCount,
        openIssues: data.repository.issues.totalCount,
        openPRs: data.repository.pullRequests.totalCount,
        totalCommits: data.repository.defaultBranchRef?.target.history.totalCount || 0,
        lastCommit: data.repository.defaultBranchRef?.target.history.edges[0]?.node,
        languages: data.repository.languages.edges.map(edge => ({
          name: edge.node.name,
          color: edge.node.color,
          percentage: (edge.size / data.repository.languages.totalSize) * 100
        })),
        collaborators: data.repository.collaborators.totalCount
      }
    }
    
    private getNextPageUrl(linkHeader: string | null): string | null {
      if (!linkHeader) return null
      
      const links = linkHeader.split(',').map(link => {
        const [url, rel] = link.split(';').map(s => s.trim())
        return {
          url: url.slice(1, -1), // Remove < and >
          rel: rel.match(/rel="(.+)"/)?.[1]
        }
      })
      
      const nextLink = links.find(link => link.rel === 'next')
      return nextLink ? nextLink.url.replace(this.baseUrl, '') : null
    }
    
    private async getCached<T>(key: string): Promise<T | null> {
      try {
        const cached = await chrome.storage.local.get(key)
        const data = cached[key]
        
        if (data && data.expiresAt > Date.now()) {
          return data.value
        }
      } catch (error) {
        console.error('Cache read error:', error)
      }
      
      return null
    }
    
    private async setCached<T>(
      key: string,
      value: T,
      ttl: number
    ): Promise<void> {
      try {
        await chrome.storage.local.set({
          [key]: {
            value,
            expiresAt: Date.now() + ttl
          }
        })
      } catch (error) {
        console.error('Cache write error:', error)
      }
    }
  }
  
  export class GitHubError extends Error {
    constructor(
      message: string,
      public status: number,
      public details: any
    ) {
      super(message)
      this.name = 'GitHubError'
    }
  }
  
  export class RateLimitError extends Error {
    constructor(public waitTime: number) {
      super(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`)
      this.name = 'RateLimitError'
    }
  }
  ```

#### Ticket 6.3.2: Build Repository Statistics Widget
- **Description:** Create widget displaying GitHub repository metrics and activity
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Show stars, forks, issues, PRs
  - Display language breakdown
  - Show recent commit activity
  - Link to repository
  - Support multiple repositories
- **Dependencies:** 6.3.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/GitHubStatsWidget.tsx
  interface GitHubStatsWidgetProps {
    repositories?: string[] // owner/repo format
  }
  
  export function GitHubStatsWidget({ repositories }: GitHubStatsWidgetProps) {
    const [selectedRepos, setSelectedRepos] = useStorage<string[]>(
      'github-selected-repos',
      repositories || []
    )
    const [repoStats, setRepoStats] = useState<Map<string, RepositoryInsights>>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()
    
    const githubClient = useMemo(() => new GitHubClient(), [])
    
    useEffect(() => {
      loadRepositoryStats()
    }, [selectedRepos])
    
    const loadRepositoryStats = async () => {
      if (selectedRepos.length === 0) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      setError(undefined)
      
      try {
        const stats = new Map<string, RepositoryInsights>()
        
        await Promise.all(
          selectedRepos.map(async (repoPath) => {
            const [owner, repo] = repoPath.split('/')
            const insights = await githubClient.getRepositoryInsights(owner, repo)
            stats.set(repoPath, insights)
          })
        )
        
        setRepoStats(stats)
      } catch (err) {
        if (err instanceof RateLimitError) {
          setError(`Rate limited. Try again in ${Math.ceil(err.waitTime / 1000)}s`)
        } else {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <BaseWidget
        title="GitHub Statistics"
        icon={<GitHubIcon />}
        onRefresh={loadRepositoryStats}
        headerActions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openRepoSelector()}
          >
            Select Repos
          </Button>
        }
      >
        {() => (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : selectedRepos.length === 0 ? (
              <EmptyState
                icon={<GitHubIcon className="w-12 h-12" />}
                title="No repositories selected"
                description="Select repositories to track their statistics"
                action={{
                  label: "Select Repositories",
                  onClick: () => openRepoSelector()
                }}
              />
            ) : (
              <div className="space-y-4">
                {selectedRepos.map(repoPath => {
                  const stats = repoStats?.get(repoPath)
                  const [owner, repo] = repoPath.split('/')
                  
                  return (
                    <RepositoryCard
                      key={repoPath}
                      owner={owner}
                      repo={repo}
                      stats={stats}
                      onRemove={() => {
                        setSelectedRepos(prev => 
                          prev.filter(r => r !== repoPath)
                        )
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </BaseWidget>
    )
  }
  
  function RepositoryCard({ owner, repo, stats, onRemove }: {
    owner: string
    repo: string
    stats?: RepositoryInsights
    onRemove: () => void
  }) {
    if (!stats) {
      return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Skeleton className="h-20" />
        </div>
      )
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              <a
                href={`https://github.com/${owner}/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                {owner}/{repo}
              </a>
            </h3>
            {stats.lastCommit && (
              <p className="text-xs text-gray-500 mt-1">
                Last commit {formatTimeAgo(new Date(stats.lastCommit.committedDate).getTime())}
              </p>
            )}
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="text-gray-500 hover:text-red-600"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <StatItem
            icon={<StarIcon className="w-4 h-4" />}
            value={stats.stars}
            label="Stars"
          />
          <StatItem
            icon={<GitForkIcon className="w-4 h-4" />}
            value={stats.forks}
            label="Forks"
          />
          <StatItem
            icon={<IssueIcon className="w-4 h-4" />}
            value={stats.openIssues}
            label="Issues"
            color="text-orange-600"
          />
          <StatItem
            icon={<PullRequestIcon className="w-4 h-4" />}
            value={stats.openPRs}
            label="PRs"
            color="text-green-600"
          />
        </div>
        
        {/* Language Breakdown */}
        {stats.languages.length > 0 && (
          <div>
            <div className="flex h-2 rounded-full overflow-hidden mb-2">
              {stats.languages.map((lang, index) => (
                <div
                  key={lang.name}
                  className="transition-all duration-300 hover:opacity-80"
                  style={{
                    backgroundColor: lang.color || '#959da5',
                    width: `${lang.percentage}%`
                  }}
                  title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {stats.languages.slice(0, 4).map(lang => (
                <div key={lang.name} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: lang.color || '#959da5' }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {lang.name} {lang.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  function StatItem({ icon, value, label, color = "text-gray-600" }: {
    icon: React.ReactNode
    value: number
    label: string
    color?: string
  }) {
    return (
      <div className="text-center">
        <div className={cn("flex justify-center mb-1", color)}>
          {icon}
        </div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    )
  }
  ```

#### Ticket 6.3.3: Add PR/Issue Tracking Widget
- **Description:** Create widget for tracking pull requests and issues across repositories
- **Story Points:** 2 SP
- **Technical Requirements:**
  - List open PRs and issues
  - Filter by assignee, label, repository
  - Show status and metadata
  - Quick actions (view, assign)
  - Real-time updates
- **Dependencies:** 6.3.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/GitHubActivityWidget.tsx
  type ActivityType = 'all' | 'pull_requests' | 'issues'
  type ActivityItem = PullRequest | Issue
  
  export function GitHubActivityWidget() {
    const [activityType, setActivityType] = useState<ActivityType>('all')
    const [items, setItems] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useStorage<ActivityFilters>('github-activity-filters', {
      assignee: 'me',
      state: 'open',
      repositories: []
    })
    
    const githubClient = useMemo(() => new GitHubClient(), [])
    
    useEffect(() => {
      loadActivity()
    }, [activityType, filters])
    
    const loadActivity = async () => {
      setLoading(true)
      
      try {
        const allItems: ActivityItem[] = []
        
        // Get user info for 'me' filter
        let assigneeUsername: string | undefined
        if (filters.assignee === 'me') {
          const user = await githubClient.request<any>('/user')
          assigneeUsername = user.login
        }
        
        // Load from selected repositories or all
        const repos = filters.repositories.length > 0 
          ? filters.repositories
          : await getDefaultRepositories()
        
        await Promise.all(
          repos.map(async (repoPath) => {
            const [owner, repo] = repoPath.split('/')
            
            if (activityType === 'all' || activityType === 'issues') {
              const issues = await githubClient.getIssues(owner, repo, {
                state: filters.state as any,
                assignee: assigneeUsername || filters.assignee
              })
              allItems.push(...issues)
            }
            
            if (activityType === 'all' || activityType === 'pull_requests') {
              const prs = await githubClient.getPullRequests(owner, repo, {
                state: filters.state as any
              })
              
              // Filter PRs by assignee if needed
              const filteredPRs = assigneeUsername
                ? prs.filter(pr => pr.assignee?.login === assigneeUsername)
                : prs
                
              allItems.push(...filteredPRs)
            }
          })
        )
        
        // Sort by updated date
        allItems.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        
        setItems(allItems)
      } catch (error) {
        console.error('Failed to load GitHub activity:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const getDefaultRepositories = async (): Promise<string[]> => {
      const repos = await githubClient.getRepositories({ 
        type: 'owner',
        sort: 'updated',
        per_page: 10
      })
      
      return repos.map(r => `${r.owner.login}/${r.name}`)
    }
    
    const isPullRequest = (item: ActivityItem): item is PullRequest => {
      return 'pull_request' in item || 'head' in item
    }
    
    return (
      <BaseWidget
        title="GitHub Activity"
        icon={<GitHubIcon />}
        onRefresh={loadActivity}
        headerActions={
          <div className="flex items-center gap-2">
            <ActivityTypeToggle
              type={activityType}
              onChange={setActivityType}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFilters(true)}
            >
              <FilterIcon className="w-4 h-4" />
            </Button>
          </div>
        }
      >
        {() => (
          <div className="space-y-3">
            {/* Active Filters */}
            {Object.keys(filters).some(k => filters[k]) && (
              <ActiveFilters
                filters={filters}
                onClear={() => setFilters({})}
              />
            )}
            
            {/* Activity List */}
            {loading ? (
              <ActivitySkeleton count={5} />
            ) : items.length === 0 ? (
              <EmptyState
                icon={<GitHubIcon className="w-12 h-12" />}
                title="No activity found"
                description="Adjust your filters or select more repositories"
              />
            ) : (
              <div className="space-y-2">
                {items.slice(0, 10).map(item => (
                  <ActivityCard
                    key={`${item.id}-${isPullRequest(item) ? 'pr' : 'issue'}`}
                    item={item}
                    isPR={isPullRequest(item)}
                  />
                ))}
                
                {items.length > 10 && (
                  <button
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
                    onClick={() => openFullActivity()}
                  >
                    View all {items.length} items →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </BaseWidget>
    )
  }
  
  function ActivityCard({ item, isPR }: {
    item: ActivityItem
    isPR: boolean
  }) {
    const repoPath = item.repository_url.split('/').slice(-2).join('/')
    
    return (
      <a
        href={item.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "block p-3 rounded-lg border transition-all",
          "bg-white dark:bg-gray-800",
          "border-gray-200 dark:border-gray-700",
          "hover:border-gray-300 dark:hover:border-gray-600",
          "hover:shadow-sm"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "mt-0.5",
            isPR ? "text-green-600" : "text-purple-600"
          )}>
            {isPR ? <PullRequestIcon /> : <IssueIcon />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
              {item.title}
            </h4>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{repoPath}</span>
              <span>#{item.number}</span>
              <span>•</span>
              <span>{formatTimeAgo(new Date(item.updated_at).getTime())}</span>
              
              {item.assignee && (
                <>
                  <span>•</span>
                  <img
                    src={item.assignee.avatar_url}
                    alt={item.assignee.login}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{item.assignee.login}</span>
                </>
              )}
            </div>
            
            {/* Labels */}
            {item.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.labels.slice(0, 3).map(label => (
                  <span
                    key={label.id}
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`
                    }}
                  >
                    {label.name}
                  </span>
                ))}
                {item.labels.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{item.labels.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Status */}
          <div className="flex-shrink-0">
            <StatusBadge
              state={item.state}
              isPR={isPR}
              isDraft={isPR && (item as PullRequest).draft}
            />
          </div>
        </div>
      </a>
    )
  }
  
  function StatusBadge({ state, isPR, isDraft }: {
    state: string
    isPR: boolean
    isDraft?: boolean
  }) {
    const config = {
      open: {
        color: isPR ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700',
        icon: isPR ? <GitPullRequestIcon /> : <IssueOpenIcon />
      },
      closed: {
        color: 'bg-red-100 text-red-700',
        icon: <IssueClosedIcon />
      },
      merged: {
        color: 'bg-purple-100 text-purple-700',
        icon: <GitMergeIcon />
      },
      draft: {
        color: 'bg-gray-100 text-gray-700',
        icon: <GitPullRequestDraftIcon />
      }
    }
    
    const status = isDraft ? 'draft' : state
    const { color, icon } = config[status] || config.open
    
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        color
      )}>
        {React.cloneElement(icon, { className: "w-3 h-3" })}
        <span className="capitalize">{status}</span>
      </div>
    )
  }
  ```

---

## Story 6.4: Analytics Platform Integration
**Description:** Create generic analytics integration framework that can connect to various analytics platforms like Google Analytics, Mixpanel, etc.

**Acceptance Criteria:**
- Generic analytics API adapter
- Support multiple analytics providers
- Fetch key metrics and reports
- Display in dashboard widgets
- Handle different auth methods

### Tickets:

#### Ticket 6.4.1: Create Generic Analytics API Adapter
- **Description:** Build flexible adapter pattern for different analytics APIs
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Define common analytics interface
  - Implement provider-specific adapters
  - Handle different auth methods
  - Standardize data formats
  - Support custom metrics
- **Dependencies:** 6.2.1
- **Implementation Notes:**
  ```typescript
  // src/lib/api/analytics/AnalyticsAdapter.ts
  export interface AnalyticsProvider {
    id: string
    name: string
    authenticate(): Promise<void>
    getMetrics(config: MetricsConfig): Promise<MetricsData>
    getDimensions(): Promise<Dimension[]>
    getReports(config: ReportConfig): Promise<Report[]>
    testConnection(): Promise<boolean>
  }
  
  export interface MetricsConfig {
    metrics: string[]
    dimensions?: string[]
    dateRange: {
      startDate: string
      endDate: string
    }
    filters?: Filter[]
    orderBy?: OrderBy[]
    limit?: number
  }
  
  export interface MetricsData {
    headers: MetricHeader[]
    rows: MetricRow[]
    totals?: Record<string, number>
    metadata?: Record<string, any>
  }
  
  export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
    constructor(
      public id: string,
      public name: string,
      protected config: AnalyticsConfig
    ) {}
    
    abstract authenticate(): Promise<void>
    abstract getMetrics(config: MetricsConfig): Promise<MetricsData>
    abstract getDimensions(): Promise<Dimension[]>
    
    async getReports(config: ReportConfig): Promise<Report[]> {
      // Default implementation using getMetrics
      const reports: Report[] = []
      
      for (const reportDef of config.reports) {
        const metricsData = await this.getMetrics({
          metrics: reportDef.metrics,
          dimensions: reportDef.dimensions,
          dateRange: config.dateRange,
          filters: reportDef.filters
        })
        
        reports.push({
          id: reportDef.id,
          name: reportDef.name,
          data: metricsData,
          visualizations: this.generateVisualizations(metricsData, reportDef)
        })
      }
      
      return reports
    }
    
    async testConnection(): Promise<boolean> {
      try {
        // Try to fetch minimal data
        await this.getMetrics({
          metrics: ['sessions'],
          dateRange: {
            startDate: 'yesterday',
            endDate: 'yesterday'
          },
          limit: 1
        })
        return true
      } catch (error) {
        return false
      }
    }
    
    protected normalizeDate(date: string): string {
      // Handle relative dates
      const relatives: Record<string, () => string> = {
        'today': () => new Date().toISOString().split('T')[0],
        'yesterday': () => {
          const d = new Date()
          d.setDate(d.getDate() - 1)
          return d.toISOString().split('T')[0]
        },
        '7daysAgo': () => {
          const d = new Date()
          d.setDate(d.getDate() - 7)
          return d.toISOString().split('T')[0]
        },
        '30daysAgo': () => {
          const d = new Date()
          d.setDate(d.getDate() - 30)
          return d.toISOString().split('T')[0]
        }
      }
      
      return relatives[date]?.() || date
    }
    
    protected generateVisualizations(
      data: MetricsData,
      reportDef: ReportDefinition
    ): Visualization[] {
      const visualizations: Visualization[] = []
      
      // Auto-generate based on data type
      if (reportDef.dimensions?.includes('date')) {
        visualizations.push({
          type: 'line',
          title: `${reportDef.metrics[0]} Over Time`,
          data: this.formatForLineChart(data)
        })
      }
      
      if (reportDef.dimensions?.length === 1 && !reportDef.dimensions.includes('date')) {
        visualizations.push({
          type: 'bar',
          title: `${reportDef.metrics[0]} by ${reportDef.dimensions[0]}`,
          data: this.formatForBarChart(data)
        })
      }
      
      // Add metric cards for totals
      if (data.totals) {
        visualizations.push({
          type: 'metric-cards',
          title: 'Summary',
          data: Object.entries(data.totals).map(([key, value]) => ({
            label: key,
            value,
            change: this.calculateChange(data, key)
          }))
        })
      }
      
      return visualizations
    }
    
    private formatForLineChart(data: MetricsData): any {
      // Transform data for chart.js line chart
      const labels = data.rows.map(row => row.dimensions[0])
      const datasets = data.headers
        .filter(h => h.type === 'metric')
        .map((header, index) => ({
          label: header.name,
          data: data.rows.map(row => row.metrics[index]),
          borderColor: this.getChartColor(index),
          tension: 0.1
        }))
      
      return { labels, datasets }
    }
    
    private formatForBarChart(data: MetricsData): any {
      // Transform data for chart.js bar chart
      const labels = data.rows.map(row => row.dimensions[0])
      const datasets = data.headers
        .filter(h => h.type === 'metric')
        .map((header, index) => ({
          label: header.name,
          data: data.rows.map(row => row.metrics[index]),
          backgroundColor: this.getChartColor(index)
        }))
      
      return { labels, datasets }
    }
    
    private calculateChange(data: MetricsData, metric: string): number {
      // Calculate period-over-period change
      // Implementation depends on data structure
      return 0
    }
    
    private getChartColor(index: number): string {
      const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899'  // pink
      ]
      
      return colors[index % colors.length]
    }
  }
  
  // Google Analytics Implementation
  export class GoogleAnalyticsProvider extends BaseAnalyticsProvider {
    private accessToken?: string
    
    constructor(config: GoogleAnalyticsConfig) {
      super('google-analytics', 'Google Analytics', config)
    }
    
    async authenticate(): Promise<void> {
      const oauthClient = new OAuthClient({
        providerId: 'google-analytics',
        clientId: this.config.clientId,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        additionalParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      })
      
      const tokens = await oauthClient.startAuthFlow()
      this.accessToken = tokens.accessToken
    }
    
    async getMetrics(config: MetricsConfig): Promise<MetricsData> {
      if (!this.accessToken) {
        await this.authenticate()
      }
      
      const response = await fetch(
        `https://analyticsreporting.googleapis.com/v4/reports:batchGet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reportRequests: [{
              viewId: this.config.viewId,
              dateRanges: [{
                startDate: this.normalizeDate(config.dateRange.startDate),
                endDate: this.normalizeDate(config.dateRange.endDate)
              }],
              metrics: config.metrics.map(m => ({ expression: `ga:${m}` })),
              dimensions: config.dimensions?.map(d => ({ name: `ga:${d}` })),
              orderBys: config.orderBy?.map(o => ({
                fieldName: `ga:${o.field}`,
                sortOrder: o.direction
              })),
              pageSize: config.limit || 1000
            }]
          })
        }
      )
      
      const data = await response.json()
      return this.transformGoogleAnalyticsResponse(data.reports[0])
    }
    
    async getDimensions(): Promise<Dimension[]> {
      // Return available GA dimensions
      return [
        { id: 'date', name: 'Date', type: 'time' },
        { id: 'source', name: 'Source', type: 'string' },
        { id: 'medium', name: 'Medium', type: 'string' },
        { id: 'campaign', name: 'Campaign', type: 'string' },
        { id: 'deviceCategory', name: 'Device Category', type: 'string' },
        { id: 'country', name: 'Country', type: 'string' },
        { id: 'pagePath', name: 'Page Path', type: 'string' }
      ]
    }
    
    private transformGoogleAnalyticsResponse(report: any): MetricsData {
      const headers: MetricHeader[] = [
        ...(report.columnHeader.dimensions || []).map((d: string) => ({
          name: d.replace('ga:', ''),
          type: 'dimension' as const
        })),
        ...report.columnHeader.metricHeader.metricHeaderEntries.map((m: any) => ({
          name: m.name.replace('ga:', ''),
          type: 'metric' as const,
          dataType: m.type.toLowerCase()
        }))
      ]
      
      const rows: MetricRow[] = (report.data.rows || []).map((row: any) => ({
        dimensions: row.dimensions || [],
        metrics: row.metrics[0].values.map((v: string) => parseFloat(v))
      }))
      
      const totals = report.data.totals?.[0]?.values.reduce((acc: any, val: string, idx: number) => {
        const metricName = headers.filter(h => h.type === 'metric')[idx]?.name
        if (metricName) acc[metricName] = parseFloat(val)
        return acc
      }, {})
      
      return { headers, rows, totals }
    }
  }
  
  // Analytics Manager
  export class AnalyticsManager {
    private providers = new Map<string, AnalyticsProvider>()
    
    registerProvider(provider: AnalyticsProvider): void {
      this.providers.set(provider.id, provider)
    }
    
    getProvider(id: string): AnalyticsProvider {
      const provider = this.providers.get(id)
      if (!provider) {
        throw new Error(`Analytics provider ${id} not found`)
      }
      return provider
    }
    
    async getConnectedProviders(): Promise<AnalyticsProvider[]> {
      const connected: AnalyticsProvider[] = []
      
      for (const provider of this.providers.values()) {
        if (await provider.testConnection()) {
          connected.push(provider)
        }
      }
      
      return connected
    }
  }
  
  export const analyticsManager = new AnalyticsManager()
  ```

#### Ticket 6.4.2: Build Metrics Visualization Widget
- **Description:** Create widget for displaying analytics metrics with charts and insights
- **Story Points:** 2 SP
- **Technical Requirements:**
  - Support multiple chart types
  - Real-time data updates
  - Customizable metrics selection
  - Period comparison
  - Export functionality
- **Dependencies:** 6.4.1
- **Implementation Notes:**
  ```typescript
  // src/components/widgets/AnalyticsWidget.tsx
  interface AnalyticsWidgetProps {
    providerId?: string
    defaultMetrics?: string[]
    refreshInterval?: number
  }
  
  export function AnalyticsWidget({ 
    providerId = 'google-analytics',
    defaultMetrics = ['sessions', 'users', 'pageviews', 'bounceRate'],
    refreshInterval = 15 * 60 * 1000 // 15 minutes
  }: AnalyticsWidgetProps) {
    const [selectedProvider, setSelectedProvider] = useState(providerId)
    const [metrics, setMetrics] = useState<MetricsData>()
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
      startDate: '7daysAgo',
      endDate: 'yesterday'
    })
    const [comparison, setComparison] = useState<'previous' | 'year' | null>(null)
    const [selectedMetrics, setSelectedMetrics] = useState(defaultMetrics)
    
    useEffect(() => {
      loadMetrics()
      
      const interval = setInterval(loadMetrics, refreshInterval)
      return () => clearInterval(interval)
    }, [selectedProvider, dateRange, selectedMetrics])
    
    const loadMetrics = async () => {
      setLoading(true)
      
      try {
        const provider = analyticsManager.getProvider(selectedProvider)
        
        // Load main metrics
        const mainMetrics = await provider.getMetrics({
          metrics: selectedMetrics,
          dimensions: ['date'],
          dateRange
        })
        
        // Load comparison if selected
        let comparisonMetrics: MetricsData | undefined
        if (comparison) {
          const comparisonRange = getComparisonDateRange(dateRange, comparison)
          comparisonMetrics = await provider.getMetrics({
            metrics: selectedMetrics,
            dateRange: comparisonRange
          })
        }
        
        setMetrics({
          ...mainMetrics,
          comparison: comparisonMetrics
        })
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    return (
      <BaseWidget
        title="Analytics Dashboard"
        icon={<ChartIcon />}
        onRefresh={loadMetrics}
        headerActions={
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              presets={[
                { label: 'Last 7 days', value: { startDate: '7daysAgo', endDate: 'yesterday' }},
                { label: 'Last 30 days', value: { startDate: '30daysAgo', endDate: 'yesterday' }},
                { label: 'This month', value: { startDate: 'monthStart', endDate: 'today' }}
              ]}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(true)}
            >
              <SettingsIcon className="w-4 h-4" />
            </Button>
          </div>
        }
      >
        {() => (
          <div className="space-y-4">
            {loading ? (
              <MetricsSkeleton />
            ) : metrics ? (
              <>
                {/* Metric Cards */}
                <MetricCardsGrid
                  metrics={metrics}
                  comparison={comparison}
                />
                
                {/* Chart */}
                <MetricsChart
                  data={metrics}
                  height={300}
                />
                
                {/* Top Pages/Sources */}
                <div className="grid grid-cols-2 gap-4">
                  <TopItemsList
                    title="Top Pages"
                    dimension="pagePath"
                    metric="pageviews"
                    limit={5}
                  />
                  <TopItemsList
                    title="Top Sources"
                    dimension="source"
                    metric="sessions"
                    limit={5}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                icon={<ChartIcon className="w-12 h-12" />}
                title="No analytics data"
                description="Connect your analytics account to see metrics"
                action={{
                  label: "Connect Analytics",
                  onClick: () => connectAnalytics()
                }}
              />
            )}
          </div>
        )}
      </BaseWidget>
    )
  }
  
  function MetricCardsGrid({ metrics, comparison }: {
    metrics: MetricsData
    comparison: 'previous' | 'year' | null
  }) {
    const totals = metrics.totals || {}
    const comparisonTotals = metrics.comparison?.totals || {}
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(totals).map(([metric, value]) => {
          const comparisonValue = comparisonTotals[metric]
          const change = comparisonValue 
            ? ((value - comparisonValue) / comparisonValue) * 100
            : null
          
          return (
            <MetricCard
              key={metric}
              label={formatMetricName(metric)}
              value={value}
              change={change}
              format={getMetricFormat(metric)}
            />
          )
        })}
      </div>
    )
  }
  
  function MetricCard({ label, value, change, format }: {
    label: string
    value: number
    change: number | null
    format: 'number' | 'percent' | 'duration'
  }) {
    const formattedValue = formatMetricValue(value, format)
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
          {formattedValue}
        </div>
        {change !== null && (
          <div className={cn(
            "text-sm mt-1 flex items-center gap-1",
            change >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
    )
  }
  
  function MetricsChart({ data, height }: {
    data: MetricsData
    height: number
  }) {
    const chartData = useMemo(() => {
      // Transform data for Chart.js
      const labels = data.rows.map(row => 
        formatDate(row.dimensions[0], 'MMM dd')
      )
      
      const datasets = data.headers
        .filter(h => h.type === 'metric')
        .map((header, index) => ({
          label: formatMetricName(header.name),
          data: data.rows.map(row => row.metrics[index]),
          borderColor: getChartColor(index),
          backgroundColor: getChartColor(index) + '20',
          tension: 0.1
        }))
      
      return { labels, datasets }
    }, [data])
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
    
    return (
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
    )
  }
  
  function formatMetricValue(value: number, format: string): string {
    switch (format) {
      case 'percent':
        return `${value.toFixed(1)}%`
      case 'duration':
        const minutes = Math.floor(value / 60)
        const seconds = Math.floor(value % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      default:
        return value.toLocaleString()
    }
  }
  
  function formatMetricName(metric: string): string {
    // Convert camelCase to Title Case
    return metric
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
  
  function getMetricFormat(metric: string): 'number' | 'percent' | 'duration' {
    if (metric.includes('Rate') || metric.includes('Percentage')) return 'percent'
    if (metric.includes('Duration') || metric.includes('Time')) return 'duration'
    return 'number'
  }
  ```

---

## Epic Summary

### Deliverables:
- ✅ Secure storage system with encryption and master password
- ✅ Generic OAuth 2.0 implementation with PKCE support
- ✅ GitHub integration with statistics and activity tracking
- ✅ Analytics platform adapter framework
- ✅ Beautiful widgets for all integrations

### Key Milestones:
1. **Security Foundation Complete** - SecureStorage and encryption working
2. **OAuth Flow Implemented** - Generic OAuth handler with token refresh
3. **First Integration Live** - GitHub fully integrated
4. **Analytics Connected** - Generic analytics framework operational

### Next Steps:
- Proceed to Epic 7: Settings & Configuration
- Add more OAuth providers (Slack, Linear, etc.)
- Implement webhook support for real-time updates
- Add data export capabilities for all integrations