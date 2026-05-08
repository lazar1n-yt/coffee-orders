export const formatPrice = (cents: number): string => {
  const uah = (cents / 100).toFixed(2).replace('.', ',');
  return `${uah} ₴`;
};

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const orderStatusLabel: Record<string, string> = {
  PENDING: 'Очікує підтвердження',
  CONFIRMED: 'Підтверджено',
  READY: 'Готове до видачі',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
};
