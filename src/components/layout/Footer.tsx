import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  Star,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Trust Section */}
      <div className="border-b border-primary-light">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Built on Trust</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              OgaJobs is Nigeria's first instant trust infrastructure for service providers. 
              Every artisan is verified, every job is protected, and every payment is secured.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-trust rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">100% Verified</h3>
                <p className="text-primary-foreground/80">
                  Every artisan passes our comprehensive verification process including ID, skills, and background checks.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pay When Satisfied</h3>
                <p className="text-primary-foreground/80">
                  Your payment is held securely and only released when you're completely satisfied with the work.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                <p className="text-primary-foreground/80">
                  Our customer care team is available round the clock to ensure smooth service delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-xl">O</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">OgaJobs</h3>
                <p className="text-xs text-primary-foreground/80">Nigeria's Trust Infrastructure</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 mb-6">
              Making it normal for Nigerians to book services as casually as ordering food. 
              Eliminating anxiety, building trust, ensuring quality.
            </p>
            <div className="flex gap-4">
              <Button size="icon" variant="secondary" className="w-8 h-8">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="w-8 h-8">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="w-8 h-8">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="w-8 h-8">
                <Linkedin className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Our Services</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li><Link to="/services/home" className="hover:text-white transition-colors">Home Services</Link></li>
              <li><Link to="/services/construction" className="hover:text-white transition-colors">Construction & Building</Link></li>
              <li><Link to="/services/personal" className="hover:text-white transition-colors">Personal Services</Link></li>
              <li><Link to="/services/business" className="hover:text-white transition-colors">Business Services</Link></li>
              <li><Link to="/services/transportation" className="hover:text-white transition-colors">Transportation</Link></li>
              <li><Link to="/services/specialized" className="hover:text-white transition-colors">Nigerian Specialties</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/safety" className="hover:text-white transition-colors">Safety Guidelines</Link></li>
              <li><Link to="/dispute-resolution" className="hover:text-white transition-colors">Dispute Resolution</Link></li>
              <li><Link to="/become-artisan" className="hover:text-white transition-colors">Become an Artisan</Link></li>
              <li><Link to="/pos-partnership" className="hover:text-white transition-colors">POS Partnership</Link></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Stay Connected</h4>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <span className="text-primary-foreground/80">+234 (0) 123 456 7890</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                <span className="text-primary-foreground/80">support@ogajobs.com.ng</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1" />
                <span className="text-primary-foreground/80">
                  Lagos, Abuja & Benin City<br />
                  Nigeria
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-primary-foreground/80 mb-3">Subscribe for updates</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter your email" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
                <Button variant="secondary">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-primary-light">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/80 text-sm">
              © 2024 OgaJobs.com.ng. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-primary-foreground/80">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};