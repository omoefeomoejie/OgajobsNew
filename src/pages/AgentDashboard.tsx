import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import POSAgentDashboard from '@/components/pos-agent/POSAgentDashboard';

const AgentDashboard = () => {
  return (
    <AppLayout>
      <POSAgentDashboard />
    </AppLayout>
  );
};

export default AgentDashboard;