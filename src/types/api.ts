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