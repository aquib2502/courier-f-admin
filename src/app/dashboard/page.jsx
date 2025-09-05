'use client';

import React, { Suspense } from 'react';
import DashboardContent from '@/components/Dashboard/Dashboard';

export default function page() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
  