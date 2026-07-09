/**
 * MGarage — search.js
 * Real-time search & filtering over jobs.
 */

function normalizeStr(s) {
  return (s || '').toString().toLowerCase().trim();
}

function searchJobs(jobs, query) {
  const q = normalizeStr(query);
  if (!q) return jobs;
  return jobs.filter((job) => {
    const haystack = [
      job.brand, job.model, job.generation, job.body,
      job.vin, job.plate, job.client, job.phone, job.description, job.date,
    ].map(normalizeStr).join(' | ');
    return haystack.includes(q);
  });
}

function filterJobsByField(jobs, field, value) {
  if (!value) return jobs;
  const v = normalizeStr(value);
  return jobs.filter((job) => normalizeStr(job[field]) === v);
}

function filterJobsByDateRange(jobs, from, to) {
  return jobs.filter((job) => {
    const d = job.date;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

function sortJobsByDateDesc(jobs) {
  return [...jobs].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));
}

function uniqueValues(jobs, field) {
  const set = new Set();
  jobs.forEach((j) => { if (j[field]) set.add(j[field]); });
  return Array.from(set).sort();
}

window.Search = {
  searchJobs,
  filterJobsByField,
  filterJobsByDateRange,
  sortJobsByDateDesc,
  uniqueValues,
};
