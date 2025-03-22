export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string;
  role: 'admin' | 'user';
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_admin: boolean;
  membership_status?: 'active' | 'pending' | 'expired' | null;
  membership_type?: 'monthly' | 'quarterly' | 'annual' | null;
  membership_expiry?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface UserMembership {
  id: string;
  user_id: string;
  type: 'monthly' | 'quarterly' | 'annual';
  status: 'active' | 'pending' | 'expired';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  check_in: string;
  check_out?: string;
}

export interface BlogPost {
  id: string;
  titulo: string;
  contenido: string;
  imagen: string;
  fecha: string;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: 'suplementos' | 'ropa';
}
