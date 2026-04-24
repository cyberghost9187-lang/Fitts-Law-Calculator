"use client";
import { useState } from "react";
import { calculate, getSuggestions, getDeviceLabel, ScenarioInput, FittsResult } from "../lib/fitts";
import type { DeviceType } from "../lib/fitts";
import { X, Plus, Trash2 } from "lucide-react";

const DEVICES: DeviceType[] = ["mouse", "touch", "stylus", "trackpad"];

interface ScenarioState {
  input: ScenarioInput;
  result: FittsResult;
}

function defaultScenario(name: string, device: DeviceType, distance: number, size: number): ScenarioState {
  const input: ScenarioInput = {
    id: Date.now().toString() + Math.random(),
    name,
    device,
    distance,
    targetSize: size,
    context: "",
  };
  return { input, result: calculate(device, distance, size) };
}

interface Props {
  initialScenarios?: ScenarioInput[];
}

export default function Comparison({ initialScenarios }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioState[]>(() => {
    if (initialScenarios && initialScenarios.length > 0) {
      return initialScenarios.map(s => ({ input: s, result: calculate(s.device, s.distance, s.targetSize) }));
    }
    return [
      defaultScenario("Option A", "mouse", 300, 24),
      defaultScenario("Option B", "mouse", 300, 44),
    ];
  });

  function updateScenario(index: number, field: keyof ScenarioInput, value: string | number) {
    setScenarios(prev => {
      const next = [...prev];
      const updated = { ...next[index].input, [field]: value };
      next[index] = { input: updated, result: calculate(updated.device as DeviceType, updated.distance, updated.targetSize) };
      return next;
    });
  }

  function addScenario() {
    setScenarios(prev => [...prev, defaultScenario(`Option ${String.fromCharCode(65 + prev.length)}`, "mouse", 300, 44)]);
  }

  function removeScenario(index: number) {
    setScenarios(prev => prev.filter((_, i) => i !== index));
  }

  const best = scenarios.reduce((min, s) => s.result.time < min.result.time ? s : min, scenarios[0]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Scenario Comparison</p>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>Compare up to 4 design options side by side</p>
        </div>
        {scenarios.length < 4 && (
          <button onClick={addScenario} style={addBtn}>
            <Plus size={12} /> Add scenario
          </button>
        )}
      </div>

      {/* Winner banner */}
      {scenarios.length > 1 && (
        <div style={{
          background: "rgba(29,184,119,0.08)", border: "1px solid rgba(29,184,119,0.25)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 10, color: "#1DB877", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Fastest</span>
          <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{best.input.name}</span>
          <span className="mono" style={{ fontSize: 12, color: "#1DB877" }}>{best.result.time}ms</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>· ID {best.result.id.toFixed(2)} bits</span>
        </div>
      )}

      {/* Columns */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(scenarios.length, 2)}, 1fr)`, gap: 12 }}>
        {scenarios.map((s, i) => (
          <ScenarioCard
            key={s.input.id}
            scenario={s}
            isBest={s === best && scenarios.length > 1}
            onUpdate={(field, val) => updateScenario(i, field, val)}
            onRemove={scenarios.length > 1 ? () => removeScenario(i) : undefined}
          />
        ))}
      </div>

      {/* Delta table */}
      {scenarios.length > 1 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Delta vs fastest</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Scenario</th>
                <th style={thStyle}>ID (bits)</th>
                <th style={thStyle}>Time (ms)</th>
                <th style={thStyle}>Delta T</th>
                <th style={thStyle}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => {
                const delta = s.result.time - best.result.time;
                return (
                  <tr key={s.input.id} style={{ background: i % 2 === 0 ? "var(--bg-elevated)" : "transparent" }}>
                    <td style={tdStyle}>{s.input.name}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace" }}>{s.result.id.toFixed(2)}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace" }}>{s.result.time}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", color: delta === 0 ? "#1DB877" : "#E07040" }}>
                      {delta === 0 ? "—" : `+${delta}ms`}
                    </td>
                    <td style={{ ...tdStyle }}>
                      <span style={{ background: s.result.bgColor, color: s.result.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                        {s.result.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario, isBest, onUpdate, onRemove }: {
  scenario: ScenarioState;
  isBest: boolean;
  onUpdate: (field: keyof ScenarioInput, val: string | number) => void;
  onRemove?: () => void;
}) {
  const { input, result } = scenario;
  const suggestions = getSuggestions(result, input);

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid ${isBest ? "rgba(29,184,119,0.4)" : "var(--border)"}`,
      borderRadius: 10,
    }}>
      {/* Card header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <input
          value={input.name}
          onChange={e => onUpdate("name", e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", width: "100%" }}
        />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isBest && <span style={{ fontSize: 9, fontWeight: 600, color: "#1DB877", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Best</span>}
          {onRemove && (
            <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", padding: 2 }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Device */}
        <div>
          <Label>Device</Label>
          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
            {DEVICES.map(d => (
              <button key={d} onClick={() => onUpdate("device", d)} style={chip(d === input.device)}>
                {getDeviceLabel(d)}
              </button>
            ))}
          </div>
        </div>

        {/* D */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Label>Distance</Label>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>{input.distance}px</span>
          </div>
          <input type="range" min={20} max={900} value={input.distance} step={5} style={{ marginTop: 8 }} onChange={e => onUpdate("distance", +e.target.value)} />
        </div>

        {/* W */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Label>Target size</Label>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>{input.targetSize}px</span>
          </div>
          <input type="range" min={4} max={320} value={input.targetSize} step={2} style={{ marginTop: 8 }} onChange={e => onUpdate("targetSize", +e.target.value)} />
        </div>
      </div>

      {/* Result */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "var(--bg-elevated)", borderRadius: 6, padding: "8px 10px" }}>
            <p style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>ID</p>
            <p className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{result.id.toFixed(2)}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-secondary)", marginLeft: 3 }}>bits</span></p>
          </div>
          <div style={{ background: result.bgColor, border: `1px solid ${result.color}30`, borderRadius: 6, padding: "8px 10px" }}>
            <p style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Time</p>
            <p className="mono" style={{ fontSize: 18, fontWeight: 700, color: result.color, marginTop: 2 }}>{result.time}<span style={{ fontSize: 10, fontWeight: 400, marginLeft: 3 }}>ms</span></p>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: "6px 10px", background: "var(--bg-elevated)", borderRadius: 6, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {suggestions[0]}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</p>;
}

const chip = (active: boolean): React.CSSProperties => ({
  padding: "3px 9px", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer",
  border: active ? "1px solid var(--accent)60" : "1px solid var(--border)",
  background: active ? "var(--accent-dim)" : "transparent",
  color: active ? "var(--accent)" : "var(--text-secondary)",
});

const addBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
  border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)",
};

const thStyle: React.CSSProperties = {
  padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600,
  color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em",
  borderBottom: "1px solid var(--border)",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px", fontSize: 12, color: "var(--text-primary)",
  borderBottom: "1px solid var(--border-subtle)",
};
