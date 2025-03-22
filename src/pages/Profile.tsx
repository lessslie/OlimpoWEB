import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Perfil actualizado correctamente');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">No se encontró el perfil</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 py-6 px-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Mi Perfil</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
              >
                {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Membership Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de membresía</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="text-gray-900">
                      {profile.membership_status === 'active' ? (
                        <span className="text-green-600">Activa</span>
                      ) : profile.membership_status === 'pending' ? (
                        <span className="text-yellow-600">Pendiente</span>
                      ) : (
                        <span className="text-red-600">Inactiva</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="text-gray-900 capitalize">{profile.membership_type || 'No definido'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inicio</p>
                    <p className="text-gray-900">{profile.membership_start || 'No definido'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vencimiento</p>
                    <p className="text-gray-900">{profile.membership_end || 'No definido'}</p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información personal</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={profile.full_name || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profile.email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profile.phone || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
                      Contacto de emergencia
                    </label>
                    <input
                      type="text"
                      id="emergency_contact"
                      name="emergency_contact"
                      value={profile.emergency_contact || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      id="birth_date"
                      name="birth_date"
                      value={profile.birth_date || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {editing && (
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Guardar cambios
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
