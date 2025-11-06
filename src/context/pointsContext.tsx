import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase, UserSettings } from '../lib/supabase';

interface PointsContextData {
  currentPoints: number;
  totalPointsEarned: number;
  userName: string;
  avatarUrl: string | null;
  loading: boolean;
  error: string | null;
  setPoints: (points: number) => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  subtractPoints: (points: number) => Promise<void>;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextData>({} as PointsContextData);

interface PointsProviderProps {
  children: ReactNode;
}

export function PointsProvider({ children }: PointsProviderProps) {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do usuário
  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      
      setUserSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do usuário';
      setError(errorMessage);
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Definir pontos manualmente (substitui o valor atual)
  const setPoints = async (points: number) => {
    if (!userSettings) {
      Alert.alert('Erro', 'Dados do usuário não carregados');
      return;
    }

    if (points < 0) {
      Alert.alert('Erro', 'Pontos não podem ser negativos');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ current_points: points })
        .eq('id', userSettings.id);

      if (error) throw error;

      // Atualizar estado local
      setUserSettings(prev => prev ? { ...prev, current_points: points } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar pontos';
      console.error('Erro ao definir pontos:', err);
      Alert.alert('Erro', errorMessage);
      throw err;
    }
  };

  // Adicionar pontos (incrementa o valor atual)
  const addPoints = async (points: number) => {
    if (!userSettings) {
      Alert.alert('Erro', 'Dados do usuário não carregados');
      return;
    }

    if (points <= 0) {
      Alert.alert('Erro', 'Valor de pontos deve ser positivo');
      return;
    }

    try {
      const newCurrentPoints = userSettings.current_points + points;
      const newTotalPoints = userSettings.total_points_earned + points;

      const { error } = await supabase
        .from('user_settings')
        .update({ 
          current_points: newCurrentPoints,
          total_points_earned: newTotalPoints
        })
        .eq('id', userSettings.id);

      if (error) throw error;

      // Atualizar estado local
      setUserSettings(prev => prev ? {
        ...prev,
        current_points: newCurrentPoints,
        total_points_earned: newTotalPoints
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar pontos';
      console.error('Erro ao adicionar pontos:', err);
      Alert.alert('Erro', errorMessage);
      throw err;
    }
  };

  // Subtrair pontos (decrementa o valor atual)
  const subtractPoints = async (points: number) => {
    if (!userSettings) {
      Alert.alert('Erro', 'Dados do usuário não carregados');
      return;
    }

    if (points <= 0) {
      Alert.alert('Erro', 'Valor de pontos deve ser positivo');
      return;
    }

    if (userSettings.current_points < points) {
      Alert.alert('Erro', 'Pontos insuficientes');
      throw new Error('Pontos insuficientes');
    }

    try {
      const newCurrentPoints = userSettings.current_points - points;

      const { error } = await supabase
        .from('user_settings')
        .update({ current_points: newCurrentPoints })
        .eq('id', userSettings.id);

      if (error) throw error;

      // Atualizar estado local
      setUserSettings(prev => prev ? {
        ...prev,
        current_points: newCurrentPoints
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao subtrair pontos';
      console.error('Erro ao subtrair pontos:', err);
      Alert.alert('Erro', errorMessage);
      throw err;
    }
  };

  // Recarregar pontos do banco
  const refreshPoints = async () => {
    await fetchUserSettings();
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchUserSettings();

    // Subscription para updates em tempo real
    const subscription = supabase
      .channel('user_settings_changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'user_settings' 
        },
        (payload) => {
          console.log('Pontos atualizados em tempo real:', payload.new);
          setUserSettings(payload.new as UserSettings);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PointsContext.Provider
      value={{
        currentPoints: userSettings?.current_points || 0,
        totalPointsEarned: userSettings?.total_points_earned || 0,
        userName: userSettings?.name || '',
        avatarUrl: userSettings?.avatar_url || null,
        loading,
        error,
        setPoints,
        addPoints,
        subtractPoints,
        refreshPoints,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);

  if (!context) {
    throw new Error('usePoints deve ser usado dentro de um PointsProvider');
  }

  return context;
}