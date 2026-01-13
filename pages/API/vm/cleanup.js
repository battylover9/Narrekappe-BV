import { cleanupExpiredVMs } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authToken = req.headers['x-cleanup-token'] || req.query.token;
  const expectedToken = process.env.CLEANUP_TOKEN || 'change-me-in-production';

  if (authToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[CLEANUP] Starting automated VM cleanup');
    const result = await cleanupExpiredVMs();
    
    console.log('[CLEANUP] Cleanup completed', result);
    return res.status(200).json({
      success: true,
      message: `Cleaned up ${result.cleanedCount} expired VM(s)`,
      cleanedCount: result.cleanedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CLEANUP ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      details: error.message
    });
  }
}
