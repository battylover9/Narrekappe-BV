import { proxmoxCreateUser, proxmoxListUsers, getRealm } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, fullName, email } = req.body;

  // Validation
  if (!username || !password || !fullName) {
    return res.status(400).json({ 
      error: 'Username, password, and full name are required' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters' 
    });
  }

  // Sanitize username (only letters and numbers)
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (cleanUsername.length < 3) {
    return res.status(400).json({ 
      error: 'Username must be at least 3 characters (letters/numbers only)' 
    });
  }

  try {
    console.log('[REGISTER] Registration attempt for:', cleanUsername);

    const realm = getRealm();
    const userid = `${cleanUsername}@${realm}`;

    // Check if user already exists
    const users = await proxmoxListUsers();
    const userExists = users.some(u => u.userid === userid);

    if (userExists) {
      console.log('[REGISTER] User already exists:', cleanUsername);
      return res.status(409).json({ 
        error: 'Username already taken. Please choose another.' 
      });
    }

    // Create the user
    await proxmoxCreateUser({
      userid,
      fullName,
      password,
      email: email || undefined
    });

    console.log('[REGISTER] User created successfully:', cleanUsername);

    return res.status(201).json({
      success: true,
      username: cleanUsername,
      message: 'Registration successful! You can now log in.'
    });

  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
}

