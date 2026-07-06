import logger from '../config/logger.js';

// Mock database tables
const MOCK_USERS = [
  { id: 1, username: 'neo', email: 'neo@matrix.local', role: 'user', secret_flag: 'FLAG{FOLLOW_THE_WHITE_RABBIT}' },
  { id: 2, username: 'trinity', email: 'trinity@matrix.local', role: 'user', secret_flag: 'FLAG{KICK_ASS}' },
  { id: 3, username: 'morpheus', email: 'morpheus@matrix.local', role: 'user', secret_flag: 'FLAG{FREE_YOUR_MIND}' },
  { id: 4, username: 'agent_smith', email: 'smith@matrix.local', role: 'admin', secret_flag: 'FLAG{WADPS_SQLI_BYPASS_SUCCESS}' }
];

/**
 * Parses and evaluates a simulated SQL injection search query.
 * @param {string} rawInput 
 * @returns {object} { queryStr, results }
 */
const runSimulatedSQLQuery = (rawInput) => {
  const usernameInput = rawInput || '';
  // 1. Build the vulnerable query string showing concatenation
  const queryStr = `SELECT id, username, email, role, secret_flag FROM users WHERE username = '${usernameInput}';`;

  // 2. Evaluate query logic (simulate SQL parsing/behavior)
  // Strip trailing SQL comments for clean parsing
  const cleanInput = usernameInput.split('--')[0].split('#')[0].trim();

  // Case A: Tautology injection (e.g. ' OR '1'='1, ' OR 1=1)
  const isTautology = /'\s*or\s*('[0-9a-zA-Z]+'|[0-9]+)\s*=\s*('[0-9a-zA-Z]+'|[0-9]+)/i.test(cleanInput) || 
                      /\b(or|and)\b\s+[\d'=]+\s*=\s*[\d'=]+/i.test(cleanInput);

  if (isTautology) {
    logger.info(`[SQLi MACHINE] Tautology detected. Leaking all user records.`);
    return {
      queryStr,
      results: MOCK_USERS
    };
  }

  // Case B: UNION SELECT query
  const unionMatch = cleanInput.match(/union\s+(all\s+)?select\s+(.+)/i);
  if (unionMatch) {
    const columnsStr = unionMatch[2].toLowerCase();
    logger.info(`[SQLi MACHINE] UNION SELECT exploit detected. Exfiltrating sensitive columns.`);
    
    // Build union select results
    // Let's return mock rows that fit the columns request.
    // If user asked for username, password, email, etc., we can populate them
    const unionRows = [
      { id: 999, username: 'SYSTEM_DUMP', email: 'dump@db.internal', role: 'SUPER_ADMIN', secret_flag: 'FLAG{UNION_INJECTION_EXPLOIT_COMPLETE}' },
      { id: 1000, username: 'agent_smith', email: 'smith@matrix.local', role: 'admin', secret_flag: 'FLAG{WADPS_SQLI_BYPASS_SUCCESS}' }
    ];
    return {
      queryStr,
      results: [...MOCK_USERS, ...unionRows]
    };
  }

  // Case C: Single record bypass (e.g. admin' or username = 'agent_smith')
  if (cleanInput.toLowerCase().startsWith("agent_smith") || cleanInput.toLowerCase().includes("or username")) {
    const match = MOCK_USERS.find(u => u.username === 'agent_smith');
    return {
      queryStr,
      results: match ? [match] : []
    };
  }

  // Case D: Standard literal search
  const foundUser = MOCK_USERS.find(u => u.username.toLowerCase() === cleanInput.toLowerCase());
  return {
    queryStr,
    results: foundUser ? [foundUser] : []
  };
};

/**
 * Handles the SQL injection machine search request
 * @route POST /api/sqli-machine/search
 */
export const searchUsers = async (req, res) => {
  try {
    const { username, secured } = req.body;
    
    const isSecured = secured === true || secured === 'true';

    if (isSecured) {
      // Safe Parameterized Query Execution (Simulation)
      // The input is bound as a parameter: query parameter '?'
      const queryStr = `SELECT id, username, email, role, secret_flag FROM users WHERE username = ?; [Parameters: "${username || ''}"]`;
      
      // Since it's parameterized, the input is strictly matched against the username column as a literal string.
      // SQL injection payloads will never match a literal username.
      const usernameParam = username || '';
      const foundUser = MOCK_USERS.find(u => u.username.toLowerCase() === usernameParam.toLowerCase());
      const results = foundUser ? [foundUser] : [];

      logger.info(`[SQLi MACHINE - SECURE] Executed parameterized query. Output size: ${results.length}`);

      return res.status(200).json({
        secured: true,
        queryStr,
        results,
        message: 'Query executed securely using Parameterized Statements (Prepared Statement). SQL Injection prevented.'
      });
    } else {
      // Insecure Vulnerable Query Execution (Simulation)
      const { queryStr, results } = runSimulatedSQLQuery(username);

      logger.warn(`[SQLi MACHINE - INSECURE] Executed concatenated query. Output size: ${results.length}`);

      return res.status(200).json({
        secured: false,
        queryStr,
        results,
        message: 'Query executed using String Concatenation. SQL Injection successful.'
      });
    }
  } catch (err) {
    logger.error(`SQLi Controller Error: ${err.message}`);
    res.status(500).json({ error: 'Database query execution failure' });
  }
};
