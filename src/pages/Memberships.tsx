import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MembershipCard from '../components/MembershipCard';
import { Membership } from '../types';
import { supabase } from '../services/supabase';

const memberships: Membership[] = [
  {
    id: 'musculacion',
    name: 'Musculación',
    price: 15000,
    description: 'Acceso completo a la sala de musculación',
    features: [
      'Acceso ilimitado a la sala',
      'Rutina personalizada',
      'Seguimiento mensual',
      'Acceso a vestuarios',
      'Casillero personal'
    ]
  },
  {
    id: 'kickboxing-2',
    name: 'Kickboxing 2 días',
    price: 12000,
    description: 'Clases de kickboxing 2 veces por semana',
    features: [
      '2 clases semanales',
      'Equipamiento incluido',
      'Instructor profesional',
      'Acceso a vestuarios',
      'Casillero personal'
    ]
  },
  {
    id: 'kickboxing-3',
    name: 'Kickboxing 3 días',
    price: 18000,
    description: 'Clases de kickboxing 3 veces por semana',
    features: [
      '3 clases semanales',
      'Equipamiento incluido',
      'Instructor profesional',
      'Acceso a vestuarios',
      'Casillero personal'
    ]
  },
  {
    id: 'personal',
    name: 'Personal Trainer',
    price: 25000,
    description: 'Entrenamiento personalizado',
    features: [
      'Entrenador exclusivo',
      'Plan personalizado',
      'Seguimiento semanal',
      'Acceso a vestuarios',
      'Casillero personal',
      'Acceso ilimitado a la sala'
    ]
  }
];

const Memberships = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleMembershipSelect = async (membership: Membership) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Debes iniciar sesión para seleccionar un plan');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('memberships')
        .insert([
          {
            user_id: user.id,
            membership_id: membership.id,
            status: 'pending',
            price: membership.price
          }
        ]);

      if (error) throw error;

      toast.success('Plan seleccionado correctamente');
      navigate('/profile');
    } catch (error) {
      toast.error('Error al seleccionar el plan');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planes y Membresías
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Elige el plan que mejor se adapte a tus objetivos
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-4 md:grid-cols-2">
          {memberships.map((membership, index) => (
            <MembershipCard
              key={membership.id}
              membership={membership}
              isPopular={index === 0}
              onSelect={handleMembershipSelect}
            />
          ))}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Memberships;
