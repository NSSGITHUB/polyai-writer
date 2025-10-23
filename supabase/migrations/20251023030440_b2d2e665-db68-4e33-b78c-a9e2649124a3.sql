-- Add DELETE policy for wordpress_posts table
CREATE POLICY "Users can delete their own posts"
ON wordpress_posts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM wordpress_sites
    WHERE wordpress_sites.id = wordpress_posts.site_id
    AND wordpress_sites.user_id = auth.uid()
  )
);