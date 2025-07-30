# Services

This directory contains service modules for the mobile app.

## Supabase Integration

The `supabase.ts` file contains the Supabase client configuration for real-time database synchronization.

### Setup Required

1. **Update Supabase Configuration**: 
   - Replace `SUPABASE_URL` with your actual Supabase project URL
   - Replace `SUPABASE_ANON_KEY` with your actual anon key

2. **Database Tables**: 
   - Ensure you have `calendar_events` and `tasks` tables in your Supabase database
   - Enable Row Level Security (RLS) policies for these tables

3. **Real-time Features**:
   - Enable real-time subscriptions in your Supabase project settings
   - Configure the necessary database triggers for real-time updates

### Real-time Sync Features

- **Calendar Events**: Automatically syncs when events are created, updated, or deleted
- **Tasks**: Automatically syncs when tasks are created, updated, or deleted
- **Cross-device Updates**: Changes made on one device appear instantly on other devices
- **Offline Support**: Changes are queued and synced when connection is restored

### Usage

The Supabase client is imported in `CalendarScreen.tsx` and automatically:
- Establishes real-time subscriptions on component mount
- Handles INSERT, UPDATE, and DELETE events
- Updates the local state to reflect database changes
- Cleans up subscriptions on component unmount

### Authentication

The `getCurrentUserId()` function needs to be implemented based on your authentication system to filter data by user. 