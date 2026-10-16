export type UserRole = "admin" | "user" | "viewer";

export interface User {
  _id?: string;
  name?: string;
  email: string;
  role?: UserRole;
  admin?: boolean;
  status?: number;
  date?: string | number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isLoading: boolean;
}

export interface SchemaField {
  tag?: string;
  type?: string;
  active?: boolean;
  text?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  ref?: string;
  autocomplete?: boolean;
  autofocus?: boolean;
  value?: any;
  options?: Array<string | { label: string; value: any }>;
}

export interface ResourceConfig {
  desc?: string;
  subtitle?: string;
  admin?: boolean;
  exclude?: boolean;
  param?: string;
  icon?: string;
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
