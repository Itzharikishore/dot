const nodemailer = require('nodemailer');

/**
 * Email Service Utility
 * Professional email service for sending transactional emails
 * Supports multiple email providers (Gmail, SendGrid, AWS SES, etc.)
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  /**
   * Initialize email transporter based on environment configuration
   */
  init() {
    try {
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // Only initialize if credentials are provided
      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.isConfigured = true;
        console.log('✅ Email service configured successfully');
      } else {
        console.warn('⚠️  Email service not configured - SMTP credentials missing');
        console.warn('   Set SMTP_USER and SMTP_PASS in .env to enable email sending');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (optional)
   * @returns {Promise<Object>} - Send result
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured) {
      console.warn('⚠️  Email service not configured - email not sent');
      return {
        success: false,
        message: 'Email service not configured',
        preview: { to, subject, html: html.substring(0, 100) + '...' }
      };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'DOT Therapy'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', {
        to,
        subject,
        messageId: info.messageId
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} - Send result
   */
  async sendPasswordResetEmail(user, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrlExpiry = process.env.PASSWORD_RESET_EXPIRY || '10 minutes';
    
    // Flutter Deep Link (for mobile apps)
    const deepLink = `dottherapy://reset-password?token=${resetToken}`;
    
    // Web URL (fallback for web/email clients)
    const webUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    
    // Universal link (works on both mobile and web)
    // Mobile apps can intercept this, web browsers will open the web URL
    const universalLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">DOT Therapy</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          
          <p>Hello ${user.firstName || 'User'},</p>
          
          <p>We received a request to reset your password for your DOT Therapy account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${universalLink}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p><strong>For Mobile App Users:</strong></p>
          <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; font-family: monospace;">
            ${deepLink}
          </p>
          
          <p><strong>For Web Browser:</strong></p>
          <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
            ${webUrl}
          </p>
          
          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            <strong>Note:</strong> If you're using the mobile app, tap the deep link above. 
            If you're on a computer, use the web link.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> This link will expire in ${resetUrlExpiry}. 
            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated email. Please do not reply to this message.
            <br>
            © ${new Date().getFullYear()} DOT Therapy. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
      DOT Therapy - Password Reset Request
      
      Hello ${user.firstName || 'User'},
      
      We received a request to reset your password for your DOT Therapy account.
      
      Mobile App (Deep Link):
      ${deepLink}
      
      Web Browser:
      ${webUrl}
      
      This link will expire in ${resetUrlExpiry}.
      
      If you didn't request this password reset, please ignore this email.
      
      © ${new Date().getFullYear()} DOT Therapy. All rights reserved.
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - DOT Therapy',
      html,
      text
    });
  }

  /**
   * Convert HTML to plain text (simple version)
   * @param {string} html - HTML content
   * @returns {string} - Plain text
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Verify email service configuration
   * @returns {boolean} - True if configured
   */
  isEmailConfigured() {
    return this.isConfigured;
  }
}

// Export singleton instance
module.exports = new EmailService();

