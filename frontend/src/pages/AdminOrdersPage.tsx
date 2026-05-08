import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders';
import { Spinner } from '@/components/Spinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { formatDateTime, formatPrice, orderStatusLabel } from '@/utils/format';
import type { OrderStatus } from '@/api/types';

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'READY',
  'COMPLETED',
  'CANCELLED',
];

export const AdminOrdersPage = () => {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () =>
      ordersApi.list({
        status: status === '' ? undefined : status,
        page: 1,
        pageSize: 50,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) =>
      ordersApi.updateStatus(id, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  return (
    <section>
      <h1>Замовлення</h1>

      <div className="menu-toolbar">
        <button
          type="button"
          className={`chip ${status === '' ? 'active' : ''}`}
          onClick={() => setStatus('')}
        >
          Усі
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${status === s ? 'active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {orderStatusLabel[s]}
          </button>
        ))}
      </div>

      {ordersQuery.isPending && <Spinner />}
      {ordersQuery.isError && <ErrorMessage error={ordersQuery.error} />}
      {updateStatus.isError && <ErrorMessage error={updateStatus.error} />}

      {ordersQuery.isSuccess && ordersQuery.data.items.length === 0 && (
        <div className="empty">Замовлень не знайдено.</div>
      )}

      {ordersQuery.isSuccess && ordersQuery.data.items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>№</th>
                <th>Створено</th>
                <th>Видача</th>
                <th>Клієнт</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.data.items.map((o) => (
                <tr key={o.id}>
                  <td>#{o.number}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>{formatDateTime(o.pickupTime)}</td>
                  <td>
                    {o.customerName}
                    <div style={{ color: 'var(--color-muted)', fontSize: '0.85em' }}>
                      {o.phone}
                    </div>
                  </td>
                  <td>{formatPrice(o.totalCents)}</td>
                  <td>
                    <span className={`status ${o.status}`}>
                      {orderStatusLabel[o.status]}
                    </span>
                  </td>
                  <td>
                    <select
                      value={o.status}
                      disabled={updateStatus.isPending}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: o.id,
                          next: e.target.value as OrderStatus,
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {orderStatusLabel[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
