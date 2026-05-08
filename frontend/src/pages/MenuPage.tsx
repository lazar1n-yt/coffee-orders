import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, menuApi } from '@/api/menu';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { MenuCard } from '@/components/MenuCard';
import { useCartStore } from '@/store/cart';

export const MenuPage = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const addToCart = useCartStore((s) => s.add);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const menuQuery = useQuery({
    queryKey: ['menu', categoryId],
    queryFn: () =>
      menuApi.list({
        categoryId: categoryId ?? undefined,
        available: true,
      }),
  });

  const items = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);

  return (
    <section>
      <h1>Меню</h1>

      {categoriesQuery.isPending ? (
        <Spinner />
      ) : categoriesQuery.isError ? (
        <ErrorMessage error={categoriesQuery.error} />
      ) : (
        <div className="menu-toolbar" role="tablist" aria-label="Категорії">
          <button
            type="button"
            className={`chip ${categoryId === null ? 'active' : ''}`}
            onClick={() => setCategoryId(null)}
          >
            Усі
          </button>
          {categoriesQuery.data.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`chip ${categoryId === cat.id ? 'active' : ''}`}
              onClick={() => setCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {menuQuery.isPending && <Spinner />}
      {menuQuery.isError && <ErrorMessage error={menuQuery.error} />}
      {menuQuery.isSuccess && items.length === 0 && (
        <div className="empty">У цій категорії наразі немає позицій.</div>
      )}
      {menuQuery.isSuccess && items.length > 0 && (
        <div className="menu-grid">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} onAdd={addToCart} />
          ))}
        </div>
      )}
    </section>
  );
};
