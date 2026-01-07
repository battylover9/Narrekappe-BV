import { decodeComment, getRealm, proxmoxDeleteUser, proxmoxListUsers } from '../../../lib/proxmoxApi';

export default async function handler(req, res) {
  try {
    // Avoid browser 304 caching for admin pages; always return fresh state.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'GET') {
      const realm = getRealm();
      const raw = await proxmoxListUsers();
      const users = raw
        .filter((u) => typeof u.userid === 'string' && u.userid.endsWith(`@${realm}`))
        .map((u) => {
          const { email, fullName } = decodeComment(u.comment);
          return {
            userid: u.userid,
            email: email || '',
            fullName: fullName || '',
            enabled: String(u.enable) !== '0',
          };
        })
        .sort((a, b) => (a.email || a.userid).localeCompare(b.email || b.userid));

      return res.status(200).json({ users });
    }

    if (req.method === 'DELETE') {
      const userid = String(req.body?.userid || '').trim();
      if (!userid) return res.status(400).json({ error: 'Missing userid' });
      const out = await proxmoxDeleteUser({ userid });
      return res.status(200).json({ ok: true, userid: out.userid });
    }

    res.setHeader('Allow', 'GET,DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}