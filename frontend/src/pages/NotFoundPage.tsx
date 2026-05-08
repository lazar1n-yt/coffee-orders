import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <section>
    <h1>404 — сторінку не знайдено</h1>
    <p>Можливо, ви перейшли за застарілим посиланням.</p>
    <Link to="/">← На головну</Link>
  </section>
);
