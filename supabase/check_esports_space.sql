select id, name, slug, is_private, owner_id from public.spaces where slug = 'esports';
select * from public.space_members where space_id = (select id from public.spaces where slug = 'esports');
