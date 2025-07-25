import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

/**
 * Send auto-scheduling notification email to user
 */
export async function sendAutoSchedulingNotification(userId, notificationData) {
  try {
    // Initialize Supabase client inside function with service role key for backend operations
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Configure email transporter inside function
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.FEEDBACK_EMAIL_USER,
        pass: process.env.FEEDBACK_EMAIL_PASS,
      },
    });

    // Check if email configuration is available
    if (!process.env.FEEDBACK_EMAIL_USER || !process.env.FEEDBACK_EMAIL_PASS) {
      console.log('Email configuration not available, skipping email notification');
      // Still store in-app notification even if email fails
      await storeInAppNotification(userId, {
        type,
        title,
        message,
        details,
        read: false,
        created_at: new Date().toISOString()
      });
      return { success: true, email_skipped: true };
    }
    
    // Get user information from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // If user not found, use fallback values but still send notification
    let user;
    if (userError || !userData) {
      console.error('Error fetching user for notification:', userError);
      // Use fallback values instead of failing
      user = {
        email: process.env.FALLBACK_EMAIL || 'user@example.com',
        full_name: 'User'
      };
      console.log('Using fallback user values for notification');
    } else {
      user = userData;
    }

    const { type, title, message, details, scheduledTasks = [], failedTasks = [] } = notificationData;

    // Create email content based on notification type
    let emailSubject = '';
    let emailBody = '';

    switch (type) {
      case 'auto_scheduling_completed':
        emailSubject = '✅ Auto-Scheduling Completed';
        emailBody = createAutoSchedulingCompletedEmail(user.full_name, scheduledTasks, failedTasks);
        break;
      case 'auto_scheduling_error':
        emailSubject = '⚠️ Auto-Scheduling Issues Detected';
        emailBody = createAutoSchedulingErrorEmail(user.full_name, details, failedTasks);
        break;
      case 'weather_conflict':
        emailSubject = '🌦️ Weather Affected Task Scheduling';
        emailBody = createWeatherConflictEmail(user.full_name, details);
        break;
      case 'calendar_conflict':
        emailSubject = '📅 Calendar Conflicts Detected';
        emailBody = createCalendarConflictEmail(user.full_name, details);
        break;
      default:
        emailSubject = title || 'Auto-Scheduling Update';
        emailBody = createGenericNotificationEmail(user.full_name, message, details);
    }

    // Send email
    const mailOptions = {
      from: process.env.FEEDBACK_EMAIL_USER,
      to: user.email,
      subject: emailSubject,
      html: emailBody,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email notification sent to ${user.email}`);
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Continue with in-app notification even if email fails
    }

    // Store notification in database for in-app notifications
    await storeInAppNotification(userId, {
      type,
      title,
      message,
      details,
      read: false,
      created_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending auto-scheduling notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create email template for auto-scheduling completion
 */
function createAutoSchedulingCompletedEmail(userName, scheduledTasks, failedTasks) {
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Hello ${userName},</h2>
      <p>Your auto-scheduling has been completed successfully!</p>
  `;

  if (scheduledTasks.length > 0) {
    html += `
      <h3 style="color: #059669;">✅ Successfully Scheduled Tasks (${scheduledTasks.length})</h3>
      <ul style="list-style: none; padding: 0;">
    `;
    scheduledTasks.forEach(task => {
      const scheduledTime = new Date(task.scheduled_time).toLocaleString();
      html += `
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${task.task_title}</strong><br>
          <small style="color: #6b7280;">Scheduled for: ${scheduledTime}</small>
        </li>
      `;
    });
    html += '</ul>';
  }

  if (failedTasks.length > 0) {
    html += `
      <h3 style="color: #dc2626;">❌ Failed to Schedule (${failedTasks.length})</h3>
      <ul style="list-style: none; padding: 0;">
    `;
    failedTasks.forEach(task => {
      html += `
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${task.task_title}</strong><br>
          <small style="color: #6b7280;">Reason: ${task.reason}</small>
        </li>
      `;
    });
    html += '</ul>';
  }

  html += `
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Dashboard
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        You can review and adjust your auto-scheduling preferences anytime in your dashboard.
      </p>
    </div>
  `;

  return html;
}

/**
 * Create email template for auto-scheduling errors
 */
function createAutoSchedulingErrorEmail(userName, details, failedTasks) {
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Hello ${userName},</h2>
      <p>We encountered some issues while auto-scheduling your tasks:</p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; color: #dc2626;"><strong>${details}</strong></p>
      </div>
  `;

  if (failedTasks.length > 0) {
    html += `
      <h3 style="color: #dc2626;">Tasks That Couldn't Be Scheduled</h3>
      <ul style="list-style: none; padding: 0;">
    `;
    failedTasks.forEach(task => {
      html += `
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${task.task_title}</strong><br>
          <small style="color: #6b7280;">Reason: ${task.reason}</small>
        </li>
      `;
    });
    html += '</ul>';
  }

  html += `
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Review Tasks
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        You can manually schedule these tasks or adjust your preferences to resolve the issues.
      </p>
    </div>
  `;

  return html;
}

/**
 * Create email template for weather conflicts
 */
function createWeatherConflictEmail(userName, details) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Hello ${userName},</h2>
      <p>Weather conditions affected the scheduling of some of your outdoor tasks:</p>
      <div style="background-color: #fffbeb; border: 1px solid #fed7aa; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e;"><strong>${details}</strong></p>
      </div>
      <p>These tasks will be automatically rescheduled when weather conditions improve.</p>
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Dashboard
        </a>
      </p>
    </div>
  `;

  return html;
}

/**
 * Create email template for calendar conflicts
 */
function createCalendarConflictEmail(userName, details) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Hello ${userName},</h2>
      <p>Calendar conflicts were detected while scheduling your tasks:</p>
      <div style="background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; color: #374151;"><strong>${details}</strong></p>
      </div>
      <p>Some tasks were scheduled in alternative time slots to avoid conflicts.</p>
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Review Schedule
        </a>
      </p>
    </div>
  `;

  return html;
}

/**
 * Create generic notification email template
 */
function createGenericNotificationEmail(userName, message, details) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Hello ${userName},</h2>
      <p>${message}</p>
      ${details ? `<p style="color: #6b7280;">${details}</p>` : ''}
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Dashboard
        </a>
      </p>
    </div>
  `;

  return html;
}

/**
 * Store in-app notification in database
 */
async function storeInAppNotification(userId, notification) {
  try {
    // Initialize Supabase client inside function with service role key for backend operations
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if notifications table exists, if not create it
    const { error: tableError } = await supabase
      .from('user_notifications')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it
      await createNotificationsTable();
    }

    // Insert notification
    const { error: insertError } = await supabase
      .from('user_notifications')
      .insert([{
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        details: notification.details,
        read: notification.read,
        created_at: notification.created_at
      }]);

    if (insertError) {
      console.error('Error storing in-app notification:', insertError);
    }
  } catch (error) {
    console.error('Error in storeInAppNotification:', error);
  }
}

/**
 * Create notifications table if it doesn't exist
 */
async function createNotificationsTable() {
  try {
    // Initialize Supabase client inside function with service role key for backend operations
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
          type TEXT NOT NULL,
          title TEXT,
          message TEXT,
          details JSONB,
          read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(read);
        CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at);
        
        ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own notifications" ON public.user_notifications 
          FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can update own notifications" ON public.user_notifications 
          FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own notifications" ON public.user_notifications 
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    });

    if (error) {
      console.error('Error creating notifications table:', error);
    }
  } catch (error) {
    console.error('Error in createNotificationsTable:', error);
  }
}

/**
 * Get user's unread notifications
 */
export async function getUserNotifications(userId, limit = 10) {
  try {
    // Initialize Supabase client inside function with service role key for backend operations
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId, userId) {
  try {
    // Initialize Supabase client inside function with service role key for backend operations
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    // Initialize Supabase client inside function with service role key for backend operations
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return { success: false, error: error.message };
  }
} 