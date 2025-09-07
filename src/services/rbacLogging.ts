/**
 * RBAC Logging Service
 * 
 * A comprehensive logging system that tracks all user interactions across the application
 * based on their role-based access control (RBAC) permissions.
 */

import { database } from './database';
import { useAuthStore } from '../store/authStore';

// Define the possible interaction types
export enum InteractionType {
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  TABLE_FILTER = 'table_filter',
  TABLE_SORT = 'table_sort',
  DROPDOWN_SELECT = 'dropdown_select',
  CARD_EXPAND = 'card_expand',
  LINK_CLICK = 'link_click',
  TAB_SWITCH = 'tab_switch',
  FILE_UPLOAD = 'file_upload',
  FILE_DOWNLOAD = 'file_download',
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  AUTHENTICATION = 'authentication',
  ERROR = 'error'
}

// Define the interaction log structure
export interface InteractionLog {
  id?: string;
  timestamp: string;
  user_id: string;
  user_role: string;
  session_id: string;
  interaction_type: InteractionType;
  component: string;
  page: string;
  action: string;
  target?: string;
  details?: any;
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    window_size?: {
      width: number;
      height: number
    };
    duration_ms?: number;
    success?: boolean;
    response_size_bytes?: number;
  };
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

class RBACLoggingService {
  private sessionId: string;
  private currentPage: string = '';
  private userRole: string = 'anonymous';
  private userId: string = 'anonymous';
  private logsQueue: InteractionLog[] = [];
  private flushInterval: number | null = null;
  private maxQueueSize: number = 10;
  private isLoggingEnabled: boolean = true;
  private excludedPaths: string[] = ['/login', '/privacy', '/terms'];
  private sensitiveFields: string[] = ['password', 'token', 'credit_card', 'secret'];

  constructor() {
    this.sessionId = generateSessionId();
    this.initializeFlushInterval();

    // Set up cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  /**
   * Initialize the flush interval
   */
  private initializeFlushInterval() {
    if (typeof window !== 'undefined') {
      // Flush logs every 30 seconds
      this.flushInterval = window.setInterval(() => this.flush(), 30000);
    }
  }

  /**
   * Update the current user information
   */
  public updateUserInfo() {
    const authStore = useAuthStore.getState();
    if (authStore.user && authStore.userProfile) {
      this.userId = authStore.user.id;
      this.userRole = authStore.userProfile.role;
    }
  }

  /**
   * Set the current page for all subsequent logs
   */
  public setCurrentPage(path: string) {
    this.currentPage = path;
    // Log page view automatically
    if (!this.excludedPaths.some(p => path.startsWith(p))) {
      this.log({
        interaction_type: InteractionType.PAGE_VIEW,
        component: 'Page',
        page: path,
        action: 'view',
      });
    }
  }

  /**
   * Log an interaction
   */
  public log(interaction: Partial<InteractionLog> & { interaction_type: InteractionType; component: string; action: string; }): void {
    if (!this.isLoggingEnabled) return;

    // Skip logging for excluded paths
    if (this.excludedPaths.some(p => this.currentPage.startsWith(p))) return;

    // Update user info before logging
    this.updateUserInfo();

    // Sanitize any sensitive data
    const sanitizedDetails = interaction.details 
      ? this.sanitizeSensitiveData(interaction.details)
      : undefined;

    const log: InteractionLog = {
      timestamp: new Date().toISOString(),
      user_id: this.userId,
      user_role: this.userRole,
      session_id: this.sessionId,
      page: interaction.page || this.currentPage,
      ...interaction,
      details: sanitizedDetails,
      metadata: {
        ...this.getBrowserMetadata(),
        ...interaction.metadata
      }
    };

    // Add to queue
    this.logsQueue.push(log);

    // Flush if queue is full
    if (this.logsQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Log a button click event
   */
  public logButtonClick(component: string, buttonName: string, additionalInfo?: any, page?: string): void {
    this.log({
      interaction_type: InteractionType.BUTTON_CLICK,
      component,
      action: 'click',
      target: buttonName,
      details: additionalInfo,
      page: page || this.currentPage
    });
  }

  /**
   * Log a form submission
   */
  public logFormSubmit(formName: string, formData: any, page?: string): void {
    const sanitizedData = this.sanitizeSensitiveData(formData);
    
    this.log({
      interaction_type: InteractionType.FORM_SUBMIT,
      component: 'Form',
      action: 'submit',
      target: formName,
      details: sanitizedData,
      page: page || this.currentPage
    });
  }

  /**
   * Log a modal interaction
   */
  public logModalInteraction(modalName: string, action: 'open' | 'close', details?: any, page?: string): void {
    this.log({
      interaction_type: action === 'open' ? InteractionType.MODAL_OPEN : InteractionType.MODAL_CLOSE,
      component: 'Modal',
      action,
      target: modalName,
      details,
      page: page || this.currentPage
    });
  }

  /**
   * Log an error
   */
  public logError(component: string, error: Error, context?: any, page?: string): void {
    this.log({
      interaction_type: InteractionType.ERROR,
      component,
      action: 'error',
      target: error.name,
      details: {
        message: error.message,
        stack: error.stack,
        context
      },
      page: page || this.currentPage
    });
  }

  /**
   * Log an API request
   */
  public logApiRequest(endpoint: string, method: string, requestData?: any, page?: string): void {
    const sanitizedData = requestData ? this.sanitizeSensitiveData(requestData) : undefined;
    
    this.log({
      interaction_type: InteractionType.API_REQUEST,
      component: 'API',
      action: method,
      target: endpoint,
      details: sanitizedData,
      page: page || this.currentPage
    });
  }

  /**
   * Log an API response
   */
  public logApiResponse(endpoint: string, method: string, status: number, responseData?: any, page?: string): void {
    this.log({
      interaction_type: InteractionType.API_RESPONSE,
      component: 'API',
      action: `${method}-response`,
      target: endpoint,
      details: {
        status,
        data: responseData ? JSON.stringify(responseData).substring(0, 500) : undefined
      },
      page: page || this.currentPage,
      metadata: {
        success: status >= 200 && status < 300,
        response_size_bytes: responseData ? JSON.stringify(responseData).length : 0
      }
    });
  }

  /**
   * Sanitize sensitive data
   */
  private sanitizeSensitiveData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      // Sanitize known sensitive fields
      for (const field of this.sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '***REDACTED***';
        }
      }
      
      // Recursively sanitize nested objects
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Get browser metadata
   */
  private getBrowserMetadata() {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      user_agent: navigator.userAgent,
      window_size: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ip_address: '127.0.0.1' // This would normally be captured server-side
    };
  }

  /**
   * Flush logs to storage
   */
  public async flush(): Promise<void> {
    if (this.logsQueue.length === 0) return;

    try {
      // Clone and clear the queue before sending
      const logsToSend = [...this.logsQueue];
      this.logsQueue = [];
      
      // Store logs using the database service
      for (const log of logsToSend) {
        await database.from('interaction_logs').insert([log]);
      }
      
      console.debug(`[RBAC Logger] Flushed ${logsToSend.length} logs`);
    } catch (error) {
      console.error('[RBAC Logger] Error flushing logs:', error);
      // Put logs back in the queue if they failed to send
      this.logsQueue = [...this.logsQueue, ...this.logsQueue];
      
      // Limit queue size to avoid memory issues
      if (this.logsQueue.length > 100) {
        this.logsQueue = this.logsQueue.slice(-100);
      }
    }
  }

  /**
   * Enable or disable logging
   */
  public setLoggingEnabled(enabled: boolean): void {
    this.isLoggingEnabled = enabled;
    if (enabled && !this.flushInterval && typeof window !== 'undefined') {
      this.initializeFlushInterval();
    } else if (!enabled && this.flushInterval && typeof window !== 'undefined') {
      window.clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Get logs for the current session
   */
  public async getSessionLogs(): Promise<InteractionLog[]> {
    try {
      // Flush any pending logs first
      await this.flush();
      
      // Retrieve logs for the current session
      const result = await database.from('interaction_logs')
        .select('*')
        .eq('session_id', this.sessionId)
        .limit(1000);
        
      const data = result.data || [];
      const error = result.error;
        
      if (error) throw error;
      
      // Sort manually as the database mock doesn't support .order()
      return [...data].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('[RBAC Logger] Error retrieving session logs:', error);
      return [];
    }
  }

  /**
   * Get logs for a specific user
   */
  public async getUserLogs(userId: string): Promise<InteractionLog[]> {
    try {
      // Retrieve logs for the specified user
      const result = await database.from('interaction_logs')
        .select('*')
        .eq('user_id', userId)
        .limit(1000);
      
      const data = result.data || [];
      const error = result.error;
        
      if (error) throw error;
      
      // Sort manually as the database mock doesn't support .order()
      return [...data].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('[RBAC Logger] Error retrieving user logs:', error);
      return [];
    }
  }

  /**
   * Get logs for a specific role
   */
  public async getRoleLogs(role: string): Promise<InteractionLog[]> {
    try {
      // Retrieve logs for the specified role
      const result = await database.from('interaction_logs')
        .select('*')
        .eq('user_role', role)
        .limit(1000);
      
      const data = result.data || [];
      const error = result.error;
        
      if (error) throw error;
      
      // Sort manually as the database mock doesn't support .order()
      return [...data].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('[RBAC Logger] Error retrieving role logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const rbacLoggingService = new RBACLoggingService();

// Initialize the database schema
export function initializeRBACLoggingSchema(): void {
  // This would normally create the necessary database tables
  // For this demo, we're using the in-memory database
  console.info('[RBAC Logger] Schema initialized');
}

export default rbacLoggingService;
