import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PortfolioManager } from '@/components/portfolio/PortfolioManager';

const Portfolio = () => {
  return (
    <AppLayout>
      <PortfolioManager />
    </AppLayout>
  );
};

export default Portfolio;