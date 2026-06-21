import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/dashboard";

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-5 py-16">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
