/**
 * MSW server for Node.js environment (tests)
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Mock server for testing
 */
export const server = setupServer(...handlers);
