import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}