-- The original users_update_own policy (from 0001_init.sql) let an
-- authenticated user UPDATE any column on their own public.users row via
-- the browser client — including `plan`, letting them grant themselves a
-- paid plan for free. Nothing in the app needs client-side updates to
-- this table: billing fields are written server-side via the service-role
-- client (in the Stripe webhook and the checkout flow), which bypasses RLS
-- entirely. Drop the policy so no such column-level restriction is needed.
drop policy if exists "users_update_own" on public.users;
