export interface Module {
  _id: string; // ObjectId as string
  friendlyId: string;
  icon: string;
  title: string;
  description: string;
  group?: string;
  locked?: boolean;
  company?: string; // ObjectId as string on frontend
  iconBgColor?: string;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  products?: Product[]; // Populated products for this module (like mongoose populate)
  fields: {
    shown: string[];
    hidden: string[];
  };
  isFirstTime?: boolean; // Whether this is the first time user is accessing this module
  singleScenario?: boolean; // If true, module is directly clickable without showing products
  disclaimer?: {
    title: string;
    subtitle?: string;
    disclaimer: string;
  } | null; // Disclaimer content, if exists
  scenarioId?: string;
}

export interface Product {
  _id: string; // ObjectId as string
  friendlyId: string;
  name: string;
  prompt: string;
  productType: 'own' | 'competitor';
  modules?: string[]; // Array of module friendlyIds - if empty/undefined, it's global
  company?: string; // Company ObjectId as string
  locked?: boolean;
  salesTarget: 'individual' | 'corporate';
  scenarioId?: string;
}

export interface ModulesResponse {
  modules: Module[]; // Modules with populated products
}

export interface ProductsResponse {
  products: Product[];
}
