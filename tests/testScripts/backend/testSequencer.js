const Sequencer = require('@jest/test-sequencer').default;

/**
 * Custom test sequencer for rate-limited API testing
 * Runs tests in a specific order to ensure proper setup and dependencies
 */
class RateLimitedSequencer extends Sequencer {
  /**
   * Define the priority order for test files
   * Lower number = runs first
   */
  getPriority(testPath) {
    const priorities = {
      'health.test.ts': 1,      // Basic connectivity check first
      'TS-001_Authentication.test.ts': 2,        // Authentication tests
      'TS-002_Accounts.test.ts': 3,    // Account management
      'TS-009_Categories.test.ts': 4,  // Category management
      'TS-003_Transactions.test.ts': 5, // Transactions (depends on accounts/categories)
      'TS-004_Budgets.test.ts': 6,     // Budgets
      'TS-005_Family.test.ts': 7,      // Family management
      'TS-006_Import.test.ts': 8,      // Import tests
      'TS-007_Reports.test.ts': 9,     // Reports
      'TS-008_Security.test.ts': 10,    // Security
    };

    for (const [name, priority] of Object.entries(priorities)) {
      if (testPath.includes(name)) {
        return priority;
      }
    }

    // Default priority for other tests
    return 100;
  }

  sort(tests) {
    // Sort by priority (ascending)
    return tests.sort((a, b) => {
      const priorityA = this.getPriority(a.path);
      const priorityB = this.getPriority(b.path);
      return priorityA - priorityB;
    });
  }
}

module.exports = RateLimitedSequencer;
