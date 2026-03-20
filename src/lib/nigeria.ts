export const NIGERIAN_CITIES = [
  'Abuja',
  'Lagos',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Benin City',
  'Kaduna',
  'Enugu',
  'Onitsha',
  'Warri',
  'Jos',
  'Ilorin',
  'Aba',
  'Maiduguri',
  'Calabar',
  'Uyo',
  'Abeokuta',
  'Owerri',
  'Asaba',
  'Yola',
  'Zaria',
  'Sokoto',
  'Akure',
  'Bauchi',
  'Makurdi',
];

/**
 * Neighbourhood-level areas for major Nigerian cities.
 * Used to enable precise location filtering — "Lekki" not just "Lagos".
 */
export const CITY_AREAS: Record<string, string[]> = {
  'Lagos': [
    'Lekki', 'Victoria Island', 'Ikoyi', 'Surulere', 'Ikeja',
    'Yaba', 'Lagos Island', 'Oshodi', 'Festac', 'Agege',
    'Ikorodu', 'Badagry', 'Epe', 'Mushin', 'Alimosho',
  ],
  'Abuja': [
    'Wuse', 'Wuse 2', 'Garki', 'Maitama', 'Asokoro',
    'Gwarinpa', 'Kubwa', 'Lugbe', 'Jabi', 'Utako',
  ],
  'Port Harcourt': [
    'GRA Phase 1', 'GRA Phase 2', 'Trans-Amadi', 'Rumuola',
    'Diobu', 'Rumuigbo', 'Borokiri', 'Mile 1', 'Mile 3',
  ],
  'Kano': [
    'Sabon Gari', 'Nassarawa GRA', 'Bompai', 'Sharada', 'Hotoro', 'Kofar Wambai',
  ],
  'Ibadan': [
    'Bodija', 'Ring Road', 'Dugbe', 'Challenge', 'Oluyole', 'Mokola', 'Agodi',
  ],
  'Enugu': ['GRA', 'New Haven', 'Ogui', 'Trans-Ekulu', 'Independence Layout'],
  'Benin City': ['GRA', 'Ugbowo', 'Uselu', 'Sapele Road', 'New Benin'],
};

/** Flat list of "City - Area" strings for area-aware dropdowns. */
export const NIGERIAN_AREAS: string[] = Object.entries(CITY_AREAS).flatMap(
  ([city, areas]) => areas.map(area => `${city} - ${area}`)
);

export const SERVICE_CATEGORIES = [
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical Work' },
  { value: 'Carpentry', label: 'Carpentry & Furniture' },
  { value: 'Painting', label: 'Painting & Decoration' },
  { value: 'Cleaning', label: 'Cleaning Services' },
  { value: 'HVAC', label: 'Air Conditioning & HVAC' },
  { value: 'Roofing', label: 'Roofing' },
  { value: 'Tiling', label: 'Tiling & Flooring' },
  { value: 'Welding', label: 'Welding & Fabrication' },
  { value: 'Masonry', label: 'Masonry & Bricklaying' },
  { value: 'Landscaping', label: 'Landscaping & Garden' },
  { value: 'Appliance Repair', label: 'Appliance Repair' },
  { value: 'Generator', label: 'Generator Maintenance' },
  { value: 'Security', label: 'Security & CCTV' },
  { value: 'Moving', label: 'Moving & Logistics' },
  { value: 'Other', label: 'Other Trade' },
];
