'use client';

import { ReactNode, useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { RegistrationModal } from './RegistrationModal';
import { usePathname } from 'next/navigation';

interface GuestGateProps {
  children: ReactNode;
  feature?: string;
  /** Override the redirect path (defaults to current pathname) */
  redirectPath?: string;
  className?: string;
}

export function GuestGate({ children, feature, redirectPath, className }: GuestGateProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);

  if (user) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <span onClick={handleClick} className={className}>
        {children}
      </span>
      <RegistrationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        redirectPath={redirectPath || pathname}
        feature={feature}
      />
    </>
  );
}
