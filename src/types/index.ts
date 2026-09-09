import type { ObjectId } from "mongodb";

export interface User {
  _id?: string | ObjectId;
  name?: string;
  email: string;
  password?: string | { type: string; value: string };
  token?: string;
  admin?: boolean;
  status?: number;
  createdAt?: Date | number;
  updatedAt?: Date | number;
  [key: string]: unknown;
}

export interface AuthToken {
  _id?: string | ObjectId;
  user: string | ObjectId;
  expires: number;
  createdAt?: Date | number;
  [key: string]: unknown;
}

export interface ResourceConfig {
  admin?: boolean;
  param?: string;
  clean?: Record<string, number | boolean>;
  exclude?: boolean;
  schema?: Record<string, boolean | number>;
  [key: string]: unknown;
}

export interface CoreConfig {
  dburl: string;
  site: string;
  theme?: string;
  port: {
    web: number;
    api: number;
    rds?: number;
  };
  mail?: {
    from: string;
    name: string;
  };
  guest?: {
    email: string;
    text: string;
    status: number;
    admin: boolean;
    enabled: boolean;
  };
  autoform?: boolean;
  INDEX?: string;
  ALLOW?: string[];
  TTL?: number;
  URL?: {
    BASE: string;
    ACK: string;
    REC?: string;
  };
  APIVARS?: {
    PRE: string;
    ID: string;
    PLUGINS: {
      DIR: string;
      MAIN: string;
      VIEWS: string;
      CONFIG: string;
    };
  };
  plugins?: string[];
  pages?: string[];
  resources: Record<string, ResourceConfig>;
}
