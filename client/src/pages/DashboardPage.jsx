import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hi, {user.name}</h1>
        <Button variant="secondary" onClick={logout}>
          Log out
        </Button>
      </div>
    </main>
  );
}
