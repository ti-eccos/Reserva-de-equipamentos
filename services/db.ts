import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  addDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { UserRole, UserProfile, Equipment, Reservation, ReservationStatus } from '../types';

// --- Users ---
export const SUPERADMIN_EMAIL = "tecnologia@colegioeccos.com.br";

export const syncUser = async (user: any): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    const isSuper = user.email === SUPERADMIN_EMAIL;
    const newUser: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Usuário',
      role: isSuper ? UserRole.SUPERADMIN : UserRole.USER,
      isBlocked: false
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
};

export const getAllUsers = async () => {
  const q = query(collection(db, 'users'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
};

export const updateUserRole = async (uid: string, role: UserRole) => {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { role });
};

export const toggleBlockUser = async (uid: string, currentStatus: boolean) => {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { isBlocked: !currentStatus });
};

// --- Equipments ---
export const getEquipments = async () => {
  const q = query(collection(db, 'equipments'), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as Equipment));
};

export const addEquipment = async (equip: Omit<Equipment, 'id'>) => {
  await addDoc(collection(db, 'equipments'), equip);
};

export const deleteEquipment = async (id: string) => {
  await updateDoc(doc(db, 'equipments', id), { isActive: false });
};

// --- Reservations ---
export const createReservation = async (res: Omit<Reservation, 'id'>) => {
  // Simple conflict check
  const q = query(
    collection(db, 'reservations'),
    where('status', 'in', [ReservationStatus.APPROVED, ReservationStatus.PENDING])
  );
  const snap = await getDocs(q);
  const existing = snap.docs.map(d => d.data() as Reservation);
  
  const newStart = new Date(res.startTime).getTime();
  const newEnd = new Date(res.endTime).getTime();

  let hasConflict = false;

  for (const ex of existing) {
    const exStart = new Date(ex.startTime).getTime();
    const exEnd = new Date(ex.endTime).getTime();
    
    // Check overlap
    if (newStart < exEnd && newEnd > exStart) {
      // Check equipment overlap
      const conflictEquip = res.equipmentIds.some(id => ex.equipmentIds.includes(id));
      if (conflictEquip) {
        hasConflict = true;
        break;
      }
    }
  }

  // Auto-approval logic
  const status = hasConflict ? ReservationStatus.REJECTED : ReservationStatus.APPROVED;
  
  await addDoc(collection(db, 'reservations'), {
    ...res,
    status
  });
  
  return status;
};

export const getReservations = async () => {
  const q = query(collection(db, 'reservations'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as Reservation));
};

export const updateReservationStatus = async (id: string, status: ReservationStatus) => {
  await updateDoc(doc(db, 'reservations', id), { status });
};
