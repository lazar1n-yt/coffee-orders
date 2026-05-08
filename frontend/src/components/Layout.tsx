import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="footer">
        <div className="container">
          © {new Date().getFullYear()} Coffee Orders · Навчальний проєкт
        </div>
      </footer>
    </div>
  );
};
