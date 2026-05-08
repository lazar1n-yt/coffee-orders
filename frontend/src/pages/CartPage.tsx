import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/store/cart';
import { ordersApi } from '@/api/orders';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/utils/format';
import { ErrorMessage } from '@/components/ErrorMessage';

const minPickupDateTimeLocal = () => {
  const d = new Date(Date.now() + 15 * 60 * 1000); // +15 хв
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const CartPage = () => {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const total = useCartStore((s) => s.totalCents());
  const clear = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [comment, setComment] = useState('');
  const [pickupTime, setPickupTime] = useState(minPickupDateTimeLocal());
  const [success, setSuccess] = useState<{ number: number } | null>(null);

  const mutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      clear();
      setSuccess({ number: order.number });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      customerName,
      phone,
      comment: comment || undefined,
      pickupTime: new Date(pickupTime).toISOString(),
      items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    });
  };

  if (success) {
    return (
      <section>
        <h1>Замовлення прийнято</h1>
        <div className="alert success">
          Дякуємо! Номер вашого замовлення —{' '}
          <strong>#{success.number}</strong>. Ми зв’яжемося з вами для
          підтвердження.
        </div>
        <div className="actions">
          <button type="button" onClick={() => navigate('/')}>
            До меню
          </button>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section>
        <h1>Кошик</h1>
        <div className="empty">
          Ваш кошик порожній. <a href="/">Перейдіть до меню</a>, щоб додати позиції.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1>Кошик</h1>

      <div>
        {items.map((item) => (
          <div className="cart-row" key={item.menuItemId}>
            <div className="thumb" aria-hidden="true">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                '☕'
              )}
            </div>
            <div className="name">
              <strong>{item.name}</strong>
              <div style={{ color: 'var(--color-muted)', fontSize: '0.9em' }}>
                {formatPrice(item.priceCents)} × {item.quantity}
              </div>
            </div>
            <div className="qty">
              <button
                type="button"
                className="secondary"
                onClick={() => setQuantity(item.menuItemId, item.quantity - 1)}
                aria-label="Зменшити кількість"
              >
                −
              </button>
              <span style={{ minWidth: '1.5em', textAlign: 'center' }}>
                {item.quantity}
              </span>
              <button
                type="button"
                className="secondary"
                onClick={() => setQuantity(item.menuItemId, item.quantity + 1)}
                aria-label="Збільшити кількість"
              >
                +
              </button>
            </div>
            <div className="price">
              {formatPrice(item.priceCents * item.quantity)}
            </div>
            <button
              type="button"
              className="secondary remove"
              onClick={() => remove(item.menuItemId)}
              aria-label="Видалити"
              style={{ padding: '0.3em 0.7em' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="total">
          <span>Разом:</span>
          <span>{formatPrice(total)}</span>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <h2 style={{ fontSize: '1.1rem' }}>Дані для замовлення</h2>
          <div className="form-row">
            <label htmlFor="name">Ім’я *</label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="phone">Телефон *</label>
            <input
              id="phone"
              type="tel"
              required
              placeholder="+380501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="pickup">Час видачі *</label>
            <input
              id="pickup"
              type="datetime-local"
              required
              min={minPickupDateTimeLocal()}
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="comment">Коментар</label>
            <textarea
              id="comment"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {mutation.isError && <ErrorMessage error={mutation.error} />}

          <div className="actions">
            <button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Надсилання…' : 'Оформити замовлення'}
            </button>
            <button type="button" className="secondary" onClick={clear}>
              Очистити кошик
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
