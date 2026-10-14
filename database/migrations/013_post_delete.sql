-- Members can delete their own posts. The route restricts deletes to the verified author;
-- media, likes, comments and saves are removed by their ON DELETE CASCADE foreign keys.
GRANT DELETE ON public.posts TO social_app;
