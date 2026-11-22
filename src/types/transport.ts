export interface Stop {
  id: string;
  name: string;
  pickup: string; // morning pickup time HH:mm
  drop: string; // afternoon drop time HH:mm
}

export interface BusRoute {
  id: string;
  name: string;
  campusId: string;
  zone: 'A' | 'B' | 'C';
  vehicleId: string | null;
  driverId: string | null;
  attendantId: string | null;
  stops: Stop[];
  status: 'active' | 'suspended';
}

export interface Vehicle {
  id: string;
  regNo: string;
  model: string;
  capacity: number;
  fitnessUntil: string;
  taxTokenUntil: string;
  insuranceUntil: string;
  routePermitUntil: string;
  odometer: number;
  status: 'active' | 'maintenance' | 'retired';
  gps: boolean;
  maintenance: Array<{on: string;work: string;cost: number;odometer: number;}>;
}

export interface TransportStaff {
  id: string;
  name: string;
  role: 'Driver' | 'Attendant';
  phone: string;
  licenseNo?: string;
  licenseUntil?: string;
}

export interface RiderAssignment {
  studentId: string;
  routeId: string;
  stopId: string;
  since: string;
  mode: 'both' | 'morning' | 'afternoon';
}

export type TripState = 'scheduled' | 'departed' | 'arrived' | 'delayed' | 'cancelled';

export interface Trip {
  id: string;
  routeId: string;
  leg: 'morning' | 'afternoon';
  state: TripState;
  delayMin: number;
  departedAt?: string;
  arrivedAt?: string;
  boarded: string[]; // student ids
  note?: string;
}