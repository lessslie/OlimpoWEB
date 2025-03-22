import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Estado de autenticación cambiado:', session);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      console.log('Verificando usuario actual...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Usuario actual:', authUser);
      if (authUser) {
        await loadUserProfile(authUser.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Cargando perfil para usuario:', userId);
      
      // Primero verificamos si el perfil existe
      const { data: profileExists, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId);

      console.log('Verificación de perfil:', profileExists, checkError);

      if (checkError) {
        console.error('Error checking profile existence:', checkError);
        return;
      }

      // Si el perfil no existe, lo creamos
      if (!profileExists || profileExists.length === 0) {
        console.log('Perfil no encontrado, creando uno nuevo...');
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) {
          console.error('No se pudo obtener el usuario autenticado');
          return;
        }

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: authUser.user.email,
            first_name: '',
            last_name: '',
            is_admin: false
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }
        
        console.log('Perfil creado exitosamente');
      }

      // Ahora cargamos el perfil
      console.log('Obteniendo datos del perfil...');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Datos del perfil obtenidos:', profile, error);

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        // Adaptamos el perfil al formato UserProfile
        const userProfile: UserProfile = {
          id: profile.id,
          email: profile.email,
          full_name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : undefined,
          phone: profile.phone,
          is_admin: profile.is_admin || false,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
        
        console.log('Perfil adaptado:', userProfile);
        setUser(userProfile);
        setIsAdmin(profile.is_admin || false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Cerrando sesión...');
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      console.log('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
