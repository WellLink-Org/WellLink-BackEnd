const ExcelJS = require("exceljs");
const { SHEET_DEFINITIONS } = require("../constants/health.constants");

// All your style helpers, groupByDay, getSummaryType, buildSheet live here
// — exact same code, just moved out of the route handler

function buildWorkbook(data) {
  const wb = new ExcelJS.Workbook();

  // ── Styles ───────────────────────────────────────────────────────────────
  const makeHeaderStyle = (color) => ({
    font: { bold: true, name: "Arial", size: 10, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: color } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      top: { style: "thin", color: { argb: "FF333355" } },
      bottom: { style: "thin", color: { argb: "FF333355" } },
      left: { style: "thin", color: { argb: "FF333355" } },
      right: { style: "thin", color: { argb: "FF333355" } },
    },
  });

  const rowStyle = (i) => ({
    font: { name: "Arial", size: 10 },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: i % 2 === 0 ? "FFF7F8FC" : "FFFFFFFF" },
    },
    alignment: { horizontal: "left", vertical: "middle" },
    border: {
      top: { style: "hair", color: { argb: "FFD0D4E0" } },
      bottom: { style: "hair", color: { argb: "FFD0D4E0" } },
      left: { style: "hair", color: { argb: "FFD0D4E0" } },
      right: { style: "hair", color: { argb: "FFD0D4E0" } },
    },
  });

  const totalStyle = (color) => ({
    font: { bold: true, name: "Arial", size: 10, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: color } },
    alignment: { horizontal: "right", vertical: "middle" },
    border: {
      top: { style: "medium", color: { argb: color } },
      bottom: { style: "medium", color: { argb: color } },
      left: { style: "thin", color: { argb: color } },
      right: { style: "thin", color: { argb: color } },
    },
  });

  function applyStyle(row, style) {
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (style.font) cell.font = style.font;
      if (style.fill) cell.fill = style.fill;
      if (style.alignment) cell.alignment = style.alignment;
      if (style.border) cell.border = style.border;
    });
  }

  // Which fields are numeric and make sense to total/average
  const TOTAL_FIELDS = new Set([
    "value",
    "steps",
    "bpm",
    "durationMinutes",
    "calories",
    "distanceKm",
    "duration",
  ]);

  // For each field: "sum" or "avg"
  const TOTAL_TYPE = {
    value: "sum",
    steps: "sum",
    bpm: "avg",
    durationMinutes: "sum",
    calories: "sum",
    distanceKm: "sum",
    duration: "sum",
  };

  // ── Group records by day ─────────────────────────────────────────────────
  function groupByDay(records, preferWatch) {
    const days = {};

    records.forEach((r) => {
      // Handle any possible timestamp column name
      const raw = r.timestamp || r.timestamp_start || r.start || r.date || "";

      const day =
        typeof raw === "string"
          ? raw.substring(0, 10)
          : raw instanceof Date
            ? raw.toISOString().substring(0, 10)
            : "";

      if (!day) return;
      if (!days[day]) days[day] = [];
      days[day].push(r);
    });

    if (preferWatch) {
      Object.keys(days).forEach((day) => {
        const hasWatch = days[day].some((e) =>
          (e.source || "").toLowerCase().includes("watch"),
        );
        if (hasWatch) {
          days[day] = days[day].filter((e) =>
            (e.source || "").toLowerCase().includes("watch"),
          );
        }
      });
    }

    return days;
  }

  function getSummaryType(key) {
    if (
      [
        "value",
        "steps",
        "distance_km",
        "calories_kcal",
        "duration_minutes",
      ].includes(key)
    )
      return "sum";
    if (["bpm"].includes(key)) return "avg";
    if (key.endsWith("_kcal")) return "sum";
    if (key.endsWith("_meters")) return "sum";
    if (key.endsWith("_minutes")) return "sum";
    if (key.endsWith("_grams")) return "sum";
    if (key.endsWith("_liters")) return "sum";
    if (key.endsWith("_km")) return "sum";
    if (key.endsWith("_kg")) return "sum";
    if (key.endsWith("_bpm")) return "avg";
    if (key.endsWith("_pct")) return "avg";
    if (key.endsWith("_db")) return "avg";
    if (key.endsWith("_ms")) return "avg";
    if (key.endsWith("_celsius")) return "avg";
    if (key.endsWith("_mmhg")) return "avg";
    if (key.endsWith("_mg_dl")) return "avg";
    if (key.endsWith("_m_s")) return "avg";
    if (key.endsWith("_ml_kg_min")) return "avg";
    return null; // skip — text, id, timestamps etc.
  }

  // ── Build sheet ───────────────────────────────────────────────────────────
  function buildSheet(
    sheetName,
    records,
    preferWatch,
    accentColor,
    showTotals,
  ) {
    const ws = wb.addWorksheet(sheetName);
    ws.views = [{ showGridLines: false }];

    if (!records || records.length === 0) {
      ws.addRow(["No data recorded for this period"]);
      return;
    }

    const grouped = groupByDay(records, preferWatch);
    const sortedDays = Object.keys(grouped).sort();
    if (sortedDays.length === 0) {
      ws.addRow(["No data recorded"]);
      return;
    }

    const allKeys = [...new Set(records.flatMap((r) => Object.keys(r)))];
    let currentRow = 1;

    sortedDays.forEach((day) => {
      const dayRecords = grouped[day];
      const dayLabel = new Date(day + "T12:00:00Z").toLocaleDateString(
        "en-GB",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      // Day header
      const dayHeaderRow = ws.getRow(currentRow);
      dayHeaderRow.height = 24;
      dayHeaderRow.getCell(1).value =
        `📅  ${dayLabel}  —  ${dayRecords.length} records`;
      dayHeaderRow.getCell(1).font = {
        bold: true,
        name: "Arial",
        size: 11,
        color: { argb: "FFFFFFFF" },
      };
      dayHeaderRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1A1A2E" },
      };
      dayHeaderRow.getCell(1).alignment = {
        horizontal: "left",
        vertical: "middle",
      };
      if (allKeys.length > 1)
        ws.mergeCells(currentRow, 1, currentRow, allKeys.length);
      currentRow++;

      // Column headers
      const colHeaderRow = ws.getRow(currentRow);
      colHeaderRow.height = 20;
      allKeys.forEach((key, i) => {
        colHeaderRow.getCell(i + 1).value = key;
      });
      applyStyle(colHeaderRow, makeHeaderStyle(accentColor));
      currentRow++;

      // Data rows
      dayRecords.forEach((record, i) => {
        const dataRow = ws.getRow(currentRow);
        dataRow.height = 18;
        allKeys.forEach((key, colIdx) => {
          const val = record[key];
          dataRow.getCell(colIdx + 1).value =
            typeof val === "number" ? val : val == null ? "" : String(val);
        });
        applyStyle(dataRow, rowStyle(i));
        currentRow++;
      });

      // Totals row
      if (showTotals) {
        const summaryRow = ws.getRow(currentRow);
        summaryRow.height = 20;
        let labelSet = false;

        allKeys.forEach((key, colIdx) => {
          const aggType = getSummaryType(key);
          if (!aggType) return;

          const vals = dayRecords
            .map((r) => {
              const v = r[key];
              return typeof v === "number" ? v : parseFloat(v);
            })
            .filter((v) => !isNaN(v));

          if (vals.length > 0) {
            const result =
              aggType === "avg"
                ? vals.reduce((a, b) => a + b, 0) / vals.length
                : vals.reduce((a, b) => a + b, 0);

            summaryRow.getCell(colIdx + 1).value =
              Math.round(result * 100) / 100;

            if (!labelSet) {
              summaryRow.getCell(1).value =
                aggType === "avg" ? "DAILY AVG" : "DAILY TOTAL";
              labelSet = true;
            }
          }
        });

        if (labelSet) {
          applyStyle(summaryRow, totalStyle(accentColor));
          currentRow++;
        }
      }

      // Gap between days
      currentRow++;
    });

    // Column widths
    allKeys.forEach((key, i) => {
      ws.getColumn(i + 1).width = Math.max(key.length + 6, 20);
    });
  }

  SHEET_DEFINITIONS.forEach(([name, key, preferWatch, color, totals]) => {
    if (key && typeof name === "string") {
      buildSheet(name, data[key] || [], preferWatch, color, totals);
    }
  });

  return wb;
}

module.exports = { buildWorkbook };
