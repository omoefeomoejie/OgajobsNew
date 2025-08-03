import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { ServiceCategoriesSection } from '@/components/home/ServiceCategoriesSection';
import { TrustSection } from '@/components/home/TrustSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ServiceCategoriesSection />
        <TrustSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
