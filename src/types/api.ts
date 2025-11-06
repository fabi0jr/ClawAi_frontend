export interface Detection {
    id: string;
    timestamp: string; // O TypeORM retorna como string ISO 8601
    type: string;
    category: 'A' | 'B' | 'C';
    confidence: number;
    status: string;
  }
  
  // Novo tipo para nossos Stats
  export interface DashboardStats {
    itemSeparation: {
      categoryA: number;
      categoryB: number;
      categoryC: number;
      unclassified: number;
    };
    performance: {
      classificationRate: number;
      processingSpeed: number;
    };
    systemStatus: {
      aiModel: string;
      cameraFeed: string;
      dataStorage: number;
    };
  }

  export interface TrainingSession {
    id: string;
    name: string;
    status: 'processing' | 'complete' | 'failed';
    createdAt: string; // TypeORM envia como string ISO
    updatedAt: string;
   }


   export interface Annotation {
        id: string;
        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
   }

    // Espelha a entidade TrainingImage do backend
    export interface TrainingImage {
    id: string;
    filename: string;
    storagePath: string; // Ex: "uploads/123-nome.png"
    session: TrainingSession;
    }