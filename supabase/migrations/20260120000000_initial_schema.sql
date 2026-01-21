-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for user's event library (all events they've ever used)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create table for user's occurrence library (all occurrences they've ever tracked)
CREATE TABLE user_occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create table for tracking which occurrences users want to monitor
CREATE TABLE tracked_occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create table for daily journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

-- Create table for events that happened on a specific day
CREATE TABLE entry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for occurrences that happened on a specific day
CREATE TABLE entry_occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    occurrence_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_last_used ON user_events(user_id, last_used_at DESC);
CREATE INDEX idx_user_events_usage_count ON user_events(user_id, usage_count DESC);
CREATE INDEX idx_user_occurrences_user_id ON user_occurrences(user_id);
CREATE INDEX idx_user_occurrences_last_used ON user_occurrences(user_id, last_used_at DESC);
CREATE INDEX idx_user_occurrences_usage_count ON user_occurrences(user_id, usage_count DESC);
CREATE INDEX idx_tracked_occurrences_user_id ON tracked_occurrences(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);
CREATE INDEX idx_entry_events_entry_id ON entry_events(entry_id);
CREATE INDEX idx_entry_events_name ON entry_events(event_name);
CREATE INDEX idx_entry_occurrences_entry_id ON entry_occurrences(entry_id);
CREATE INDEX idx_entry_occurrences_name ON entry_occurrences(occurrence_name);

-- Enable Row Level Security (RLS)
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_occurrences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_events
CREATE POLICY "Users can view their own event library"
    ON user_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
    ON user_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON user_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON user_events FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for user_occurrences
CREATE POLICY "Users can view their own occurrence library"
    ON user_occurrences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own occurrences"
    ON user_occurrences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own occurrences"
    ON user_occurrences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own occurrences"
    ON user_occurrences FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for tracked_occurrences
CREATE POLICY "Users can view their own tracked occurrences"
    ON tracked_occurrences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked occurrences"
    ON tracked_occurrences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked occurrences"
    ON tracked_occurrences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked occurrences"
    ON tracked_occurrences FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view their own journal entries"
    ON journal_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
    ON journal_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
    ON journal_entries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
    ON journal_entries FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for entry_events
CREATE POLICY "Users can view events from their own entries"
    ON entry_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE journal_entries.id = entry_events.entry_id
            AND journal_entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events to their own entries"
    ON entry_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE journal_entries.id = entry_events.entry_id
            AND journal_entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete events from their own entries"
    ON entry_events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE journal_entries.id = entry_events.entry_id
            AND journal_entries.user_id = auth.uid()
        )
    );

-- RLS Policies for entry_occurrences
CREATE POLICY "Users can view occurrences from their own entries"
    ON entry_occurrences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE journal_entries.id = entry_occurrences.entry_id
            AND journal_entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert occurrences to their own entries"
    ON entry_occurrences FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE journal_entries.id = entry_occurrences.entry_id
            AND journal_entries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete occurrences from their own entries"
    ON entry_occurrences FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE journal_entries.id = entry_occurrences.entry_id
            AND journal_entries.user_id = auth.uid()
        )
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Function to add or update event in user's library
CREATE OR REPLACE FUNCTION upsert_user_event(p_user_id UUID, p_event_name TEXT)
RETURNS VOID AS $
BEGIN
    INSERT INTO user_events (user_id, name, usage_count, last_used_at)
    VALUES (p_user_id, p_event_name, 1, NOW())
    ON CONFLICT (user_id, name) 
    DO UPDATE SET 
        usage_count = user_events.usage_count + 1,
        last_used_at = NOW();
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add or update occurrence in user's library
CREATE OR REPLACE FUNCTION upsert_user_occurrence(p_user_id UUID, p_occurrence_name TEXT)
RETURNS VOID AS $
BEGIN
    INSERT INTO user_occurrences (user_id, name, usage_count, last_used_at)
    VALUES (p_user_id, p_occurrence_name, 1, NOW())
    ON CONFLICT (user_id, name) 
    DO UPDATE SET 
        usage_count = user_occurrences.usage_count + 1,
        last_used_at = NOW();
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update user_events when an entry_event is created
CREATE OR REPLACE FUNCTION sync_user_events()
RETURNS TRIGGER AS $
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id from the journal entry
    SELECT user_id INTO v_user_id
    FROM journal_entries
    WHERE id = NEW.entry_id;
    
    -- Update the user's event library
    PERFORM upsert_user_event(v_user_id, NEW.event_name);
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically update user_occurrences when an entry_occurrence is created
CREATE OR REPLACE FUNCTION sync_user_occurrences()
RETURNS TRIGGER AS $
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id from the journal entry
    SELECT user_id INTO v_user_id
    FROM journal_entries
    WHERE id = NEW.entry_id;
    
    -- Update the user's occurrence library
    PERFORM upsert_user_occurrence(v_user_id, NEW.occurrence_name);
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_tracked_occurrences_updated_at
    BEFORE UPDATE ON tracked_occurrences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers to sync user libraries
CREATE TRIGGER sync_user_events_on_insert
    AFTER INSERT ON entry_events
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_events();

CREATE TRIGGER sync_user_occurrences_on_insert
    AFTER INSERT ON entry_occurrences
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_occurrences();

-- Helper view to get all data for a user's entries (useful for correlation analysis)
CREATE VIEW user_journal_data AS
SELECT 
    je.id AS entry_id,
    je.user_id,
    je.entry_date,
    ARRAY_AGG(DISTINCT ee.event_name) FILTER (WHERE ee.event_name IS NOT NULL) AS events,
    ARRAY_AGG(DISTINCT eo.occurrence_name) FILTER (WHERE eo.occurrence_name IS NOT NULL) AS occurrences
FROM journal_entries je
LEFT JOIN entry_events ee ON je.id = ee.entry_id
LEFT JOIN entry_occurrences eo ON je.id = eo.entry_id
GROUP BY je.id, je.user_id, je.entry_date;

-- Grant access to the view
GRANT SELECT ON user_journal_data TO authenticated;

-- RLS for the view
ALTER VIEW user_journal_data SET (security_invoker = true);