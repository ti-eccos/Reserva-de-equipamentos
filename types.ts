export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

export enum ReservationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum EquipmentType {
  CHROMEBOOK = 'chromebook',
  IPAD = 'ipad'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isBlocked: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  description?: string;
  isActive: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  equipmentIds: string[];
  startTime: string; // ISO String
  endTime: string;   // ISO String
  purpose: string;
  status: ReservationStatus;
  createdAt: string;
}
