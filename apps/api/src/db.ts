import { Pool } from 'pg';
import { databaseConfig } from './config.js';
export const db = new Pool(databaseConfig());
