// pages/api/vm/deploy.js
// Deploy VMs with improved security and rate limiting

import { deployVM, sanitizeInput } from '../../../lib/proxmoxApi';
import { withRateLimit } from '../../../lib/rateLimit';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vmName, userName } = req.body;

  // Validate required fields
  if (!vmName || !userName) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'vmName and userName are required' 
    });
  }

  try {
    // Sanitize inputs
    const sanitizedVmName = sanitizeInput(vmName, 'alphanumeric');
    const sanitizedUserName = sanitizeInput(userName, 'username');

    if (!sanitizedVmName || !sanitizedUserName) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: 'vmName or userName contains invalid characters' 
      });
    }

    console.log(`[DEPLOY] User ${sanitizedUserName} requesting ${sanitizedVmName}`);

    // Deploy VM using improved library function
    const result = await deployVM({
      vmName: sanitizedVmName,
      username: sanitizedUserName,
      memory: 2048,
      cores: 2
    });

    console.log(`[DEPLOY] VM ${result.vmid} deployed successfully`);

    return res.status(200).json({
      success: true,
      vmId: result.vmid,
      vmName: result.name,
      ipAddress: result.ipAddress,
      message: 'VM deployed successfully! Wait 1-2 minutes for full boot.',
      expiresAt: result.expiresAt,
      startTime: result.startTime
    });

  } catch (error) {
    console.error('[DEPLOY ERROR]', error.message);
    
    // Return appropriate error status
    const statusCode = error.message.includes('already have') ? 400 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('Insufficient') ? 507 : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: 'Failed to deploy VM',
      details: error.message
    });
  }
}

// Export with rate limiting: max 3 deployments per minute per user
export default withRateLimit(handler, {
  windowMs: 60 * 1000,
  maxRequests: 3,
  keyGenerator: (req) => req.body.userName || 'anonymous'
});
