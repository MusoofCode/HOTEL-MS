-- Storage policies for admin-only access to receipts bucket
-- Previous migration failed due to nested $$ quoting.

DROP POLICY IF EXISTS admin_read_receipts ON storage.objects;
DROP POLICY IF EXISTS admin_insert_receipts ON storage.objects;
DROP POLICY IF EXISTS admin_update_receipts ON storage.objects;
DROP POLICY IF EXISTS admin_delete_receipts ON storage.objects;

CREATE POLICY admin_read_receipts
ON storage.objects
FOR SELECT
USING (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY admin_insert_receipts
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY admin_update_receipts
ON storage.objects
FOR UPDATE
USING (bucket_id = 'receipts' AND public.is_admin())
WITH CHECK (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY admin_delete_receipts
ON storage.objects
FOR DELETE
USING (bucket_id = 'receipts' AND public.is_admin());
