import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm rounded border border-line bg-paper p-8">
        <h1 className="text-2xl font-semibold">CH&apos;TRI COACHING</h1>
        <p className="mt-1 text-sm text-muted">Connectez-vous au back-office.</p>
        <LoginForm />
      </div>
    </main>
  );
}
