import type { MenuItem } from '@/api/types';
import { formatPrice } from '@/utils/format';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export const MenuCard = ({ item, onAdd }: Props) => {
  return (
    <article className="card">
      <div className="card-image" aria-hidden="true">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} loading="lazy" />
        ) : (
          <span>☕</span>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-name">{item.name}</h3>
        {item.description && <p className="card-desc">{item.description}</p>}
        <div className="card-footer">
          <span className="price">{formatPrice(item.priceCents)}</span>
          <button
            type="button"
            onClick={() => onAdd(item)}
            disabled={!item.available}
          >
            {item.available ? 'У кошик' : 'Немає'}
          </button>
        </div>
      </div>
    </article>
  );
};
