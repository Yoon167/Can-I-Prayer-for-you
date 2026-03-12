with elevated_auth_roles as (
  select
    auth_users.id as user_id,
    coalesce(auth_users.email, '') as email,
    case coalesce(auth_users.raw_app_meta_data ->> 'role', auth_users.raw_user_meta_data ->> 'role', 'member')
      when 'owner' then 'prayer-core'
      when 'pastor' then 'pastor'
      when 'intercessor' then 'intercessor'
      when 'prayer-core' then 'prayer-core'
      else null
    end as desired_role
  from auth.users as auth_users
)
insert into public.member_accounts (user_id, email, role)
select
  elevated_auth_roles.user_id,
  elevated_auth_roles.email,
  elevated_auth_roles.desired_role
from elevated_auth_roles
where elevated_auth_roles.desired_role is not null
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role,
    updated_at = timezone('utc', now());

select
  member_accounts.user_id,
  member_accounts.email,
  member_accounts.role as member_account_role,
  case coalesce(auth_users.raw_app_meta_data ->> 'role', auth_users.raw_user_meta_data ->> 'role', 'member')
    when 'owner' then 'prayer-core'
    when 'pastor' then 'pastor'
    when 'intercessor' then 'intercessor'
    when 'prayer-core' then 'prayer-core'
    else 'member'
  end as auth_role
from public.member_accounts
join auth.users as auth_users on auth_users.id = member_accounts.user_id
where member_accounts.role in ('intercessor', 'pastor', 'prayer-core')
order by member_accounts.email;