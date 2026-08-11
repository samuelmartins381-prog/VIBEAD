import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("users").select("plan").eq("id", user!.id).single();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <dl className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900">{user?.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Plan</dt>
            <dd className="font-medium capitalize text-zinc-900">{profile?.plan ?? "free"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
