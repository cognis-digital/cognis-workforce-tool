import { SubscriptionTier } from './subscriptionTiers';

export interface EmailTemplateData {
  userName: string;
  userEmail?: string;
  subscriptionTier?: SubscriptionTier;
  expirationDate?: string;
  daysLeft?: number;
  renewalDate?: string;
  amount?: number;
  featureName?: string;
  usagePercentage?: number;
  usageValue?: number;
  usageLimit?: number;
  paymentMethod?: 'stripe' | 'wallet' | string;
  customerSupportEmail?: string;
  companyName?: string;
  [key: string]: any;
}

export interface EmailTemplate {
  subject: string;
  bodyHTML: string;
  bodyText: string;
}

export type NotificationTemplateType = 
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_canceled'
  | 'subscription_expiring_soon'
  | 'subscription_expired'
  | 'payment_successful'
  | 'payment_failed'
  | 'usage_limit_approaching'
  | 'usage_limit_reached'
  | 'welcome_email'
  | 'feature_access_denied';

export class EmailTemplateGenerator {
  // Default values to use when not provided in data
  private defaults = {
    companyName: 'Cognis Workforce',
    customerSupportEmail: 'support@cognis.digital',
    actionBaseUrl: 'https://app.cognis.digital'
  };

  // Generate template based on notification type
  generateTemplate(
    type: NotificationTemplateType,
    data: EmailTemplateData
  ): EmailTemplate {
    // Merge defaults with provided data
    const templateData = { ...this.defaults, ...data };

    switch (type) {
      case 'subscription_created':
        return this.subscriptionCreatedTemplate(templateData);
      case 'subscription_updated':
        return this.subscriptionUpdatedTemplate(templateData);
      case 'subscription_canceled':
        return this.subscriptionCanceledTemplate(templateData);
      case 'subscription_expiring_soon':
        return this.subscriptionExpiringSoonTemplate(templateData);
      case 'subscription_expired':
        return this.subscriptionExpiredTemplate(templateData);
      case 'payment_successful':
        return this.paymentSuccessfulTemplate(templateData);
      case 'payment_failed':
        return this.paymentFailedTemplate(templateData);
      case 'usage_limit_approaching':
        return this.usageLimitApproachingTemplate(templateData);
      case 'usage_limit_reached':
        return this.usageLimitReachedTemplate(templateData);
      case 'welcome_email':
        return this.welcomeEmailTemplate(templateData);
      case 'feature_access_denied':
        return this.featureAccessDeniedTemplate(templateData);
      default:
        return this.defaultTemplate(templateData);
    }
  }

  private subscriptionCreatedTemplate(data: EmailTemplateData): EmailTemplate {
    const planName = this.getTierName(data.subscriptionTier);
    return {
      subject: `${data.companyName}: Your ${planName} Subscription Has Been Activated`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${planName}!</h2>
          <p>Hello ${data.userName},</p>
          <p>Your subscription to the ${planName} plan has been successfully activated. You now have access to all the premium features included in this plan.</p>
          <p><strong>Subscription details:</strong></p>
          <ul>
            <li>Plan: ${planName}</li>
            <li>Billing cycle: Monthly</li>
            <li>Amount: $${data.amount?.toFixed(2) || '0.00'}</li>
            <li>Next billing date: ${data.renewalDate || 'N/A'}</li>
          </ul>
          <p>You can manage your subscription settings anytime from your account dashboard.</p>
          <p><a href="${data.actionBaseUrl}/subscription" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Subscription</a></p>
          <p>Thank you for choosing ${data.companyName}!</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Welcome to ${planName}!

Hello ${data.userName},

Your subscription to the ${planName} plan has been successfully activated. You now have access to all the premium features included in this plan.

Subscription details:
- Plan: ${planName}
- Billing cycle: Monthly
- Amount: $${data.amount?.toFixed(2) || '0.00'}
- Next billing date: ${data.renewalDate || 'N/A'}

You can manage your subscription settings anytime from your account dashboard at: ${data.actionBaseUrl}/subscription

Thank you for choosing ${data.companyName}!

Best regards,
The ${data.companyName} Team`
    };
  }

  private subscriptionUpdatedTemplate(data: EmailTemplateData): EmailTemplate {
    const planName = this.getTierName(data.subscriptionTier);
    return {
      subject: `${data.companyName}: Your Subscription Has Been Updated`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Updated</h2>
          <p>Hello ${data.userName},</p>
          <p>Your subscription has been successfully updated to the ${planName} plan. Your new plan benefits are now active.</p>
          <p><strong>Updated subscription details:</strong></p>
          <ul>
            <li>New Plan: ${planName}</li>
            <li>Billing cycle: Monthly</li>
            <li>New amount: $${data.amount?.toFixed(2) || '0.00'}</li>
            <li>Next billing date: ${data.renewalDate || 'N/A'}</li>
          </ul>
          <p><a href="${data.actionBaseUrl}/subscription" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Subscription Details</a></p>
          <p>If you have any questions about your updated subscription, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Thank you for your continued support!</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Subscription Updated

Hello ${data.userName},

Your subscription has been successfully updated to the ${planName} plan. Your new plan benefits are now active.

Updated subscription details:
- New Plan: ${planName}
- Billing cycle: Monthly
- New amount: $${data.amount?.toFixed(2) || '0.00'}
- Next billing date: ${data.renewalDate || 'N/A'}

You can view your subscription details at: ${data.actionBaseUrl}/subscription

If you have any questions about your updated subscription, please contact our support team at ${data.customerSupportEmail}.

Thank you for your continued support!

Best regards,
The ${data.companyName} Team`
    };
  }

  private subscriptionCanceledTemplate(data: EmailTemplateData): EmailTemplate {
    return {
      subject: `${data.companyName}: Your Subscription Has Been Canceled`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Canceled</h2>
          <p>Hello ${data.userName},</p>
          <p>We're sorry to see you go. Your subscription has been canceled as requested.</p>
          <p>You'll continue to have access to your current subscription benefits until the end of your billing period on ${data.expirationDate || 'your expiration date'}.</p>
          <p>If you change your mind, you can reactivate your subscription anytime before it expires.</p>
          <p><a href="${data.actionBaseUrl}/subscription" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reactivate Subscription</a></p>
          <p>We value your feedback. If there's anything we could have done better, please let us know by replying to this email.</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Subscription Canceled

Hello ${data.userName},

We're sorry to see you go. Your subscription has been canceled as requested.

You'll continue to have access to your current subscription benefits until the end of your billing period on ${data.expirationDate || 'your expiration date'}.

If you change your mind, you can reactivate your subscription anytime before it expires at: ${data.actionBaseUrl}/subscription

We value your feedback. If there's anything we could have done better, please let us know by replying to this email.

Best regards,
The ${data.companyName} Team`
    };
  }

  private subscriptionExpiringSoonTemplate(data: EmailTemplateData): EmailTemplate {
    const planName = this.getTierName(data.subscriptionTier);
    return {
      subject: `${data.companyName}: Your ${planName} Subscription is Expiring Soon`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Expiring Soon</h2>
          <p>Hello ${data.userName},</p>
          <p>This is a reminder that your ${planName} subscription will expire in ${data.daysLeft} days on ${data.expirationDate}.</p>
          <p>To maintain uninterrupted access to your premium features, please renew your subscription before it expires.</p>
          <p><a href="${data.actionBaseUrl}/subscription" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Now</a></p>
          <p>If you have automatic renewal enabled, no action is required and your subscription will be automatically renewed on the expiration date.</p>
          <p>If you have any questions, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Thank you for your continued support!</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Subscription Expiring Soon

Hello ${data.userName},

This is a reminder that your ${planName} subscription will expire in ${data.daysLeft} days on ${data.expirationDate}.

To maintain uninterrupted access to your premium features, please renew your subscription before it expires.

Renew now at: ${data.actionBaseUrl}/subscription

If you have automatic renewal enabled, no action is required and your subscription will be automatically renewed on the expiration date.

If you have any questions, please contact our support team at ${data.customerSupportEmail}.

Thank you for your continued support!

Best regards,
The ${data.companyName} Team`
    };
  }

  private subscriptionExpiredTemplate(data: EmailTemplateData): EmailTemplate {
    const planName = this.getTierName(data.subscriptionTier);
    return {
      subject: `${data.companyName}: Your ${planName} Subscription Has Expired`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Subscription Expired</h2>
          <p>Hello ${data.userName},</p>
          <p>Your ${planName} subscription has expired. As a result, your account has been downgraded to the free tier with limited access to features.</p>
          <p>To regain access to all premium features, please renew your subscription.</p>
          <p><a href="${data.actionBaseUrl}/pricing" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Subscription</a></p>
          <p>If you have any questions or need assistance, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Thank you for being a part of ${data.companyName}!</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Subscription Expired

Hello ${data.userName},

Your ${planName} subscription has expired. As a result, your account has been downgraded to the free tier with limited access to features.

To regain access to all premium features, please renew your subscription.

Renew now at: ${data.actionBaseUrl}/pricing

If you have any questions or need assistance, please contact our support team at ${data.customerSupportEmail}.

Thank you for being a part of ${data.companyName}!

Best regards,
The ${data.companyName} Team`
    };
  }

  private paymentSuccessfulTemplate(data: EmailTemplateData): EmailTemplate {
    const planName = this.getTierName(data.subscriptionTier);
    return {
      subject: `${data.companyName}: Payment Successful`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Successful</h2>
          <p>Hello ${data.userName},</p>
          <p>We're writing to confirm that your payment of $${data.amount?.toFixed(2) || '0.00'} for your ${planName} subscription was successful.</p>
          <p><strong>Payment details:</strong></p>
          <ul>
            <li>Plan: ${planName}</li>
            <li>Amount: $${data.amount?.toFixed(2) || '0.00'}</li>
            <li>Payment method: ${this.formatPaymentMethod(data.paymentMethod)}</li>
            <li>Date: ${new Date().toLocaleDateString()}</li>
            <li>Next billing date: ${data.renewalDate || 'N/A'}</li>
          </ul>
          <p><a href="${data.actionBaseUrl}/subscription" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Billing History</a></p>
          <p>Thank you for your payment!</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Payment Successful

Hello ${data.userName},

We're writing to confirm that your payment of $${data.amount?.toFixed(2) || '0.00'} for your ${planName} subscription was successful.

Payment details:
- Plan: ${planName}
- Amount: $${data.amount?.toFixed(2) || '0.00'}
- Payment method: ${this.formatPaymentMethod(data.paymentMethod)}
- Date: ${new Date().toLocaleDateString()}
- Next billing date: ${data.renewalDate || 'N/A'}

You can view your billing history at: ${data.actionBaseUrl}/subscription

Thank you for your payment!

Best regards,
The ${data.companyName} Team`
    };
  }

  private paymentFailedTemplate(data: EmailTemplateData): EmailTemplate {
    const planName = this.getTierName(data.subscriptionTier);
    return {
      subject: `${data.companyName}: Payment Failed - Action Required`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Failed</h2>
          <p>Hello ${data.userName},</p>
          <p>We were unable to process your recent payment of $${data.amount?.toFixed(2) || '0.00'} for your ${planName} subscription.</p>
          <p>This could be due to insufficient funds, an expired card, or other payment issues.</p>
          <p>To ensure uninterrupted access to your premium features, please update your payment information as soon as possible.</p>
          <p><a href="${data.actionBaseUrl}/subscription" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Update Payment Method</a></p>
          <p>If you need assistance, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Thank you for your prompt attention to this matter.</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Payment Failed - Action Required

Hello ${data.userName},

We were unable to process your recent payment of $${data.amount?.toFixed(2) || '0.00'} for your ${planName} subscription.

This could be due to insufficient funds, an expired card, or other payment issues.

To ensure uninterrupted access to your premium features, please update your payment information as soon as possible at: ${data.actionBaseUrl}/subscription

If you need assistance, please contact our support team at ${data.customerSupportEmail}.

Thank you for your prompt attention to this matter.

Best regards,
The ${data.companyName} Team`
    };
  }

  private usageLimitApproachingTemplate(data: EmailTemplateData): EmailTemplate {
    return {
      subject: `${data.companyName}: You're Approaching Your ${data.featureName} Usage Limit`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Usage Limit Approaching</h2>
          <p>Hello ${data.userName},</p>
          <p>You've used <strong>${data.usagePercentage}%</strong> of your ${data.featureName} limit for this billing period (${data.usageValue} of ${data.usageLimit}).</p>
          <p>To avoid any interruption in service, consider upgrading your plan before you reach your limit.</p>
          <p><a href="${data.actionBaseUrl}/usage" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Usage Details</a> &nbsp; <a href="${data.actionBaseUrl}/pricing" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Upgrade Plan</a></p>
          <p>If you have any questions, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Usage Limit Approaching

Hello ${data.userName},

You've used ${data.usagePercentage}% of your ${data.featureName} limit for this billing period (${data.usageValue} of ${data.usageLimit}).

To avoid any interruption in service, consider upgrading your plan before you reach your limit.

View your usage details: ${data.actionBaseUrl}/usage
Upgrade your plan: ${data.actionBaseUrl}/pricing

If you have any questions, please contact our support team at ${data.customerSupportEmail}.

Best regards,
The ${data.companyName} Team`
    };
  }

  private usageLimitReachedTemplate(data: EmailTemplateData): EmailTemplate {
    return {
      subject: `${data.companyName}: You've Reached Your ${data.featureName} Usage Limit`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Usage Limit Reached</h2>
          <p>Hello ${data.userName},</p>
          <p>You've reached 100% of your ${data.featureName} limit for this billing period.</p>
          <p>To continue using this feature, you'll need to upgrade your plan or wait until your next billing cycle begins.</p>
          <p><a href="${data.actionBaseUrl}/pricing" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Upgrade Now</a> &nbsp; <a href="${data.actionBaseUrl}/usage" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Usage Details</a></p>
          <p>If you have any questions, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Usage Limit Reached

Hello ${data.userName},

You've reached 100% of your ${data.featureName} limit for this billing period.

To continue using this feature, you'll need to upgrade your plan or wait until your next billing cycle begins.

Upgrade now: ${data.actionBaseUrl}/pricing
View your usage details: ${data.actionBaseUrl}/usage

If you have any questions, please contact our support team at ${data.customerSupportEmail}.

Best regards,
The ${data.companyName} Team`
    };
  }

  private welcomeEmailTemplate(data: EmailTemplateData): EmailTemplate {
    return {
      subject: `Welcome to ${data.companyName}!`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${data.companyName}!</h2>
          <p>Hello ${data.userName},</p>
          <p>Thank you for joining ${data.companyName}! We're excited to have you on board.</p>
          <p>You now have access to our suite of AI-powered tools to enhance your workforce productivity:</p>
          <ul>
            <li>AI Agents for task automation</li>
            <li>Document processing and knowledge extraction</li>
            <li>Lead generation and prospecting</li>
            <li>AI image generation</li>
            <li>And much more!</li>
          </ul>
          <p><a href="${data.actionBaseUrl}/dashboard" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Explore Your Dashboard</a></p>
          <p>If you have any questions or need assistance, our support team is here to help at ${data.customerSupportEmail}.</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Welcome to ${data.companyName}!

Hello ${data.userName},

Thank you for joining ${data.companyName}! We're excited to have you on board.

You now have access to our suite of AI-powered tools to enhance your workforce productivity:
- AI Agents for task automation
- Document processing and knowledge extraction
- Lead generation and prospecting
- AI image generation
- And much more!

Explore your dashboard: ${data.actionBaseUrl}/dashboard

If you have any questions or need assistance, our support team is here to help at ${data.customerSupportEmail}.

Best regards,
The ${data.companyName} Team`
    };
  }

  private featureAccessDeniedTemplate(data: EmailTemplateData): EmailTemplate {
    return {
      subject: `${data.companyName}: Upgrade Required to Access ${data.featureName}`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Feature Access Denied</h2>
          <p>Hello ${data.userName},</p>
          <p>You recently attempted to access the ${data.featureName} feature, which is not available on your current plan.</p>
          <p>To unlock this feature and many more, please consider upgrading your subscription.</p>
          <p><a href="${data.actionBaseUrl}/pricing" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Pricing Plans</a></p>
          <p>If you have any questions about our subscription tiers or need help choosing the right plan, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Feature Access Denied

Hello ${data.userName},

You recently attempted to access the ${data.featureName} feature, which is not available on your current plan.

To unlock this feature and many more, please consider upgrading your subscription.

View pricing plans: ${data.actionBaseUrl}/pricing

If you have any questions about our subscription tiers or need help choosing the right plan, please contact our support team at ${data.customerSupportEmail}.

Best regards,
The ${data.companyName} Team`
    };
  }

  private defaultTemplate(data: EmailTemplateData): EmailTemplate {
    return {
      subject: `${data.companyName}: Important Account Update`,
      bodyHTML: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Update</h2>
          <p>Hello ${data.userName},</p>
          <p>We have an important update regarding your account.</p>
          <p>Please log in to your account dashboard to view the details.</p>
          <p><a href="${data.actionBaseUrl}/dashboard" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Account</a></p>
          <p>If you have any questions, please contact our support team at ${data.customerSupportEmail}.</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </div>
      `,
      bodyText: `Account Update

Hello ${data.userName},

We have an important update regarding your account.

Please log in to your account dashboard to view the details: ${data.actionBaseUrl}/dashboard

If you have any questions, please contact our support team at ${data.customerSupportEmail}.

Best regards,
The ${data.companyName} Team`
    };
  }

  // Helper methods
  private getTierName(tier?: SubscriptionTier): string {
    switch (tier) {
      case 'basic': return 'Basic';
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      case 'free':
      default: return 'Free';
    }
  }

  private formatPaymentMethod(method?: string): string {
    if (!method) return 'Credit Card';
    
    switch (method.toLowerCase()) {
      case 'stripe': return 'Credit Card';
      case 'wallet': return 'Crypto Wallet';
      default: return method;
    }
  }
}

export const emailTemplateGenerator = new EmailTemplateGenerator();
