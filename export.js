/**
 * MGarage — export.js
 * Full local backup export to JSON. No network involved.
 */

async function exportFullBackup() {
  const [cars, jobs, photos, settingsRaw] = await Promise.all([
    DB.getAll(DB.STORES.cars),
    DB.getAll(DB.STORES.jobs),
    DB.getAll(DB.STORES.photos),
    DB.getAll(DB.STORES.settings),
  ]);

  const payload = {
    app: 'MGarage',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { cars, jobs, photos, settings: settingsRaw },
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mgarage-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return payload;
}

window.exportFullBackup = exportFullBackup;
