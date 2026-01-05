-- Drop the previous restricted policy
DROP POLICY IF EXISTS "Admins can read all donations" ON public.donations;

-- Create a new policy that allows full management for admins
CREATE POLICY "Admins can manage all donations" ON public.donations
    FOR ALL
    USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true )
    WITH CHECK ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true );
