import { ServiceCategory } from '@/types';

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'home-services',
    name: 'Home Services',
    slug: 'home-services',
    description: 'Professional home maintenance and repair services',
    iconName: 'Home',
    priority: 1,
    subcategories: [
      { id: 'plumbing', name: 'Plumbing', slug: 'plumbing', description: 'Pipe repairs, installations, blockage clearing', priceRange: { min: 5000, max: 50000 } },
      { id: 'electrical', name: 'Electrical', slug: 'electrical', description: 'Wiring, installations, repairs', priceRange: { min: 3000, max: 100000 } },
      { id: 'hvac', name: 'HVAC/Air Conditioning', slug: 'hvac', description: 'AC installation, repair, servicing', priceRange: { min: 8000, max: 200000 } },
      { id: 'cleaning', name: 'Cleaning Services', slug: 'cleaning', description: 'House cleaning, deep cleaning, post-construction', priceRange: { min: 5000, max: 30000 } },
      { id: 'pest-control', name: 'Pest Control', slug: 'pest-control', description: 'Fumigation, rodent control, termite treatment', priceRange: { min: 10000, max: 80000 } },
      { id: 'painting', name: 'Painting', slug: 'painting', description: 'Interior/exterior painting, wall designs', priceRange: { min: 15000, max: 150000 } },
      { id: 'carpentry', name: 'Carpentry', slug: 'carpentry', description: 'Furniture repair, custom woodwork', priceRange: { min: 8000, max: 200000 } },
      { id: 'generator-solar', name: 'Generator/Solar Installation & Repair', slug: 'generator-solar', description: 'Generator servicing, solar installations', priceRange: { min: 15000, max: 500000 } },
      { id: 'security-systems', name: 'Security System Installation', slug: 'security-systems', description: 'CCTV, alarms, access control', priceRange: { min: 25000, max: 300000 } },
      { id: 'roofing', name: 'Roofing', slug: 'roofing', description: 'Roof repairs, installations, waterproofing', priceRange: { min: 20000, max: 500000 } },
      { id: 'tiling', name: 'Tiling & Flooring', slug: 'tiling', description: 'Floor tiles, wall tiles, PVC installations', priceRange: { min: 10000, max: 200000 } }
    ]
  },
  {
    id: 'construction-building',
    name: 'Construction & Building Services',
    slug: 'construction-building',
    description: 'Complete construction and building services',
    iconName: 'Building',
    priority: 2,
    subcategories: [
      { id: 'foundation-excavation', name: 'Foundation & Excavation', slug: 'foundation-excavation', description: 'Land clearing, foundation laying, excavation', priceRange: { min: 100000, max: 2000000 } },
      { id: 'masonry-bricklaying', name: 'Masonry & Bricklaying', slug: 'masonry-bricklaying', description: 'Block laying, plastering, rendering', priceRange: { min: 50000, max: 800000 } },
      { id: 'concrete-work', name: 'Concrete Work', slug: 'concrete-work', description: 'Concrete pouring, slab work, reinforcement', priceRange: { min: 80000, max: 1500000 } },
      { id: 'steel-fabrication', name: 'Steel Fabrication & Welding', slug: 'steel-fabrication', description: 'Steel structures, welding, metal work', priceRange: { min: 30000, max: 1000000 } },
      { id: 'aluminum-work', name: 'Aluminum & Glass Work', slug: 'aluminum-work', description: 'Windows, doors, glass installations', priceRange: { min: 25000, max: 500000 } },
      { id: 'interior-finishing', name: 'Interior Finishing', slug: 'interior-finishing', description: 'Plastering, tiling, ceiling installations', priceRange: { min: 40000, max: 800000 } },
      { id: 'waterproofing', name: 'Waterproofing', slug: 'waterproofing', description: 'Basement, roof, bathroom waterproofing', priceRange: { min: 50000, max: 300000 } },
      { id: 'heavy-equipment', name: 'Heavy Equipment Operation', slug: 'heavy-equipment', description: 'Crane operation, bulldozers, excavators', priceRange: { min: 100000, max: 500000 } },
      { id: 'site-supervision', name: 'Site Supervision', slug: 'site-supervision', description: 'Construction management, quality control', priceRange: { min: 50000, max: 200000 } }
    ]
  },
  {
    id: 'personal-services',
    name: 'Personal Services',
    slug: 'personal-services',
    description: 'Personal care and lifestyle services',
    iconName: 'User',
    priority: 3,
    subcategories: [
      { id: 'mobile-beauty', name: 'Beauty/Hair (Mobile)', slug: 'mobile-beauty', description: 'Hairdressing, makeup, nail services at your location', priceRange: { min: 3000, max: 50000 } },
      { id: 'massage-therapy', name: 'Massage Therapy', slug: 'massage-therapy', description: 'Therapeutic massage, physiotherapy', priceRange: { min: 8000, max: 30000 } },
      { id: 'personal-training', name: 'Personal Training', slug: 'personal-training', description: 'Fitness coaching, workout plans', priceRange: { min: 10000, max: 40000 } },
      { id: 'tutoring', name: 'Tutoring', slug: 'tutoring', description: 'Academic tutoring, skill training', priceRange: { min: 5000, max: 25000 } },
      { id: 'event-planning', name: 'Event Planning', slug: 'event-planning', description: 'Wedding planning, party organization', priceRange: { min: 50000, max: 2000000 } },
      { id: 'catering', name: 'Catering', slug: 'catering', description: 'Event catering, meal preparation', priceRange: { min: 20000, max: 500000 } },
      { id: 'photography', name: 'Photography', slug: 'photography', description: 'Event photography, portraits, commercial', priceRange: { min: 15000, max: 300000 } },
      { id: 'tailoring', name: 'Tailoring/Fashion Design', slug: 'tailoring', description: 'Custom clothing, alterations, design', priceRange: { min: 5000, max: 100000 } },
      { id: 'childcare', name: 'Childcare & Babysitting', slug: 'childcare', description: 'Professional childcare services', priceRange: { min: 3000, max: 15000 } }
    ]
  },
  {
    id: 'transportation-logistics',
    name: 'Transportation & Logistics',
    slug: 'transportation-logistics',
    description: 'Moving and transportation services',
    iconName: 'Truck',
    priority: 4,
    subcategories: [
      { id: 'moving-services', name: 'Moving Services', slug: 'moving-services', description: 'House/office relocation, packing', priceRange: { min: 20000, max: 200000 } },
      { id: 'delivery-services', name: 'Delivery Services', slug: 'delivery-services', description: 'Item delivery, courier services', priceRange: { min: 2000, max: 30000 } },
      { id: 'auto-mechanic', name: 'Auto Mechanic (Mobile)', slug: 'auto-mechanic', description: 'Car repairs, maintenance at your location', priceRange: { min: 10000, max: 150000 } },
      { id: 'driver-services', name: 'Driver Services', slug: 'driver-services', description: 'Professional driving, chauffeur services', priceRange: { min: 8000, max: 50000 } },
      { id: 'logistics-coordination', name: 'Logistics Coordination', slug: 'logistics-coordination', description: 'Supply chain, warehouse management', priceRange: { min: 30000, max: 200000 } }
    ]
  },
  {
    id: 'business-professional',
    name: 'Business & Professional Services',
    slug: 'business-professional',
    description: 'Professional business support services',
    iconName: 'Briefcase',
    priority: 5,
    subcategories: [
      { id: 'digital-marketing', name: 'Digital Marketing', slug: 'digital-marketing', description: 'Social media, SEO, online advertising', priceRange: { min: 25000, max: 300000 } },
      { id: 'web-development', name: 'Web Development', slug: 'web-development', description: 'Website creation, app development', priceRange: { min: 50000, max: 1000000 } },
      { id: 'graphic-design', name: 'Graphic Design', slug: 'graphic-design', description: 'Logo design, branding, print materials', priceRange: { min: 15000, max: 200000 } },
      { id: 'accounting', name: 'Accounting & Bookkeeping', slug: 'accounting', description: 'Financial records, tax preparation', priceRange: { min: 20000, max: 150000 } },
      { id: 'equipment-repair', name: 'Equipment Repair', slug: 'equipment-repair', description: 'Industrial equipment maintenance', priceRange: { min: 15000, max: 500000 } },
      { id: 'office-cleaning', name: 'Office Cleaning', slug: 'office-cleaning', description: 'Commercial cleaning services', priceRange: { min: 10000, max: 100000 } },
      { id: 'it-support', name: 'IT Support', slug: 'it-support', description: 'Computer repair, network setup', priceRange: { min: 8000, max: 200000 } },
      { id: 'content-creation', name: 'Content Creation', slug: 'content-creation', description: 'Writing, video production, content strategy', priceRange: { min: 10000, max: 200000 } }
    ]
  },
  {
    id: 'specialized-nigerian',
    name: 'Specialized Nigerian Services',
    slug: 'specialized-nigerian',
    description: 'Services specific to Nigerian market needs',
    iconName: 'Star',
    priority: 6,
    subcategories: [
      { id: 'pos-agent', name: 'POS Agent Services', slug: 'pos-agent', description: 'Mobile money, cash services', priceRange: { min: 100, max: 50000 } },
      { id: 'mobile-money', name: 'Mobile Money Support', slug: 'mobile-money', description: 'Payment assistance, transfers', priceRange: { min: 200, max: 10000 } },
      { id: 'agricultural-consulting', name: 'Agricultural Equipment/Consulting', slug: 'agricultural-consulting', description: 'Farm equipment, agricultural advice', priceRange: { min: 20000, max: 500000 } },
      { id: 'borehole-drilling', name: 'Borehole Drilling', slug: 'borehole-drilling', description: 'Water well drilling, pump installation', priceRange: { min: 200000, max: 2000000 } },
      { id: 'waste-management', name: 'Waste Management', slug: 'waste-management', description: 'Waste collection, recycling services', priceRange: { min: 5000, max: 100000 } },
      { id: 'domestic-help', name: 'Domestic Help', slug: 'domestic-help', description: 'House help, cooking, laundry services', priceRange: { min: 30000, max: 120000 } }
    ]
  },
  {
    id: 'industrial-manufacturing',
    name: 'Industrial & Manufacturing Support',
    slug: 'industrial-manufacturing',
    description: 'Industrial and manufacturing services',
    iconName: 'Cog',
    priority: 7,
    subcategories: [
      { id: 'factory-maintenance', name: 'Factory Maintenance', slug: 'factory-maintenance', description: 'Industrial equipment servicing', priceRange: { min: 50000, max: 1000000 } },
      { id: 'quality-control', name: 'Quality Control', slug: 'quality-control', description: 'Product inspection, quality assurance', priceRange: { min: 30000, max: 200000 } },
      { id: 'machine-operation', name: 'Machine Operation', slug: 'machine-operation', description: 'Industrial machine operators', priceRange: { min: 40000, max: 150000 } },
      { id: 'safety-inspection', name: 'Safety Inspection', slug: 'safety-inspection', description: 'Workplace safety audits', priceRange: { min: 25000, max: 100000 } },
      { id: 'technical-documentation', name: 'Technical Documentation', slug: 'technical-documentation', description: 'Process documentation, manuals', priceRange: { min: 20000, max: 150000 } }
    ]
  }
];

export const getServiceCategoryBySlug = (slug: string): ServiceCategory | undefined => {
  return serviceCategories.find(category => category.slug === slug);
};

export const getSubcategoryBySlug = (categorySlug: string, subcategorySlug: string) => {
  const category = getServiceCategoryBySlug(categorySlug);
  return category?.subcategories.find(sub => sub.slug === subcategorySlug);
};

export const getAllSubcategories = () => {
  return serviceCategories.flatMap(category => 
    category.subcategories.map(sub => ({
      ...sub,
      categoryName: category.name,
      categorySlug: category.slug
    }))
  );
};