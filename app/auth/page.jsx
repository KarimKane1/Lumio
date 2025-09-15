"use client";
import React, { Suspense } from 'react';
import BoltAuthPage from '../../components/bolt/pages/AuthPage';
import SessionGuard from '../../components/common/SessionGuard';

export const dynamic = 'force-dynamic';
import { I18nProvider } from '../../context/I18nContext';

export default function AuthPage() {
  // Use a separate, page-only i18n scope that does not persist
  return (
    <I18nProvider forcedLang={undefined}>
      <Suspense fallback={<div>Loading...</div>}>
        <BoltAuthPage />
      </Suspense>
    </I18nProvider>
  );
}


