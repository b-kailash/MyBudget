import { delay } from './utils';

// This will run after each test file
afterEach(async () => {
  console.log('Pausing for 1 minute to respect rate limiting between test files...');
  await delay(60000); // 1 minute delay
});