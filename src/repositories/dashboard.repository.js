const { pool } = require("../config/database");

const {
  DATA_TYPE_TO_WIDGET,
  WIDGET_REGISTRY,
} = require("../constants/widget.constants");

const DEFAULT_WIDGETS = [
  { dataType: "steps", sizeVariant: "small" },
  { dataType: "heartRate", sizeVariant: "medium" },
  { dataType: "activeEnergy", sizeVariant: "medium" },
  { dataType: "sleep", sizeVariant: "wide" },
  { dataType: "workouts", sizeVariant: "large" },
  { dataType: "bloodPressureSystolic", sizeVariant: "small" },
  { dataType: "oxygenSaturation", sizeVariant: "small" },
  { dataType: "weight", sizeVariant: "medium" },
  { dataType: "dietaryCalories", sizeVariant: "medium" },
  { dataType: "hrv", sizeVariant: "medium" },
  { dataType: "dietaryWater", sizeVariant: "small" },
  { dataType: "mindfulMinutes", sizeVariant: "small" },
];

async function seedDefaultDashboard(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create default dashboard
    const {
      rows: [dashboard],
    } = await client.query(
      `INSERT INTO dashboards (user_id, name, is_default, layout)
       VALUES ($1, 'My Health', true, $2)
       RETURNING id`,
      [userId, JSON.stringify({ columns: 12 })],
    );

    // Auto-layout: pack widgets into a 12-col grid
    let x = 0,
      y = 0,
      rowHeight = 0;
    for (const { dataType, sizeVariant } of DEFAULT_WIDGETS) {
      const widgetType = DATA_TYPE_TO_WIDGET[dataType];
      if (!widgetType) continue;
      const def = WIDGET_REGISTRY[widgetType];
      const size = def.sizeMap[sizeVariant] ?? def.sizeMap[def.defaultSize];

      if (x + size.w > 12) {
        y += rowHeight;
        x = 0;
        rowHeight = 0;
      }
      rowHeight = Math.max(rowHeight, size.h);

      await client.query(
        `INSERT INTO dashboard_widgets
           (dashboard_id, widget_type, data_type, config, 
            position_x, position_y, width, height, size_variant)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          dashboard.id,
          widgetType,
          dataType,
          JSON.stringify({}),
          x,
          y,
          size.w,
          size.h,
          sizeVariant,
        ],
      );
      x += size.w;
    }

    await client.query("COMMIT");
    return dashboard.id;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function getDashboard(userId) {
  const {
    rows: [dashboard],
  } = await pool.query(
    `SELECT d.*, 
       json_agg(
         json_build_object(
           'id', w.id, 'widgetType', w.widget_type, 'dataType', w.data_type,
           'sizeVariant', w.size_variant, 'config', w.config,
           'x', w.position_x, 'y', w.position_y, 'w', w.width, 'h', w.height
         ) ORDER BY w.position_y, w.position_x
       ) AS widgets
     FROM dashboards d
     JOIN dashboard_widgets w ON w.dashboard_id = d.id
     WHERE d.user_id = $1 AND d.is_default = true
     GROUP BY d.id`,
    [userId],
  );
  return Response.json(dashboard);
}

async function updateWidgets(widgets) {
  for (const widget of widgets) {
    await pool.query(
      `UPDATE dashboard_widgets 
       SET position_x=$1, position_y=$2, width=$3, height=$4, size_variant=$5
       WHERE id=$6`,
      [widget.x, widget.y, widget.w, widget.h, widget.sizeVariant, widget.id],
    );
  }
  return Response.json({ ok: true });
}

async function getWidget(userId, dataType, days) {
  const { rows } = await pool.query(
    `SELECT sampled_at, value, value2, stage, unit
     FROM health_samples
     WHERE user_id=$1 AND type=$2
       AND sampled_at > NOW() - INTERVAL '${days} days'
     ORDER BY sampled_at`,
    [userId, dataType],
  );
  return Response.json(rows);
}

module.exports = {
  seedDefaultDashboard,
  getDashboard,
  updateWidgets,
  getWidget,
};
