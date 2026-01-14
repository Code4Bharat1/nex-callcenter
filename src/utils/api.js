/**
 * API utility functions for making authenticated requests
 * All functions include credentials: 'include' for session cookies
 */

const API_BASE = '';

export const api = {
  /**
   * Generic fetch wrapper with error handling
   */
  async fetch(url, options = {}) {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers
      }
    };

    try {
      const response = await window.fetch(`${API_BASE}${url}`, { 
        ...defaultOptions, 
        ...options,
        cache: 'no-store' // Prevent browser caching
      });
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      
      if (!response.ok) {
        let errorData;
        if (isJson) {
          try {
            errorData = await response.json();
          } catch (e) {
            const text = await response.text();
            errorData = { error: text || `HTTP ${response.status}` };
          }
        } else {
          const text = await response.text();
          errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response as JSON only if content type indicates JSON
      if (isJson) {
        try {
          return await response.json();
        } catch (parseError) {
          const text = await response.text();
          console.error(`API Error [${url}]: Failed to parse JSON response:`, parseError);
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
      } else {
        // If not JSON, return as text wrapped in an object
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.error(`API Error [${url}]:`, error);
      throw error;
    }
  },

  /**
   * Get shop balance
   */
  async getShopBalance(shop) {
    if (!shop) throw new Error('Shop parameter required');
    return this.fetch(`/api/shop-balance?shop=${encodeURIComponent(shop)}`);
  },

  /**
   * Get plan usage data
   */
  async getPlanUsage(shop, startDate = null, endDate = null) {
    if (!shop) throw new Error('Shop parameter required');
    let url = `/api/plan-usage?shop=${encodeURIComponent(shop)}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    return this.fetch(url);
  },

  /**
   * Get system status check
   */
  async getSystemStatus(shop) {
    if (!shop) throw new Error('Shop parameter required');
    return this.fetch(`/api/system-status-check?shop=${encodeURIComponent(shop)}`);
  },

  /**
   * Get calls initiated in last hour
   */
  async getCallsLastHour(shop) {
    if (!shop) throw new Error('Shop parameter required');
    return this.fetch(`/api/calls-last-hour?shop=${encodeURIComponent(shop)}`);
  },

  /**
   * Get calls per hour
   */
  async getCallsPerHour(shop, hoursBack = 24) {
    if (!shop) throw new Error('Shop parameter required');
    return this.fetch(`/api/calls-per-hour?shop=${encodeURIComponent(shop)}&hoursBack=${hoursBack}`);
  },

  /**
   * Get orders with filters
   */
  async getOrders(shop, params = {}) {
    if (!shop) throw new Error('Shop parameter required');
    const queryParams = new URLSearchParams({ shop, ...params });
    return this.fetch(`/api/orders?${queryParams.toString()}`);
  },

  /**
   * Get abandoned checkout orders
   */
  async getAbandonedCheckouts(shop, params = {}) {
    if (!shop) throw new Error('Shop parameter required');
    const queryParams = new URLSearchParams({ shop, ...params });
    return this.fetch(`/api/abandoned-checkouts?${queryParams.toString()}`);
  },

  /**
   * Get low intent orders (RTO bucket)
   */
  async getLowIntentOrders(shop, params = {}) {
    if (!shop) throw new Error('Shop parameter required');
    const queryParams = new URLSearchParams({ shop, ...params });
    return this.fetch(`/api/low-intent-orders?${queryParams.toString()}`);
  },

  /**
   * Get scripts (call scripts/agents)
   */
  async getScripts(shop) {
    const queryParams = new URLSearchParams();
    if (shop) {
      queryParams.set('shop', shop);
    }
    // Add cache-busting timestamp to ensure fresh data
    queryParams.set('_t', Date.now().toString());
    return this.fetch(`/api/scripts?${queryParams.toString()}`);
  },

  /**
   * Create script
   */
  async createScript(shop, scriptData) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/scripts${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(scriptData)
    });
  },

  /**
   * Update script
   */
  async updateScript(scriptId, shop, scriptData) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/scripts/${scriptId}${queryParams}`, {
      method: 'PUT',
      body: JSON.stringify(scriptData)
    });
  },

  /**
   * Delete script
   */
  async deleteScript(scriptId, shop) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/scripts/${scriptId}${queryParams}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get knowledge books
   */
  async getKnowledgeBooks(shop) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/knowledge-books${queryParams}`);
  },

  /**
   * Create knowledge book
   */
  async createKnowledgeBook(shop, knowledgeBookData) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/knowledge-books${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(knowledgeBookData)
    });
  },

  /**
   * Update knowledge book
   */
  async updateKnowledgeBook(knowledgeBookId, shop, knowledgeBookData) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/knowledge-books/${knowledgeBookId}${queryParams}`, {
      method: 'PUT',
      body: JSON.stringify(knowledgeBookData)
    });
  },

  /**
   * Delete knowledge book
   */
  async deleteKnowledgeBook(knowledgeBookId, shop) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/knowledge-books/${knowledgeBookId}${queryParams}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get call history
   */
  async getCallHistory(shop, params = {}) {
    if (!shop) throw new Error('Shop parameter required');
    const queryParams = new URLSearchParams({ shop, ...params });
    return this.fetch(`/api/call-history?${queryParams.toString()}`);
  },

  /**
   * Get usage data
   */
  async getUsageData(shop, params = {}) {
    if (!shop) throw new Error('Shop parameter required');
    const queryParams = new URLSearchParams({ shop, ...params });
    return this.fetch(`/api/usage-data?${queryParams.toString()}`);
  },

  /**
   * Get daily call volume (for stats)
   */
  async getDailyCallVolume(shop) {
    if (!shop) throw new Error('Shop parameter required');
    return this.fetch(`/api/daily-call-volume?shop=${encodeURIComponent(shop)}`);
  },

  /**
   * Get Cartesia voices
   */
  async getVoices(query = '', shop) {
    const params = new URLSearchParams();
    if (shop) params.append('shop', shop);
    if (query) params.append('q', query);
    return this.fetch(`/api/cartesia/voices?${params.toString()}`);
  },

  /**
   * Preview voice (TTS) - DISABLED
   */
  async previewVoice(voiceId, text = 'This is a preview of this voice. How does it sound?', shop = null) {
    throw new Error('Voice generation is disabled. Please use pre-generated audio files only.');
  },

  /**
   * Preview Sarvam voice (TTS) - DISABLED
   */
  async previewSarvamVoice(voiceId, text = 'This is a preview of this voice. How does it sound?', shop = null) {
    throw new Error('Voice generation is disabled. Please use pre-generated audio files only.');
  },

  /**
   * Clone voice
   */
  async cloneVoice(shop, formData) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return window.fetch(`/api/cartesia/voices/clone${queryParams}`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
  },

  /**
   * Get integrations/Shopify connection status
   */
  async getShopifyConnection(shop) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/shopify/connection${queryParams}`);
  },

  /**
   * Connect Shopify store
   */
  async connectShopify(shopUrl, accessToken) {
    return this.fetch('/api/shopify/connect', {
      method: 'POST',
      body: JSON.stringify({ shopUrl, accessToken })
    });
  },

  /**
   * Disconnect Shopify store
   */
  async disconnectShopify(shopId) {
    return this.fetch(`/api/shopify/disconnect/${shopId}`, {
      method: 'POST'
    });
  },

  /**
   * Get user profile
   */
  async getUserProfile() {
    return this.fetch('/api/user/profile');
  },

  /**
   * Update user profile
   */
  async updateUserProfile(name, avatar, phone) {
    return this.fetch('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify({ name, avatar, phone })
    });
  },

  /**
   * Get performance data
   */
  async getPerformanceData(shop, params = {}) {
    if (!shop) throw new Error('Shop parameter required');
    const queryParams = new URLSearchParams({ shop, ...params });
    return this.fetch(`/api/performance-data?${queryParams.toString()}`);
  },

  /**
   * Get AI calls data
   */
  async getAiCalls(shop, params = {}) {
    if (!shop) throw new Error('Shop parameter required');
    const queryParams = new URLSearchParams({ shop, ...params });
    return this.fetch(`/api/ai-calls?${queryParams.toString()}`);
  },

  /**
   * Get daily billing stats
   */
  async getDailyBillingStats(shop, startDate, endDate) {
    if (!shop) throw new Error('Shop parameter required');
    const params = new URLSearchParams({ shop });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    // Backward compatibility: if only one date provided, use it as both
    if (startDate && !endDate) {
      params.append('date', startDate);
    }
    return this.fetch(`/api/daily-billing-stats?${params.toString()}`);
  },

  /**
   * Get billing breakdown
   */
  async getBillingBreakdown(shop, startDate, endDate) {
    if (!shop) throw new Error('Shop parameter required');
    const params = new URLSearchParams({ shop });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    // Backward compatibility: if only one date provided, use it as both
    if (startDate && !endDate) {
      params.append('date', startDate);
    }
    return this.fetch(`/api/billing-breakdown?${params.toString()}`);
  },

  /**
   * Export usage data
   */
  async exportUsageData(shop) {
    if (!shop) throw new Error('Shop parameter required');
    const url = `/api/usage-export?shop=${encodeURIComponent(shop)}`;
    const response = await window.fetch(url, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `usage-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Get test orders
   */
  async getTestOrders(shop) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/test-orders${queryParams}`);
  },

  /**
   * Create test order
   */
  async createTestOrder(shop, orderData) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/test-orders${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  /**
   * Queue test order (legacy - kept for backward compatibility)
   */
  async queueTestOrder(orderId, scriptId, shop) {
    return this.fetch('/api/set-queue', {
      method: 'POST',
      body: JSON.stringify({ orderId, shop, scriptId })
    });
  },

  /**
   * Update order scriptId
   */
  async updateOrderScript(orderId, scriptId, shop) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/orders/${orderId}/script${queryParams}`, {
      method: 'POST',
      body: JSON.stringify({ scriptId })
    });
  },

  /**
   * Make test call via backend (which proxies to Python calling API)
   */
  async makeTestCall(orderId) {
    return this.fetch('/api/test-call', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId })
    });
  },

  /**
   * Set default script
   */
  async setDefaultScript(scriptId, shop) {
    const queryParams = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    return this.fetch(`/api/scripts/${scriptId}/default${queryParams}`, {
      method: 'POST'
    });
  },

  /**
   * Generate script with Claude AI (non-streaming)
   */
  async generateScriptWithClaude(prompt, currentScript) {
    return this.fetch('/api/claude/generate-script', {
      method: 'POST',
      body: JSON.stringify({ prompt, currentScript, stream: false })
    });
  },

  /**
   * Get evaluation test cases
   */
  async getEvaluationTestCases() {
    return this.fetch('/api/evaluation/test-cases');
  },

  /**
   * Get default evaluation prompts
   */
  async getEvaluationDefaultPrompts() {
    return this.fetch('/api/evaluation/default-prompts');
  },

  /**
   * Extract evaluation rules from script
   */
  async extractEvaluationRules(scriptContent, extractorPrompt = null) {
    return this.fetch('/api/evaluation/extract-rules', {
      method: 'POST',
      body: JSON.stringify({ scriptContent, extractorPrompt })
    });
  },

  /**
   * Run full evaluation
   */
  async runEvaluation(data) {
    return this.fetch('/api/evaluation/run', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Generate script with Claude AI (streaming)
   */
  async *generateScriptWithClaudeStream(prompt, currentScript, generationMode = 'simple', abortSignal = null, onChunk) {
    // Debug: Log what we're sending
    console.log('[API] Sending generationMode:', generationMode, '| Type:', typeof generationMode, '| JSON:', JSON.stringify({ prompt: prompt.substring(0, 50) + '...', currentScript: currentScript ? 'exists' : 'null', generationMode, stream: true }));
    
    const response = await fetch('/api/claude/generate-script', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, currentScript, generationMode, stream: true }),
      signal: abortSignal // Pass abort signal to fetch
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        // Check if aborted
        if (abortSignal && abortSignal.aborted) {
          reader.cancel();
          throw new DOMException('The operation was aborted.', 'AbortError');
        }
        
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              if (json.chunk) {
                onChunk(json.chunk);
                yield json.chunk;
              } else if (json.done) {
                return;
              } else if (json.error) {
                throw new Error(json.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  /**
   * Fetch website content using Claude API
   */
  async fetchWebsiteContent(websiteUrl) {
    return this.fetch('/api/claude/fetch-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ websiteUrl })
    });
  },

  /**
    * Generate script with Claude AI securely (no content sent to frontend)
    * Saves directly to database, returns only metadata
    */
   async generateScriptWithClaudeSecure(prompt, generationMode = 'simple', abortSignal = null) {
     console.log('[API] Calling secure generate script...');
     
     const response = await fetch('/api/claude/generate-script-secure', {
       method: 'POST',
       credentials: 'include',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({ prompt, generationMode }),
       signal: abortSignal
     });

     if (!response.ok) {
       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
     }

     const result = await response.json();
     
     if (result.error) {
       throw new Error(result.error);
     }
     
     console.log('[API] Secure generation complete:', {
       success: result.success,
       lineCount: result.lineCount,
       wordCount: result.wordCount
     });
     
     return result;
   },

  /**
   * Get transcript analytics (turns and duration dropoff)
   */
  async getTranscriptAnalytics(limit, scriptId, shop) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (scriptId) params.append('scriptId', scriptId);
    if (shop) params.append('shop', shop);
    
    return this.fetch(`/api/transcript-analytics?${params.toString()}`);
  }
};

// Export individual functions for easier imports
// Using function declarations to avoid hoisting issues with circular dependencies
export function getCallScripts(shop) { return api.getScripts(shop); }
export function createScript(scriptData, shop) { return api.createScript(shop, scriptData); }
export function updateScript(scriptId, scriptData, shop) { return api.updateScript(scriptId, shop, scriptData); }
export function deleteScript(scriptId, shop) { return api.deleteScript(scriptId, shop); }
export function generateScriptWithClaude(prompt, currentScript) { return api.generateScriptWithClaude(prompt, currentScript); }
export function generateScriptWithClaudeSecure(prompt, generationMode, abortSignal) { return api.generateScriptWithClaudeSecure(prompt, generationMode, abortSignal); }
export function getTestOrders(shop) { return api.getTestOrders(shop); }
export function createTestOrder(orderData, shop) { return api.createTestOrder(shop, orderData); }
export function getKnowledgeBooks(shop) { return api.getKnowledgeBooks(shop); }
export function createKnowledgeBook(shop, knowledgeBookData) { return api.createKnowledgeBook(shop, knowledgeBookData); }
export function updateKnowledgeBook(knowledgeBookId, shop, knowledgeBookData) { return api.updateKnowledgeBook(knowledgeBookId, shop, knowledgeBookData); }
export function deleteKnowledgeBook(knowledgeBookId, shop) { return api.deleteKnowledgeBook(knowledgeBookId, shop); }
export function queueTestOrder(orderId, scriptId, shop) { return api.queueTestOrder(orderId, scriptId, shop); }
export function updateOrderScript(orderId, scriptId, shop) { return api.updateOrderScript(orderId, scriptId, shop); }
export function makeTestCall(orderId, callingApiUrl) { return api.makeTestCall(orderId, callingApiUrl); }
export function getVoices(query, shop) { return api.getVoices(query, shop); }
export function previewVoice(voiceId, text) { return api.previewVoice(voiceId, text); }
export function previewSarvamVoice(voiceId, text, shop) { return api.previewSarvamVoice(voiceId, text, shop); }
export function cloneVoice(formData, shop) { return api.cloneVoice(shop, formData); }
export function getShopBalance(shop) { return api.getShopBalance(shop); }
export function getOrders(shop, params) { return api.getOrders(shop, params); }
export function getAbandonedCheckouts(shop, params) { return api.getAbandonedCheckouts(shop, params); }
export function getLowIntentOrders(shop, params) { return api.getLowIntentOrders(shop, params); }
export function getCallHistory(shop, params) { return api.getCallHistory(shop, params); }
export function getUsageData(shop, params) { return api.getUsageData(shop, params); }
export function getDailyCallVolume(shop) { return api.getDailyCallVolume(shop); }
export function getShopifyConnection(shop) { return api.getShopifyConnection(shop); }
export function connectShopify(shopUrl, accessToken) { return api.connectShopify(shopUrl, accessToken); }
export function disconnectShop(shopId) { return api.disconnectShopify(shopId); }
export function getUserProfile() { return api.getUserProfile(); }
export function updateUserProfile(name) { return api.updateUserProfile(name); }
export function getDailyBillingStats(shop, date) { return api.getDailyBillingStats(shop, date); }
export function getBillingBreakdown(shop, date) { return api.getBillingBreakdown(shop, date); }
export function exportUsageData(shop) { return api.exportUsageData(shop); }
export function getPerformanceData(shop, params) { return api.getPerformanceData(shop, params); }
export function getAICalls(shop, params) { return api.getAiCalls(shop, params); }
export function setDefaultScript(scriptId, shop) { return api.setDefaultScript(scriptId, shop); }
export function getTranscriptAnalytics(limit, scriptId, shop) { return api.getTranscriptAnalytics(limit, scriptId, shop); }

