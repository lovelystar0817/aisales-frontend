import type { Route } from './+types/slug';
import { redirect } from 'react-router';
import { useAuthStore } from '~/store/auth';

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const token = useAuthStore.getState().getToken();

  if (token.length === 0) {
    return redirect(`/auth?slug=${params.slug}`);
  }

  return redirect('/');
}

export default function () {
  return <></>;
}
