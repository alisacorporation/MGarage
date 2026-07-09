/**
 * MGarage — import.js
 * Full local restore from a previously exported JSON backup.
 */

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function importFullBackup(file, { replace = true } = {}) {
  const text = await readFileAsText(file);
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (e) {
    throw new Error('Файл повреждён или не является резервной копией MGarage.');
  }

  if (!payload || !payload.data || payload.app !== 'MGarage') {
    throw new Error('Это не файл резервной копии MGarage.');
  }

  const { cars = [], jobs = [], photos = [], settings = [] } = payload.data;

  if (replace) {
    await DB.wipeAll();
  }

  for (const car of cars) await DB.put(DB.STORES.cars, car);
  for (const job of jobs) await DB.put(DB.STORES.jobs, job);
  for (const photo of photos) await DB.put(DB.STORES.photos, photo);
  for (const s of settings) await DB.put(DB.STORES.settings, s);

  return {
    cars: cars.length,
    jobs: jobs.length,
    photos: photos.length,
  };
}

window.importFullBackup = importFullBackup;
