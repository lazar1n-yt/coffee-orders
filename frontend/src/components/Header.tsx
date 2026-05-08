import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export const Header = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore((s) => s.totalCount());

  return (
    <header className="header">
      <div className="container header-inner">
        <NavLink to="/" className="brand">
          ☕ Coffee Orders
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end>
            Меню
          </NavLink>
          <NavLink to="/cart">
            Кошик
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/admin">Адмін</NavLink>}
          {user ? (
            <>
              <span style={{ color: 'var(--color-muted)' }}>{user.fullName}</span>
              <button
                type="button"
                className="secondary"
                onClick={logout}
                style={{ padding: '0.3em 0.8em' }}
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Увійти</NavLink>
              <NavLink to="/register">Реєстрація</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
