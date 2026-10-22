import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layout/AuthLayout';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { name, email, password } = form;
      await register({ name, email, password });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start organising work with your team"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <FormField
          label="Full name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          value={form.name}
          onChange={update('name')}
        />
        <FormField label="Email" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update('password')}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
