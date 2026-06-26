import { lazy, Suspense } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';

const AuthModal = lazy(() => import('./AuthModal').then((m) => ({ default: m.AuthModal })));
const AccountModal = lazy(() => import('./AccountModal').then((m) => ({ default: m.AccountModal })));
const ShareModal = lazy(() => import('./ShareModal').then((m) => ({ default: m.ShareModal })));

export function ModalHost() {
  useTick();
  const modal = store.ui.modal;
  if (!modal) return null;
  return (
    <Suspense fallback={null}>
      {modal === 'auth' && <AuthModal />}
      {modal === 'account' && <AccountModal />}
      {modal === 'share' && <ShareModal />}
    </Suspense>
  );
}
