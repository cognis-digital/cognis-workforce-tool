import { database } from './database';
import { subscriptionRenewalService } from './subscriptionRenewalService';
import { notificationService } from './notificationService';
import { usageTrackingService } from './usageTrackingService';

export type ScheduledJobType = 
  | 'check_subscription_expiration'
  | 'check_usage_limits'
  | 'process_renewals'
  | 'reset_usage_metrics'
  | 'send_scheduled_reports'
  | 'data_backup';

export interface ScheduledJobResult {
  success: boolean;
  message: string;
  processedItems?: number;
  error?: string;
  metadata?: Record<string, any>;
}

class ScheduledJobService {
  // Run on application startup to setup jobs
  async initializeScheduledJobs(): Promise<void> {
    // In a production environment, this would use a cron library
    // or a serverless function triggered by a scheduler
    
    // For demonstration, we'll just log that initialization was successful
    console.log('Scheduled job service initialized');
    
    // Set up interval for checking subscription expirations
    // In a real app, these would be cloud functions or serverless crons
    this.setupPeriodicChecks();
  }
  
  // Set up recurring checks at appropriate intervals
  private setupPeriodicChecks(): void {
    // Daily checks for subscription expirations (every 24 hours)
    // In a real app, this would be a daily cron job
    setInterval(async () => {
      await this.runJob('check_subscription_expiration');
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Usage limit checks (every 6 hours)
    setInterval(async () => {
      await this.runJob('check_usage_limits');
    }, 6 * 60 * 60 * 1000); // 6 hours
    
    // Auto-renewal processing (every 12 hours)
    setInterval(async () => {
      await this.runJob('process_renewals');
    }, 12 * 60 * 60 * 1000); // 12 hours
    
    // Reset usage metrics on the 1st of each month
    // This requires a more sophisticated approach in production
    setInterval(async () => {
      const now = new Date();
      if (now.getDate() === 1) { // 1st of the month
        await this.runJob('reset_usage_metrics');
      }
    }, 24 * 60 * 60 * 1000); // Check daily
  }
  
  // Run a specific scheduled job
  async runJob(jobType: ScheduledJobType, params: Record<string, any> = {}): Promise<ScheduledJobResult> {
    try {
      // Log job start
      console.log(`Running scheduled job: ${jobType} at ${new Date().toISOString()}`);
      
      // Record job start in database
      const { data: jobRecord, error: jobCreateError } = await database
        .from('scheduled_job_runs')
        .insert([{
          job_type: jobType,
          status: 'running',
          started_at: new Date().toISOString(),
          parameters: params
        }])
        .select()
        .single();
      
      if (jobCreateError) {
        throw new Error(`Failed to record job start: ${jobCreateError.message}`);
      }
      
      // Execute the job based on type
      let result: ScheduledJobResult;
      
      switch (jobType) {
        case 'check_subscription_expiration':
          result = await this.checkSubscriptionExpirations();
          break;
        case 'check_usage_limits':
          result = await this.checkUsageLimits();
          break;
        case 'process_renewals':
          result = await this.processRenewals();
          break;
        case 'reset_usage_metrics':
          result = await this.resetUsageMetrics();
          break;
        case 'send_scheduled_reports':
          result = await this.sendScheduledReports(params);
          break;
        case 'data_backup':
          result = await this.performDataBackup();
          break;
        default:
          result = {
            success: false,
            message: `Unknown job type: ${jobType}`
          };
      }
      
      // Update job record with result
      if (jobRecord) {
        await database
          .from('scheduled_job_runs')
          .update({
            status: result.success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            result: result
          })
          .eq('id', jobRecord.id);
      }
      
      // Log job completion
      console.log(`Completed scheduled job: ${jobType} - Success: ${result.success}`);
      
      return result;
    } catch (error: any) {
      // Log error and update job status
      console.error(`Error in scheduled job ${jobType}:`, error);
      
      return {
        success: false,
        message: `Job failed with error`,
        error: error.message
      };
    }
  }
  
  // Job implementations
  private async checkSubscriptionExpirations(): Promise<ScheduledJobResult> {
    try {
      // This calls the subscription renewal service to check for expirations
      await subscriptionRenewalService.checkForRenewals();
      
      return {
        success: true,
        message: 'Successfully checked subscription expirations'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to check subscription expirations',
        error: error.message
      };
    }
  }
  
  private async checkUsageLimits(): Promise<ScheduledJobResult> {
    try {
      // Get users to check
      const { data: users, error } = await database
        .from('user_profiles')
        .select('user_id')
        .not('tier', 'eq', 'free'); // Only check paid tiers
        
      if (error) throw error;
      
      if (!users || users.length === 0) {
        return {
          success: true,
          message: 'No users to check for usage limits',
          processedItems: 0
        };
      }
      
      // Process each user
      let processedCount = 0;
      let notifiedCount = 0;
      
      for (const user of users) {
        try {
          // This will check usage and send notifications if needed
          await notificationService.scheduleUsageLimitChecks(user.user_id);
          processedCount++;
          
          // Track usage metrics for notification system
          const usageMetrics = await usageTrackingService.getUserUsageMetrics(user.user_id);
          
          // Check if any metric is above threshold
          const highUsageMetrics = Object.entries(usageMetrics).filter(([key, value]) => {
            const limit = usageTrackingService.getLimitForMetric(key as keyof typeof usageMetrics, user.tier);
            return limit && value / limit > 0.8; // 80% or more used
          });
          
          if (highUsageMetrics.length > 0) {
            notifiedCount += highUsageMetrics.length;
          }
        } catch (userError) {
          console.error(`Error checking usage for user ${user.user_id}:`, userError);
          // Continue with next user
        }
      }
      
      return {
        success: true,
        message: `Checked usage limits for ${processedCount} users`,
        processedItems: processedCount,
        metadata: {
          notifiedCount
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to check usage limits',
        error: error.message
      };
    }
  }
  
  private async processRenewals(): Promise<ScheduledJobResult> {
    try {
      // This job checks for subscriptions that need to be auto-renewed
      // and processes the renewals
      
      // Get users with auto-renewal enabled and subscription ending soon
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: renewals, error } = await database
        .from('subscription_settings')
        .select('user_id, payment_method')
        .eq('auto_renew', true)
        .join('user_profiles', 'user_profiles.user_id', 'subscription_settings.user_id')
        .lt('user_profiles.subscription_ends_at', tomorrow.toISOString())
        .gt('user_profiles.subscription_ends_at', now.toISOString());
      
      if (error) throw error;
      
      if (!renewals || renewals.length === 0) {
        return {
          success: true,
          message: 'No subscriptions to renew',
          processedItems: 0
        };
      }
      
      // Process each renewal
      let successCount = 0;
      let failureCount = 0;
      
      for (const renewal of renewals) {
        try {
          // Process renewal using the configured payment method
          const result = await subscriptionRenewalService.processRenewal(
            renewal.user_id,
            renewal.payment_method
          );
          
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (renewalError) {
          console.error(`Error renewing subscription for user ${renewal.user_id}:`, renewalError);
          failureCount++;
        }
      }
      
      return {
        success: true,
        message: `Processed ${successCount + failureCount} renewal(s): ${successCount} successful, ${failureCount} failed`,
        processedItems: successCount + failureCount,
        metadata: {
          successCount,
          failureCount
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to process subscription renewals',
        error: error.message
      };
    }
  }
  
  private async resetUsageMetrics(): Promise<ScheduledJobResult> {
    try {
      // Reset usage metrics for all users at the beginning of their billing cycle
      const now = new Date();
      
      // Get users whose billing cycle resets today
      const { data: users, error } = await database
        .from('user_profiles')
        .select('user_id')
        .contains('billing_cycle_reset_dates', [now.getDate().toString()]);
      
      if (error) throw error;
      
      if (!users || users.length === 0) {
        return {
          success: true,
          message: 'No users need usage metrics reset today',
          processedItems: 0
        };
      }
      
      // Reset metrics for each user
      let resetCount = 0;
      
      for (const user of users) {
        try {
          await usageTrackingService.resetUsageCounters(user.user_id);
          resetCount++;
        } catch (resetError) {
          console.error(`Error resetting usage for user ${user.user_id}:`, resetError);
        }
      }
      
      return {
        success: true,
        message: `Reset usage metrics for ${resetCount} users`,
        processedItems: resetCount
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to reset usage metrics',
        error: error.message
      };
    }
  }
  
  private async sendScheduledReports(params: Record<string, any>): Promise<ScheduledJobResult> {
    // This would generate and send scheduled reports
    // Not implemented for this demo
    return {
      success: true,
      message: 'Scheduled reports job placeholder',
      processedItems: 0
    };
  }
  
  private async performDataBackup(): Promise<ScheduledJobResult> {
    // This would perform data backups
    // Not implemented for this demo
    return {
      success: true,
      message: 'Data backup job placeholder',
      processedItems: 0
    };
  }
  
  // Manually trigger a job run (for testing or admin purposes)
  async triggerJobManually(
    jobType: ScheduledJobType, 
    params: Record<string, any> = {}
  ): Promise<ScheduledJobResult> {
    return this.runJob(jobType, { ...params, triggered_manually: true });
  }
  
  // Get recent job runs (for admin dashboard)
  async getRecentJobRuns(
    limit: number = 10
  ): Promise<Array<Record<string, any>>> {
    try {
      const { data, error } = await database
        .from('scheduled_job_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching recent job runs:', error);
      return [];
    }
  }
}

export const scheduledJobService = new ScheduledJobService();
