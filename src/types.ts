export type Role = 'AGENT' | 'OPERATOR' | 'SELLER';

export interface UserProfile {
  uid: string;
  codename: string;
  role: Role;
  district: string;
  zone: string;
  stats: {
    drops: number;
    rating: number;
    joinedAt: string;
  };
  isVerified: boolean;
}

export type DropCategory = 'TECHWEAR' | 'ELECTRONICS' | 'STREETWEAR' | 'INTELLIGENCE' | 'HARDWARE';

export interface Drop {
  id: string;
  sellerId: string;
  sellerCodename: string;
  title: string;
  description: string;
  category: DropCategory;
  price: number;
  quantity: number;
  maxQuantity: number;
  coordinates: [number, number];
  zone: string;
  district: string;
  status: 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED';
  expiresAt: string;
  imageUrl: string;
}

export interface Order {
  id: string;
  dropId: string;
  buyerId: string;
  sellerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  price: number;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}
