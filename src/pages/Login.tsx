import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Intentando iniciar sesión con:', formData.email);
      
      // Intentar iniciar sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        console.error('Error de autenticación:', error);
        throw error;
      }

      console.log('Sesión iniciada correctamente:', data);

      if (data.user) {
        toast.success('¡Inicio de sesión exitoso!');
        
        // Esperar un momento para que el contexto de autenticación se actualice
        setTimeout(async () => {
          try {
            // Verificar si el perfil existe
            const { data: profileCheck, error: checkError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', data.user.id);
              
            console.log('Verificación de perfil:', profileCheck, checkError);
            
            // Si no existe el perfil, crearlo
            if (checkError || !profileCheck || profileCheck.length === 0) {
              console.log('Creando perfil para el usuario:', data.user.id);
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  first_name: '',
                  last_name: '',
                  is_admin: false
                });
                
              if (insertError) {
                console.error('Error al crear perfil:', insertError);
              }
            }
            
            // Verificar si el usuario es admin
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', data.user.id)
              .single();

            console.log('Perfil obtenido:', profile, profileError);

            // Redirigir según el rol
            if (profile?.is_admin) {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          } catch (profileCheckError) {
            console.error('Error verificando perfil:', profileCheckError);
            navigate('/dashboard');
          }
        }, 1000); // Esperar 1 segundo
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      toast.error('Credenciales de inicio de sesión inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
