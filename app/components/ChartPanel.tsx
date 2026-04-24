"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { generateChartData } from "../lib/fitts";
import type { DeviceType } from "../lib/fitts";
import { useState } from "react";

const DEVICES: DeviceType[] = ["mouse", "touch", "stylus", "trackpad"];

interface Props {
  currentW?: number;
  currentD?: number;
}

export default function ChartPanel({ currentW = 44, currentD = 300 }: Props) {
  const [device, setDevice] = useState<DeviceType>("mouse");
  const chartData = generateChartData(device, currentW);

  const data = chartData.distances.map((d, i) => {
    const point: Record<string, number> = { distance: d };
    chartData.series.forEach(s => {
      point[s.label] = s.data[i];
    });
    return point;
  });

  // Sample every 5 points to reduce clutter
  const sampled = data.filter((_, i) => i % 3 === 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "10px 14px", fontSize: 12,
      }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 6, fontSize: 11 }}>D = {label}px</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
            <span className="mono">{p.value}ms</span>
            <span style={{ color: "var(--text-secondary)", marginLeft: 6, fontSize: 11 }}>{p.dataKey}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Movement Time vs Distance</p>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
            T vs D curve for four target widths — purple line is your current W value
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {DEVICES.map(d => (
            <button key={d} onClick={() => setDevice(d)} style={chip(d === device)}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={sampled} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="distance"
              tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
              tickFormatter={v => `${v}px`}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
              tickFormatter={v => `${v}ms`}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)", paddingTop: 12 }}
            />
            {chartData.series.map(s => (
              <Line
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={s.color}
                strokeWidth={s.label.includes("current") ? 2.5 : 1.5}
                dot={false}
                strokeDasharray={s.label.includes("current") ? undefined : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ID reference guide */}
      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Difficulty reference</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { range: "< 2 bits", label: "Trivial", color: "#1DB877" },
            { range: "2–3 bits", label: "Easy", color: "#7cbd2a" },
            { range: "3–4 bits", label: "Moderate", color: "#E5A040" },
            { range: "4–5 bits", label: "Difficult", color: "#E07040" },
            { range: "> 5 bits", label: "Extreme", color: "#D94F4F" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                <span style={{ color: r.color, fontWeight: 500 }}>{r.label}</span> {r.range}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const chip = (active: boolean): React.CSSProperties => ({
  padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer",
  border: active ? "1px solid var(--accent)60" : "1px solid var(--border)",
  background: active ? "var(--accent-dim)" : "transparent",
  color: active ? "var(--accent)" : "var(--text-secondary)",
});
