export const DISTRICTS = [
  "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail",
  "Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira",
  "Bogra", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Rajshahi", "Sirajganj",
  "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon",
  "Habiganj", "Moulvibazar", "Sunamganj", "Sylhet",
  "Barguna", "Barisal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur",
  "Bandarban", "Brahmanbaria", "Chandpur", "Chittagong", "Comilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati",
  "Jamalpur", "Mymensingh", "Netrokona", "Sherpur"
];

export const DHAKA_ZONES = [
  "Uttara", "Mirpur", "Gulshan", "Banani", "Dhanmondi", "Mohammadpur", "Badda", "Khilgaon", "Motijheel", "Old Dhaka", "Bashundhara", "Farmgate", "Tejgaon", "Rampura"
];

export const CATEGORIES = [
  { id: 'TECHWEAR', label: 'Techwear', icon: 'Zap' },
  { id: 'ELECTRONICS', label: 'Electronics', icon: 'Cpu' },
  { id: 'STREETWEAR', label: 'Streetwear', icon: 'Shirt' },
  { id: 'INTELLIGENCE', label: 'Intelligence', icon: 'FileText' },
  { id: 'HARDWARE', label: 'Hardware', icon: 'HardDrive' },
  { id: 'MEDICAL', label: 'Medical', icon: 'Activity' }
];

export const DEMO_DROPS = [
  {
    id: 'drop-1',
    sellerId: 'seller-1',
    sellerCodename: 'GHOST-01',
    title: 'Neural Link Interface',
    description: 'High-speed neural interface for direct data uplink. Minimal latency, secure encryption.',
    category: 'TECHWEAR',
    price: 450,
    quantity: 3,
    maxQuantity: 5,
    coordinates: [23.8103, 90.4125],
    zone: 'Gulshan',
    district: 'Dhaka',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    imageUrl: 'https://picsum.photos/seed/neural/400/300'
  },
  {
    id: 'drop-2',
    sellerId: 'seller-2',
    sellerCodename: 'CIPHER-23',
    title: 'Tactical Data Slate',
    description: 'Ruggedized tablet for field operations. Pre-loaded with local maps and signal scanners.',
    category: 'ELECTRONICS',
    price: 1200,
    quantity: 1,
    maxQuantity: 2,
    coordinates: [23.7949, 90.4043],
    zone: 'Banani',
    district: 'Dhaka',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    imageUrl: 'https://picsum.photos/seed/slate/400/300'
  },
  {
    id: 'drop-3',
    sellerId: 'seller-3',
    sellerCodename: 'MEDIC-09',
    title: 'Stimpack-X5',
    description: 'Advanced medical stimulant for rapid tissue repair and adrenaline boost. 100% pure.',
    category: 'MEDICAL',
    price: 300,
    quantity: 10,
    maxQuantity: 20,
    coordinates: [23.8759, 90.3795],
    zone: 'Uttara',
    district: 'Dhaka',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    imageUrl: 'https://picsum.photos/seed/meds/400/300'
  }
];
