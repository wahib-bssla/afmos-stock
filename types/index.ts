export type User = {
  id: string;
  username: string;
  role: 'ADMIN' | 'MODERATOR' | 'TECHNICIAN';
  created_at: string;
  password?: string;
};

export type Equipment = {
  id: string;
  name: string;
  ref?: string;
  price?: number;
  type: 'ANTI INTRUSION' | 
        'INCENDIES' | 
        'VIDEO SURVEILLANCE' | 
        'CONTROLE D\'ACCES' | 
        'LSB/ELS' | 
        'GESTION DE CLE' | 
        'CABLES/ACCESSOIRES';
  created_at: string;
  updated_at: string;
  clientId: string;  // Add this
  client?: {        // Optional if you want to include client details
    id: string;
    name: string;};
};

export type MovementType = 'ENTREE' | 'SORTIE';
export type EquipmentType = 'ANTI INTRUSION' | 'INCENDIES' | 'VIDEO SURVEILLANCE' | 
  "CONTROLE D'ACCES" | 'LSB/ELS' | 'GESTION DE CLE' | 'CABLES/ACCESSOIRES';

  interface Movement {
    id: string;
    equipment: {
      name: string;
      type: EquipmentType;
      client: {
        name: string,
      }
    };
    agence: string; // Added agence field
    type: MovementType;
    technician: {
      username: string;
    };
    quantity: number;
    created_at: string;
  }