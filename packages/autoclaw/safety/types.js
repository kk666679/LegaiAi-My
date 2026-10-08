/**
 * .autoclaw/safety/types.js
 * Type definitions for safety subsystem (August 2026 standards)
 */

/**
 * @typedef {Object} SafetyCheck
 * @property {boolean} allowed - Whether action is allowed
 * @property {string} [reason] - Reason for denial
 * @property {string} [guard] - Which guard denied
 * @property {Array} [results] - All guard results
 * @property {boolean} [requiresApproval] - Needs human approval
 */

/**
 * @typedef {Object} GuardResult
 * @property {string} guard - Guard name
 * @property {boolean} allowed - Whether allowed
 * @property {string} [reason] - Reason for decision
 * @property {boolean} [requiresApproval] - Needs approval
 * @property {*} [data] - Guard-specific data
 */

/**
 * @typedef {Object} ApprovalRequest
 * @property {string} id - Request ID
 * @property {string} action - Action being approved
 * @property {string} target - Target of action
 * @property {Object} params - Action parameters
 * @property {Object} actor - Requesting actor
 * @property {number} requestedAt - Timestamp
 * @property {number} expiresAt - Expiration time
 * @property {'pending' | 'approved' | 'rejected'} status
 */

/**
 * @typedef {Object} KillSwitchState
 * @property {boolean} active - Is kill switch active
 * @property {'global' | 'agent:id' | 'tool:name'} scope - Scope of kill switch
 * @property {string} reason - Why activated
 * @property {number} activatedAt - Timestamp
 * @property {string} activatedBy - Actor ID
 */

/**
 * @typedef {Object} SafetyAuditEntry
 * @property {string} id - Entry ID
 * @property {string} action - Action attempted
 * @property {string} target - Target of action
 * @property {'allowed' | 'denied' | 'pending'} verdict
 * @property {string} [guard] - Which guard made decision
 * @property {Object} [params] - Action parameters (sanitized)
 * @property {Object} [actor] - Who initiated
 * @property {number} timestamp
 */

;
