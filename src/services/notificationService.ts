import { database } from './database';
import { useUserProfile } from '../store/authStore';
import { useNotificationActions } from '../store/appStore';
import { UsageMetrics } from './usageTrackingService';

export type NotificationType = 
  | 'usage_limit_approaching'
  | 'usage_limit_reached'
  | 'subscription_expiring_soon'
  | 'subscription_expired'
  | 'payment_successful'
  | 'payment_failed'
  | 'feature_access_denied';

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  pushNotifications: boolean;
  usageLimitAlerts: boolean;
  subscriptionReminders: boolean;
  paymentAlerts: boolean;
  marketingEmails: boolean;
}

export interface EmailTemplate {
  subject: string;
  bodyHTML: string;
  bodyText: string;
}

class NotificationService {
  private defaultPreferences: NotificationPreferences = {
    email: true,
    inApp: true,
    pushNotifications: false,
    usageLimitAlerts: true,
    subscriptionReminders: true,
    paymentAlerts: true,
    marketingEmails: false
  };
  
  // Get user notification preferences
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Fetch user preferences from the database
      const { data, error } = await database
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error || !data) {
        console.log('No notification preferences found, using defaults');
        return this.defaultPreferences;
      }
      
      return {
        email: data.email_enabled ?? this.defaultPreferences.email,
        inApp: data.in_app_enabled ?? this.defaultPreferences.inApp,
        pushNotifications: data.push_enabled ?? this.defaultPreferences.pushNotifications,
        usageLimitAlerts: data.usage_limit_alerts ?? this.defaultPreferences.usageLimitAlerts,
        subscriptionReminders: data.subscription_reminders ?? this.defaultPreferences.subscriptionReminders,
        paymentAlerts: data.payment_alerts ?? this.defaultPreferences.paymentAlerts,
        marketingEmails: data.marketing_emails ?? this.defaultPreferences.marketingEmails
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return this.defaultPreferences;
    }
  }
  
  // Update user notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      // Check if preferences already exist
      const { data: existingData } = await database
        .from('notification_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      const mappedPreferences = {
        email_enabled: preferences.email,
        in_app_enabled: preferences.inApp,
        push_enabled: preferences.pushNotifications,
        usage_limit_alerts: preferences.usageLimitAlerts,
        subscription_reminders: preferences.subscriptionReminders,
        payment_alerts: preferences.paymentAlerts,
        marketing_emails: preferences.marketingEmails
      };
      
      if (existingData) {
        // Update existing preferences
        const { error } = await database
          .from('notification_preferences')
          .update(mappedPreferences)
          .eq('id', existingData.id);
          
        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await database
          .from('notification_preferences')
          .insert([{ user_id: userId, ...mappedPreferences }]);
          
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }
  
  // Send an email notification
  async sendEmailNotification(
    userId: string,
    type: NotificationType,
    data: any = {}
  ): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return false;
      
      const preferences = await this.getUserNotificationPreferences(userId);
      
      // Check if user has enabled email notifications for this type
      if (!preferences.email || 
         (type.includes('usage_limit') && !preferences.usageLimitAlerts) ||
         (type.includes('subscription') && !preferences.subscriptionReminders) ||
         (type.includes('payment') && !preferences.paymentAlerts)) {
        return false;
      }
      
      // Generate the email content
      const emailTemplate = this.generateEmailTemplate(type, {
        userName: userProfile.display_name,
        email: userProfile.email,
        ...data
      });
      
      // In a real implementation, this would call an email service provider
      // For now, we'll simulate sending an email with a console log
      console.log(`Sending ${type} email to ${userProfile.email}`);
      console.log(`Subject: ${emailTemplate.subject}`);
      console.log(`Body: ${emailTemplate.bodyText}`);
      
      // Record the notification in the database
      const { error } = await database
        .from('notifications')
        .insert([{
          user_id: userId,
          type,
          title: emailTemplate.subject,
          message: emailTemplate.bodyText,
          channel: 'email',
          status: 'sent',
          data: JSON.stringify(data)
        }]);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }
  
  // Send an in-app notification
  sendInAppNotification(
    userId: string,
    type: NotificationType,
    data: any = {}
  ): boolean {
    try {
      const notificationActions = useNotificationActions.getState();
      
      // Different notification configurations based on type
      switch (type) {
        case 'usage_limit_approaching':
          notificationActions.addNotification({
            type: 'warning',
            title: 'Usage Limit Approaching',
            message: `You're approaching your ${data.featureName} limit (${data.percentage}% used)`,
            action: 'View Usage',
            actionUrl: '/usage'
          });
          break;
          
        case 'usage_limit_reached':
          notificationActions.addNotification({
            type: 'error',
            title: 'Usage Limit Reached',
            message: `You've reached your ${data.featureName} limit for this billing period`,
            action: 'Upgrade',
            actionUrl: '/pricing'
          });
          break;
          
        case 'subscription_expiring_soon':
          notificationActions.addNotification({
            type: 'info',
            title: 'Subscription Expiring Soon',
            message: `Your subscription will expire in ${data.daysLeft} days`,
            action: 'Renew',
            actionUrl: '/settings'
          });
          break;
          
        case 'subscription_expired':
          notificationActions.addNotification({
            type: 'error',
            title: 'Subscription Expired',
            message: 'Your subscription has expired. Renew now to continue using premium features.',
            action: 'Renew',
            actionUrl: '/pricing'
          });
          break;
          
        case 'payment_successful':
          notificationActions.addNotification({
            type: 'success',
            title: 'Payment Successful',
            message: `Your payment of $${data.amount} was successful`,
            action: 'View Receipt',
            actionUrl: '/settings/billing'
          });
          break;
          
        case 'payment_failed':
          notificationActions.addNotification({
            type: 'error',
            title: 'Payment Failed',
            message: 'Your last payment attempt failed. Please update your payment method.',
            action: 'Update Payment',
            actionUrl: '/settings/billing'
          });
          break;
          
        case 'feature_access_denied':
          notificationActions.addNotification({
            type: 'warning',
            title: 'Feature Access Denied',
            message: `Access to ${data.featureName} is limited to ${data.requiredTier} plans and above`,
            action: 'Upgrade',
            actionUrl: '/pricing'
          });
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }
  
  // Schedule usage limit notification checks
  async scheduleUsageLimitChecks(userId: string): Promise<void> {
    // In a real implementation, this would set up a scheduled task
    // For now, we'll simulate by checking usage immediately
    
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return;
      
      const { data: usageData } = await database
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (!usageData) return;
      
      // Dynamically get usage limits based on subscription tier
      const limits = this.getUsageLimits(userProfile.tier);
      
      // Check each usage metric
      const metricsToCheck = [
        { key: 'ai_agents_count', name: 'AI Agents', limit: limits.aiAgents },
        { key: 'documents_uploaded', name: 'Document Uploads', limit: limits.documentsUploaded },
        { key: 'lead_searches', name: 'Lead Searches', limit: limits.leadSearches },
        { key: 'api_calls', name: 'API Calls', limit: limits.apiCalls },
        { key: 'storage_used', name: 'Storage', limit: limits.storage }
      ];
      
      for (const metric of metricsToCheck) {
        const usage = usageData[metric.key] || 0;
        const percentage = Math.round((usage / metric.limit) * 100);
        
        // Send notifications based on usage percentage
        if (percentage >= 90) {
          await this.sendEmailNotification(userId, 'usage_limit_reached', {
            featureName: metric.name,
            used: usage,
            limit: metric.limit,
            percentage
          });
          
          this.sendInAppNotification(userId, 'usage_limit_reached', {
            featureName: metric.name,
            used: usage,
            limit: metric.limit,
            percentage
          });
        } else if (percentage >= 80) {
          await this.sendEmailNotification(userId, 'usage_limit_approaching', {
            featureName: metric.name,
            used: usage,
            limit: metric.limit,
            percentage
          });
          
          this.sendInAppNotification(userId, 'usage_limit_approaching', {
            featureName: metric.name,
            used: usage,
            limit: metric.limit,
            percentage
          });
        }
      }
    } catch (error) {
      console.error('Error checking usage limits:', error);
    }
  }
  
  // Schedule subscription expiration checks
  async scheduleSubscriptionChecks(userId: string): Promise<void> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile || userProfile.tier === 'free') return;
      
      const subscriptionEndsAt = userProfile.subscription_ends_at 
        ? new Date(userProfile.subscription_ends_at)
        : null;
        
      if (!subscriptionEndsAt) return;
      
      const now = new Date();
      const daysUntilExpiration = Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send notification 7 days before expiration
      if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
        await this.sendEmailNotification(userId, 'subscription_expiring_soon', {
          daysLeft: daysUntilExpiration,
          expirationDate: subscriptionEndsAt.toLocaleDateString(),
          tier: userProfile.tier
        });
        
        this.sendInAppNotification(userId, 'subscription_expiring_soon', {
          daysLeft: daysUntilExpiration,
          expirationDate: subscriptionEndsAt.toLocaleDateString(),
          tier: userProfile.tier
        });
      }
      
      // Send notification when subscription has expired
      if (daysUntilExpiration <= 0) {
        await this.sendEmailNotification(userId, 'subscription_expired', {
          expirationDate: subscriptionEndsAt.toLocaleDateString(),
          tier: userProfile.tier
        });
        
        this.sendInAppNotification(userId, 'subscription_expired', {
          expirationDate: subscriptionEndsAt.toLocaleDateString(),
          tier: userProfile.tier
        });
      }
    } catch (error) {
      console.error('Error checking subscription expiration:', error);
    }
  }
  
  // Generate email templates based on notification type
  private generateEmailTemplate(type: NotificationType, data: any): EmailTemplate {
    let subject = '';
    let bodyHTML = '';
    let bodyText = '';
    
    switch (type) {
      case 'usage_limit_approaching':
        subject = `Cognis Workforce: You're approaching your ${data.featureName} limit`;
        bodyText = `Hello ${data.userName},\n\nYou've used ${data.percentage}% of your ${data.featureName} limit (${data.used}/${data.limit}). Consider upgrading your plan to avoid disruption.\n\nVisit your dashboard at https://app.cognis.digital/usage to view your usage details.\n\nThe Cognis Team`;
        bodyHTML = `<p>Hello ${data.userName},</p><p>You've used <strong>${data.percentage}%</strong> of your ${data.featureName} limit (${data.used}/${data.limit}). Consider upgrading your plan to avoid disruption.</p><p><a href="https://app.cognis.digital/usage">View your usage dashboard</a></p><p>The Cognis Team</p>`;
        break;
        
      case 'usage_limit_reached':
        subject = `Cognis Workforce: You've reached your ${data.featureName} limit`;
        bodyText = `Hello ${data.userName},\n\nYou've reached your ${data.featureName} limit for this billing period. Upgrade your plan to continue using this feature.\n\nVisit https://app.cognis.digital/pricing to upgrade your subscription.\n\nThe Cognis Team`;
        bodyHTML = `<p>Hello ${data.userName},</p><p>You've reached your ${data.featureName} limit for this billing period. Upgrade your plan to continue using this feature.</p><p><a href="https://app.cognis.digital/pricing">Upgrade your subscription</a></p><p>The Cognis Team</p>`;
        break;
        
      case 'subscription_expiring_soon':
        subject = `Cognis Workforce: Your subscription expires in ${data.daysLeft} days`;
        bodyText = `Hello ${data.userName},\n\nYour ${data.tier} subscription will expire on ${data.expirationDate}. Renew now to maintain uninterrupted access to premium features.\n\nVisit https://app.cognis.digital/settings/billing to renew your subscription.\n\nThe Cognis Team`;
        bodyHTML = `<p>Hello ${data.userName},</p><p>Your ${data.tier} subscription will expire on ${data.expirationDate}. Renew now to maintain uninterrupted access to premium features.</p><p><a href="https://app.cognis.digital/settings/billing">Renew your subscription</a></p><p>The Cognis Team</p>`;
        break;
        
      case 'subscription_expired':
        subject = `Cognis Workforce: Your subscription has expired`;
        bodyText = `Hello ${data.userName},\n\nYour ${data.tier} subscription has expired. Renew now to regain access to premium features.\n\nVisit https://app.cognis.digital/pricing to choose a subscription plan.\n\nThe Cognis Team`;
        bodyHTML = `<p>Hello ${data.userName},</p><p>Your ${data.tier} subscription has expired. Renew now to regain access to premium features.</p><p><a href="https://app.cognis.digital/pricing">Choose a subscription plan</a></p><p>The Cognis Team</p>`;
        break;
        
      case 'payment_successful':
        subject = `Cognis Workforce: Payment Successful`;
        bodyText = `Hello ${data.userName},\n\nYour payment of $${data.amount} for the ${data.tier} plan was successful. Your subscription is active until ${data.nextBillingDate}.\n\nVisit https://app.cognis.digital/settings/billing to view your billing history.\n\nThe Cognis Team`;
        bodyHTML = `<p>Hello ${data.userName},</p><p>Your payment of $${data.amount} for the ${data.tier} plan was successful. Your subscription is active until ${data.nextBillingDate}.</p><p><a href="https://app.cognis.digital/settings/billing">View your billing history</a></p><p>The Cognis Team</p>`;
        break;
        
      case 'payment_failed':
        subject = `Cognis Workforce: Payment Failed`;
        bodyText = `Hello ${data.userName},\n\nYour recent payment attempt for the ${data.tier} plan failed. Please update your payment method to avoid service interruption.\n\nVisit https://app.cognis.digital/settings/billing to update your payment information.\n\nThe Cognis Team`;
        bodyHTML = `<p>Hello ${data.userName},</p><p>Your recent payment attempt for the ${data.tier} plan failed. Please update your payment method to avoid service interruption.</p><p><a href="https://app.cognis.digital/settings/billing">Update your payment information</a></p><p>The Cognis Team</p>`;
        break;
        
      case 'feature_access_denied':
        subject = `Cognis Workforce: Access to ${data.featureName} Denied`;
        bodyText = `Hello ${data.userName},\n\nYou attempted to access ${data.featureName}, which is only available on ${data.requiredTier} plans and above. Upgrade your subscription to unlock this feature.\n\nVisit https://app.cognis.digital/pricing to compare plans.\n\nThe Cognis Team`;
        bodyHTML = `<p>Hello ${data.userName},</p><p>You attempted to access ${data.featureName}, which is only available on ${data.requiredTier} plans and above. Upgrade your subscription to unlock this feature.</p><p><a href="https://app.cognis.digital/pricing">Compare plans</a></p><p>The Cognis Team</p>`;
        break;
    }
    
    return { subject, bodyHTML, bodyText };
  }
  
  // Helper function to get user profile
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await database
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
  
  // Helper function to get usage limits based on subscription tier
  private getUsageLimits(tier: string): Record<string, number> {
    switch (tier) {
      case 'basic':
        return {
          aiAgents: 3,
          documentsUploaded: 50,
          leadSearches: 100,
          apiCalls: 1000,
          storage: 1000 // 1GB
        };
      case 'pro':
        return {
          aiAgents: 10,
          documentsUploaded: 500,
          leadSearches: 500,
          apiCalls: 10000,
          storage: 10000 // 10GB
        };
      case 'enterprise':
        return {
          aiAgents: Infinity,
          documentsUploaded: Infinity,
          leadSearches: Infinity,
          apiCalls: Infinity,
          storage: 100000 // 100GB
        };
      case 'free':
      default:
        return {
          aiAgents: 1,
          documentsUploaded: 5,
          leadSearches: 10,
          apiCalls: 100,
          storage: 100 // 100MB
        };
    }
  }
}

export const notificationService = new NotificationService();
