const {
  pool,
  buildInsert,
  loadFromTable,
  TABLE_NAMES,
} = require("../config/database");
const { DATA_TYPES } = require("../constants/health.constants");

async function saveRecords(userId, dataType, rows) {
  if (!rows?.length) return;
  for (const row of rows) {
    const insert = buildInsert(dataType, userId, row);
    if (insert) await pool.query(insert.sql, insert.values);
  }
}

async function loadAllRecords(userId) {
  const result = {};
  for (const dataType of Object.keys(TABLE_NAMES)) {
    const rows = await loadFromTable(dataType, userId);
    if (rows.length > 0) result[dataType] = rows;
  }
  return result;
}

async function syncHealthData(userId, data) {
  // Normalise steps
  if (Array.isArray(data.steps)) {
    data.steps = data.steps.map((s) => ({
      timestamp: s.date || s.timestamp,
      value: s.value,
      source: s.source || "Apple Watch",
    }));
  }

  for (const key of DATA_TYPES) {
    if (data[key]?.length > 0) {
      await saveRecords(userId, key, data[key]);
      console.log(`${key}: ${data[key].length} records saved`);
    }
  }
}

module.exports = { saveRecords, loadAllRecords, syncHealthData };
