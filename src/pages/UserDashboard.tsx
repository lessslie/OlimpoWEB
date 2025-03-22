import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, UserMembership, Attendance } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (isAdmin) {
        navigate('/admin');
      } else {
        loadUserData();
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const loadUserData = async () => {
    try {
      // Cargar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Cargar membresía activa
      const { data: membershipData } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipData) setMembership(membershipData);

      // Cargar últimas asistencias
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('check_in', { ascending: false })
        .limit(5);

      if (attendanceData) setRecentAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Nombre:</span> {profile?.full_name || 'No especificado'}</p>
            <p><span className="font-medium">Teléfono:</span> {profile?.phone || 'No especificado'}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Membresía</h2>
            <p>
              <span className="font-medium">Estado:</span>{' '}
              <span className={`px-2 py-1 rounded text-sm ${
                membership?.status === 'active' ? 'bg-green-100 text-green-800' :
                membership?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                membership?.status === 'expired' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {membership?.status ? 
                  membership.status.charAt(0).toUpperCase() + membership.status.slice(1) :
                  'Sin membresía'
                }
              </span>
            </p>
            <p><span className="font-medium">Tipo:</span> {
              membership?.type ?
                membership.type.charAt(0).toUpperCase() + membership.type.slice(1) :
                'No especificado'
            }</p>
            <p><span className="font-medium">Vencimiento:</span> {
              membership?.expiry_date ?
                format(new Date(membership.expiry_date), 'PPP', { locale: es }) :
                'No especificado'
            }</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
