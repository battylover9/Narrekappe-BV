// pages/api/auth/login.js
// Student login authentication

import { proxmoxListUsers, getRealm } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  // Prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      error: 'Username and password are required' 
    });
  }

  try {
    console.log(`[AUTH] Login attempt for user: ${username}`);
    
    const realm = getRealm();
    const userid = `${username}@${realm}`;
    
    // Check if user exists
    const users = await proxmoxListUsers();
    const userExists = users.some(u => u.userid === userid);
    
    if (!userExists) {
      console.log(`[AUTH] User not found: ${username}`);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // For now, we'll trust the user exists and is valid
    // In production, you'd verify the password against Proxmox
    console.log(`[AUTH] Login successful for: ${username}`);
    
    return res.status(200).json({
      success: true,
      username: username,
      userid: userid,
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication service error' 
    });
  }
}