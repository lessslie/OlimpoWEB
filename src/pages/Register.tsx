import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    setPasswordError('');
    setLoading(true);

    try {
      console.log('Intentando registrar usuario:', formData.email);
      
      // 1. Registrar usuario en Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone
          }
        }
      });

      if (authError) {
        console.error('Error de registro:', authError);
        
        // Manejo específico para usuario ya registrado
        if (authError.message.includes('User already registered')) {
          toast.error('Este email ya está registrado. Por favor inicia sesión o usa otro email.');
          return;
        }
        
        throw authError;
      }

      console.log('Usuario registrado:', data);

      if (data && data.user) {
        try {
          // Verificamos si el perfil fue creado por el trigger
          const { data: profileCheck, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user?.id || '');
            
          console.log('Verificación de perfil:', profileCheck, checkError);
          
          // Si no existe el perfil (el trigger no funcionó), lo creamos manualmente
          if (checkError || !profileCheck || profileCheck.length === 0) {
            console.log('Creando perfil manualmente para:', data.user?.id);
            
            if (data.user?.id) {
              // 2. Crear perfil en la base de datos
              const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: data.user.id,
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    is_admin: false
                  }
                ]);

              if (profileError) {
                console.error('Error al crear perfil:', profileError);
                throw profileError;
              }
            }
          } else {
            // Si el perfil ya existe (creado por el trigger), lo actualizamos
            console.log('Actualizando perfil creado por trigger');
            if (data.user?.id) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  first_name: formData.first_name,
                  last_name: formData.last_name,
                  phone: formData.phone
                })
                .eq('id', data.user.id);
                
              if (updateError) {
                console.error('Error al actualizar perfil:', updateError);
                throw updateError;
              }
            }
          }
          
          // Cerrar sesión para que el usuario tenga que iniciar sesión manualmente
          await supabase.auth.signOut();
          
          toast.success('¡Registro exitoso! Por favor, inicia sesión.');
          navigate('/login');
        } catch (error) {
          console.error('Error en el proceso de registro:', error);
          toast.error('Error al completar el registro');
        }
      }
    } catch (error) {
      console.error('Error general:', error);
      toast.error('Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear una cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-gray-700 hover:text-gray-900">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="first_name" className="sr-only">
                Nombre
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Nombre"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="last_name" className="sr-only">
                Apellido
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Apellido"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formData.confirmPassword && e.target.value !== formData.confirmPassword) {
                    setPasswordError('Las contraseñas no coinciden');
                  } else {
                    setPasswordError('');
                  }
                }}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (formData.password !== e.target.value) {
                    setPasswordError('Las contraseñas no coinciden');
                  } else {
                    setPasswordError('');
                  }
                }}
              />
            </div>
          </div>

          {passwordError && (
            <div className="text-red-500 text-sm text-center">{passwordError}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
