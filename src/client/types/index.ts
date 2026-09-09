export interface User {
  _id?: string;
  name?: string;
  email: string;
  role?: string;
  admin?: boolean;
  status?: number;
  date?: string | number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export interface SchemaField {
  tag?: "input" | "select" | "textarea" | "image";
  type?: string;
  active?: boolean;
  text?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  autocomplete?: boolean;
  autofocus?: boolean;
  value?: any;
  options?: Array<{ label: string; value: any }>;
}

export interface ResourceConfig {
  desc?: string;
  admin?: boolean;
  exclude?: boolean;
  param?: string;
  clean?: Record<string, number>;
  schema?: Record<string, SchemaField | number>;
}

export interface AppConfig {
  site?: string;
  theme?: string;
  port?: {
    web?: number;
    api?: number;
    rds?: number;
  };
  resources?: Record<string, ResourceConfig>;
  pages?: string[];
  guest?: {
    email: string;
    text: string;
    status: number;
    admin: boolean;
    enabled: boolean;
  };
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  user?: User;
  count?: number;
}
