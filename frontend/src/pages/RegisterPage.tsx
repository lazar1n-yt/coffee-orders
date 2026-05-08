import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { ErrorMessage } from '@/components/ErrorMessage';

export const RegisterPage = () => {
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<unknown>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({ email, password, fullName, phone: phone || undefined });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err);
    }
  };

  return (
    <section>
      <h1>Реєстрація</h1>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          <label htmlFor="r-name">Ім’я та прізвище</label>
          <input
            id="r-name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="r-email">Email</label>
          <input
            id="r-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="r-password">Пароль (мін. 8 символів)</label>
          <input
            id="r-password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="r-phone">Телефон (необов’язково)</label>
          <input
            id="r-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {error && <ErrorMessage error={error} />}
        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Створення…' : 'Створити акаунт'}
          </button>
          <Link to="/login">Уже є акаунт? Увійти</Link>
        </div>
      </form>
    </section>
  );
};
