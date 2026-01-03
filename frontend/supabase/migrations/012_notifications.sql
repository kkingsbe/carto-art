-- Create notification_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM ('FOLLOW', 'MAP_POST', 'COMMENT', 'LIKE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    resource_id UUID, -- map_id or follow_id etc.
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = recipient_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at) WHERE read_at IS NULL;

-- Helper function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_id UUID,
    p_actor_id UUID,
    p_type public.notification_type,
    p_resource_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Don't notify if actor is the recipient
    IF p_recipient_id = p_actor_id THEN
        RETURN;
    END IF;

    INSERT INTO public.notifications (recipient_id, actor_id, type, resource_id)
    VALUES (p_recipient_id, p_actor_id, p_type, p_resource_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New Follower
CREATE OR REPLACE FUNCTION handle_new_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(NEW.following_id, NEW.follower_id, 'FOLLOW');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_follow_notification();

-- Trigger for New Comment
CREATE OR REPLACE FUNCTION handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_map_owner_id UUID;
BEGIN
    SELECT user_id INTO v_map_owner_id FROM public.maps WHERE id = NEW.map_id;
    
    PERFORM create_notification(v_map_owner_id, NEW.user_id, 'COMMENT', NEW.map_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_comment_notification();

-- Trigger for New Like (Vote = 1)
CREATE OR REPLACE FUNCTION handle_new_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_map_owner_id UUID;
BEGIN
    -- Only for upvotes
    IF NEW.value = 1 THEN
        SELECT user_id INTO v_map_owner_id FROM public.maps WHERE id = NEW.map_id;
        PERFORM create_notification(v_map_owner_id, NEW.user_id, 'LIKE', NEW.map_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_created ON public.votes;
CREATE TRIGGER on_vote_created
    AFTER INSERT OR UPDATE ON public.votes
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_like_notification();

-- Trigger for New Map Post (Notify Followers)
CREATE OR REPLACE FUNCTION handle_new_map_post_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the map is being published for the first time OR updated to published
    -- For simplicity, let's trigger on INSERT if is_published is true, 
    -- and on UPDATE if is_published changes from false to true.
    
    IF (TG_OP = 'INSERT' AND NEW.is_published = true) OR
       (TG_OP = 'UPDATE' AND NEW.is_published = true AND OLD.is_published = false) THEN
        
        INSERT INTO public.notifications (recipient_id, actor_id, type, resource_id)
        SELECT follower_id, NEW.user_id, 'MAP_POST', NEW.id
        FROM public.follows
        WHERE following_id = NEW.user_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_map_published ON public.maps;
CREATE TRIGGER on_map_published
    AFTER INSERT OR UPDATE ON public.maps
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_map_post_notification();
