import { HttpError } from '@/api/client';

interface Props {
  error: unknown;
}

export const ErrorMessage = ({ error }: Props) => {
  let message = 'Сталася непередбачувана помилка';
  if (error instanceof HttpError) {
    message = error.message;
    if (error.status === 0) {
      message = 'Не вдалося з’єднатися із сервером. Перевірте інтернет.';
    } else if (error.status === 404) {
      message = 'Не знайдено. Можливо, ресурс було видалено.';
    } else if (error.status === 401) {
      message = 'Потрібна авторизація. Будь ласка, увійдіть.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }
  return (
    <div className="alert error" role="alert">
      {message}
    </div>
  );
};
