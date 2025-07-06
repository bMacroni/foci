import { createClient } from '@supabase/supabase-js';

// Helper function to create authenticated Supabase client
const createAuthenticatedSupabase = (jwt) => {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  });
};

export const conversationController = {
  // Create a new conversation thread
  async createThread(req, res) {
    try {
      const { title, summary } = req.body;
      const userId = req.user.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!title) {
        return res.status(400).json({ error: 'Thread title is required' });
      }

      const supabase = createAuthenticatedSupabase(token);

      const { data: thread, error } = await supabase
        .from('conversation_threads')
        .insert({
          user_id: userId,
          title: title,
          summary: summary || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation thread:', error);
        return res.status(500).json({ error: 'Failed to create conversation thread' });
      }

      res.status(201).json(thread);
    } catch (error) {
      console.error('Conversation thread creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get all conversation threads for a user
  async getThreads(req, res) {
    try {
      const userId = req.user.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      const supabase = createAuthenticatedSupabase(token);

      const { data: threads, error } = await supabase
        .from('conversation_threads')
        .select(`
          *,
          conversation_messages (
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversation threads:', error);
        return res.status(500).json({ error: 'Failed to fetch conversation threads' });
      }

      // Add message count and last message info to each thread
      const threadsWithStats = threads.map(thread => {
        const messages = thread.conversation_messages || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          ...thread,
          message_count: messages.length,
          last_message: lastMessage ? {
            content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
            role: lastMessage.role,
            created_at: lastMessage.created_at
          } : null,
          conversation_messages: undefined // Remove the full messages array to reduce payload
        };
      });

      res.json(threadsWithStats);
    } catch (error) {
      console.error('Error fetching conversation threads:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get a specific conversation thread with all messages
  async getThread(req, res) {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      const supabase = createAuthenticatedSupabase(token);

      // First, verify the thread belongs to the user
      const { data: thread, error: threadError } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (threadError || !thread) {
        return res.status(404).json({ error: 'Conversation thread not found' });
      }

      // Get all messages for this thread
      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching conversation messages:', messagesError);
        return res.status(500).json({ error: 'Failed to fetch conversation messages' });
      }

      res.json({
        thread,
        messages: messages || []
      });
    } catch (error) {
      console.error('Error fetching conversation thread:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Add a message to a conversation thread
  async addMessage(req, res) {
    try {
      const { threadId } = req.params;
      const { content, role, metadata } = req.body;
      const userId = req.user.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!content || !role) {
        return res.status(400).json({ error: 'Message content and role are required' });
      }

      if (!['user', 'assistant'].includes(role)) {
        return res.status(400).json({ error: 'Role must be either "user" or "assistant"' });
      }

      const supabase = createAuthenticatedSupabase(token);

      // Verify the thread belongs to the user
      const { data: thread, error: threadError } = await supabase
        .from('conversation_threads')
        .select('id')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (threadError || !thread) {
        return res.status(404).json({ error: 'Conversation thread not found' });
      }

      // Insert the message
      const { data: message, error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          thread_id: threadId,
          user_id: userId,
          role,
          content,
          metadata: metadata || null
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error adding message:', messageError);
        return res.status(500).json({ error: 'Failed to add message' });
      }

      // Update the thread's updated_at timestamp
      await supabase
        .from('conversation_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);

      res.status(201).json(message);
    } catch (error) {
      console.error('Error adding message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update a conversation thread (title, summary, etc.)
  async updateThread(req, res) {
    try {
      const { threadId } = req.params;
      const { title, summary, is_active } = req.body;
      const userId = req.user.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      const supabase = createAuthenticatedSupabase(token);

      // Verify the thread belongs to the user
      const { data: thread, error: threadError } = await supabase
        .from('conversation_threads')
        .select('id')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (threadError || !thread) {
        return res.status(404).json({ error: 'Conversation thread not found' });
      }

      // Update the thread
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: updatedThread, error: updateError } = await supabase
        .from('conversation_threads')
        .update(updateData)
        .eq('id', threadId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating conversation thread:', updateError);
        return res.status(500).json({ error: 'Failed to update conversation thread' });
      }

      res.json(updatedThread);
    } catch (error) {
      console.error('Error updating conversation thread:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete a conversation thread (soft delete by setting is_active to false)
  async deleteThread(req, res) {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      const supabase = createAuthenticatedSupabase(token);

      // Verify the thread belongs to the user
      const { data: thread, error: threadError } = await supabase
        .from('conversation_threads')
        .select('id')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (threadError || !thread) {
        return res.status(404).json({ error: 'Conversation thread not found' });
      }

      // Soft delete by setting is_active to false
      const { error: deleteError } = await supabase
        .from('conversation_threads')
        .update({ is_active: false })
        .eq('id', threadId);

      if (deleteError) {
        console.error('Error deleting conversation thread:', deleteError);
        return res.status(500).json({ error: 'Failed to delete conversation thread' });
      }

      res.json({ message: 'Conversation thread deleted successfully' });
    } catch (error) {
      console.error('Error deleting conversation thread:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get conversation statistics for a user
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const token = req.headers.authorization?.replace('Bearer ', '');

      const supabase = createAuthenticatedSupabase(token);

      const { data: stats, error } = await supabase
        .from('conversation_threads')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching conversation stats:', error);
        return res.status(500).json({ error: 'Failed to fetch conversation stats' });
      }

      const totalThreads = stats.length;
      const thisWeek = stats.filter(thread => {
        const threadDate = new Date(thread.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return threadDate >= weekAgo;
      }).length;

      res.json({
        total_threads: totalThreads,
        threads_this_week: thisWeek
      });
    } catch (error) {
      console.error('Error fetching conversation stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 