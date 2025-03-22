import { useState } from 'react';
import { supabase } from '../services/supabase';

const TestAuth = () => {
  const [output, setOutput] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const appendOutput = (text: string) => {
    setOutput(prev => prev + '\n' + text);
  };

  const checkAuth = async () => {
    try {
      appendOutput('Verificando sesión actual...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        appendOutput(`Error al obtener usuario: ${error.message}`);
      } else if (user) {
        appendOutput(`Usuario autenticado: ${user.email} (${user.id})`);
        
        // Verificar si existe el perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          appendOutput(`Error al obtener perfil: ${profileError.message}`);
        } else if (profile) {
          appendOutput(`Perfil encontrado: ${JSON.stringify(profile)}`);
        } else {
          appendOutput('No se encontró perfil para este usuario');
        }
      } else {
        appendOutput('No hay usuario autenticado');
      }
    } catch (e) {
      appendOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const testLogin = async () => {
    try {
      appendOutput(`Intentando iniciar sesión con: ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        appendOutput(`Error de inicio de sesión: ${error.message}`);
      } else if (data.user) {
        appendOutput(`Inicio de sesión exitoso: ${data.user.email} (${data.user.id})`);
        appendOutput(`Token de sesión: ${data.session?.access_token.substring(0, 10)}...`);
        
        // Verificar si existe el perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          appendOutput(`Error al obtener perfil: ${profileError.message}`);
          
          // Intentar crear el perfil
          appendOutput('Intentando crear perfil...');
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
            appendOutput(`Error al crear perfil: ${insertError.message}`);
          } else {
            appendOutput('Perfil creado exitosamente');
          }
        } else if (profile) {
          appendOutput(`Perfil encontrado: ${JSON.stringify(profile)}`);
        } else {
          appendOutput('No se encontró perfil para este usuario');
        }
      } else {
        appendOutput('Inicio de sesión fallido: no se recibió usuario');
      }
    } catch (e) {
      appendOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const testSignOut = async () => {
    try {
      appendOutput('Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        appendOutput(`Error al cerrar sesión: ${error.message}`);
      } else {
        appendOutput('Sesión cerrada exitosamente');
      }
    } catch (e) {
      appendOutput(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Prueba de Autenticación</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Verificar estado actual</h2>
        <button 
          onClick={checkAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Verificar autenticación
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Probar inicio de sesión</h2>
        <div className="flex flex-col space-y-2 mb-2">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 border rounded"
          />
        </div>
        <button 
          onClick={testLogin}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Iniciar sesión
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cerrar sesión</h2>
        <button 
          onClick={testSignOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Resultados:</h2>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap h-80 overflow-y-auto">
          {output || 'No hay resultados aún'}
        </pre>
      </div>
    </div>
  );
};

export default TestAuth;
