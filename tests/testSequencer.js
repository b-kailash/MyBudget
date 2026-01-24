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
      'auth.test.ts': 2,        // Authentication tests
      'accounts.test.ts': 3,    // Account management
      'categories.test.ts': 4,  // Category management
      'transactions.test.ts': 5, // Transactions (depends on accounts/categories)
      'budgets.test.ts': 6,     // Budgets
      'family.test.ts': 7,      // Family management
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
