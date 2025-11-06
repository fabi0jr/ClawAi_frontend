import axios from 'axios';
import { type TrainingSession } from '@/types/api'; // Importe o novo tipo

// Define a URL base da sua API NestJS
export const apiClient = axios.create({
  baseURL: 'http://localhost:3001', // A porta que definimos no main.ts
});

// --- NOVAS FUNÇÕES ADICIONADAS ---

/**
 * Busca as sessões de treinamento recentes.
 */
export const getRecentSessions = async (): Promise<TrainingSession[]> => {
  const { data } = await apiClient.get('/training/sessions/recent');
  return data;
};

/**
 * Cria uma nova sessão de treinamento.
 */
export const createSession = async (dto: {
  name: string;
}): Promise<TrainingSession> => {
  const { data } = await apiClient.post('/training/sessions', dto);
  return data;
};

/**
 * Faz upload de um arquivo para uma sessão específica.
 */
export const uploadTrainingFile = async (vars: {
  file: File;
  sessionId: string;
}) => {
  const formData = new FormData();
  formData.append('file', vars.file);
  formData.append('sessionId', vars.sessionId);

  const { data } = await apiClient.post('/training/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};