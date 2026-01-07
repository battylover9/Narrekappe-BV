import { proxmoxCreateUser, proxmoxListUsers } from '../../../lib/proxmoxApi';

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { header: [], rows: [] };

  const header = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = cols[i] ?? '';
    });
    return obj;
  });

  return { header, rows };
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

function buildBaseUsername(firstName, lastName) {
  const f = normalize(firstName);
  const l = normalize(lastName);
  if (!f || !l) return '';
  return `${f[0]}${l}`; // optie 2
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const csv = String(req.body?.csv || '');
    const { header, rows } = parseCsv(csv);

    const required = ['first_name', 'last_name', 'password'];
    for (const r of required) {
      if (!header.includes(r)) {
        return res.status(400).json({ error: `CSV missing column: ${r}` });
      }
    }

    const realm = process.env.PROXMOX_REALM || 'pve';

    // bestaande users ophalen voor duplicate check
    const existingUsers = await proxmoxListUsers();
    const existingIds = new Set(existingUsers.map((u) => u.userid));

    const results = [];

    for (const row of rows) {
      const firstName = row.first_name;
      const lastName = row.last_name;
      const password = String(row.password || '').trim();

      if (!firstName || !lastName) {
        results.push({ ok: false, error: 'Missing first_name or last_name' });
        continue;
      }

      if (!password || password.length < 8) {
        results.push({
          ok: false,
          error: 'Password must be at least 8 characters',
        });
        continue;
      }

      let base = buildBaseUsername(firstName, lastName);
      if (!base) {
        results.push({ ok: false, error: 'Invalid name values' });
        continue;
      }

      let username = base;
      let counter = 1;
      while (existingIds.has(`${username}@${realm}`)) {
        username = `${base}${counter++}`;
      }

      const userid = `${username}@${realm}`;
      const fullName = `${firstName} ${lastName}`;

      try {
        await proxmoxCreateUser({
          userid,
          fullName,
          password,
        });
        existingIds.add(userid);
        results.push({ ok: true, userid, fullName });
      } catch (e) {
        results.push({
          ok: false,
          userid,
          error: String(e?.message || e),
        });
      }
    }

    const success = results.filter((r) => r.ok).length;
    const failed = results.length - success;

    console.log(
      '[proxmox/import-users] total=%d success=%d failed=%d',
      results.length,
      success,
      failed
    );

    return res.status(200).json({
      total: results.length,
      success,
      failed,
      results,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}