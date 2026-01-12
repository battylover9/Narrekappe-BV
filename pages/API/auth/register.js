import { execSSH } from '../../../lib/proxmoxApi';

function sanitizeInput(input, type = 'alphanumeric') {
  const patterns = {
    alphanumeric: /^[a-zA-Z0-9_-]+$/,
    name: /^[a-zA-Z]{2,50}$/,
    username: /^[a-z][a-z0-9_-]{2,31}$/,
  };

  if (!patterns[type].test(input)) {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, password } = req.body;

    // Validate inputs
    if (!firstName || !lastName || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!sanitizeInput(firstName, 'name') || !sanitizeInput(lastName, 'name')) {
      return res.status(400).json({ error: 'Invalid name format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Generate username: first letter + last name
    const username = (firstName[0] + lastName).toLowerCase();

    if (!sanitizeInput(username, 'username')) {
      return res.status(400).json({ error: 'Generated username invalid' });
    }

    // Check if user already exists
    const existingUsers = await execSSH('pveum user list');
    const userExists = existingUsers.includes(`${username}@pve`);

    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create Proxmox user
    const createUserCmd = `pveum user add ${username}@pve --password "${password}" --firstname "${firstName}" --lastname "${lastName}"`;
    await execSSH(createUserCmd);

    return res.status(200).json({
      success: true,
      username,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
