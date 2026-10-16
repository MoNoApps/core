import type { ObjectId } from "mongodb";

/**
 * Handle returned by mock TCP servers (MongoDB / Redis)
 */
export interface MockServerHandle {
  isMock: boolean;
  close: () => Promise<void>;
}

/**
 * Document interface used in live database integration CRUD tests
 */
export interface TestDoc {
  _id?: string | ObjectId;
  name: string;
  value: number;
  createdAt?: Date;
}

/**
 * Mock user representation for authentication and account integration suites
 */
export interface TestUser {
  _id: string;
  email: string;
  name?: string;
  admin?: boolean;
  password?: string | Record<string, unknown>;
}
