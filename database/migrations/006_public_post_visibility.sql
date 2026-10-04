-- Only the post's author can change visibility through the authenticated API.
GRANT UPDATE (visibility) ON public.posts TO social_app;
