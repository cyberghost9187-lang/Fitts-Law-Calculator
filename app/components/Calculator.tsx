"use client";
import { useState, useEffect } from "react";
import { calculate, getSuggestions, getDeviceLabel, ScenarioInput, FittsResult } from "../lib/fitts";
import type { DeviceType } from "../lib/fitts";
import { Lightbulb, Plus, ChevronDown } from "lucide-react";

const DEVICES: DeviceType[] = ["mouse", "touch", "stylus", "trackpad"];

const PRESETS = [
  { label: "Mobile CTA",       device: "touch" as DeviceType, distance: 300, targetSize: 44,  context: "Primary action button" },
  { label: "Desktop nav icon", device: "mouse" as DeviceType, distance: 280, targetSize: 24,  context: "Sidebar navigation" },
  { label: "Table row action", device: "mouse" as DeviceType, distance: 350, targetSize: 32,  context: "Data table icon button" },
  { label: "Thumb zone CTA",   device: "touch" as DeviceType, distance: 80,  targetSize: 56,  context: "Bottom thumb zone" },
  { label: "Tiny icon button", device: "mouse" as DeviceType, distance: 400, targetSize: 16,  context: "Compact toolbar" },
];

interface Props {
  onSave: (scenario: ScenarioInput, result: FittsResult) => void;
  onAddComparison: (scenario: ScenarioInput) => void;
}

export default function Calculator({ onSave, onAddComparison }: Props) {
  const [device, setDevice] = useState<DeviceType>("mouse");
  const [distance, setDistance] = useState(300);
  const [targetSize, setTargetSize] = useState(44);
  const [context, setContext] = useState("Primary action button");
  const [scenarioName, setScenarioName] = useState("Scenario A");
  const [result, setResult] = useState<FittsResult | null>(null);

  useEffect(() => {
    const r = calculate(device, distance, targetSize);
    setResult(r);
  }, [device, distance, targetSize]);

  const suggestions = result ? getSuggestions(result, { id: "x", name: scenarioName, device, distance, targetSize, context }) : [];

  function applyPreset(p: typeof PRESETS[0]) {
    setDevice(p.device);
    setDistance(p.distance);
    setTargetSize(p.targetSize);
    setContext(p.context);
  }

  function handleSave() {
    if (!result) return;
    const s: ScenarioInput = { id: Date.now().toString(), name: scenarioName, device, distance, targetSize, context };
    onSave(s, result);
  }

  function handleAddComparison() {
    const s: ScenarioInput = { id: Date.now().toString(), name: scenarioName, device, distance, targetSize, context };
    onAddComparison(s);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <input
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              style={{
                background: "transparent", border: "none", outline: "none",
                fontSize: 15, fontWeight: 600, color: "var(--text-primary)", width: "100%"
              }}
            />
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>Click name to rename</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAddComparison} style={btnStyle("ghost")} title="Add to comparison">
              <Plus size={13} /> Compare
            </button>
            <button onClick={handleSave} style={btnStyle("accent")}>
              Save to history
            </button>
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)} style={presetBtn}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* Controls */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Device */}
        <div>
          <Label>Device type</Label>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {DEVICES.map(d => (
              <button key={d} onClick={() => setDevice(d)} style={chipStyle(d === device)}>
                {getDeviceLabel(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Distance slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Label>D — Distance to target</Label>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{distance}px</span>
          </div>
          <input type="range" min={20} max={900} value={distance} step={5} onChange={e => setDistance(+e.target.value)} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>20px</span>
            <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>900px</span>
          </div>
        </div>

        {/* Size slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Label>W — Target size (along movement axis)</Label>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{targetSize}px</span>
          </div>
          <input type="range" min={4} max={320} value={targetSize} step={2} onChange={e => setTargetSize(+e.target.value)} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>4px</span>
            <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>320px</span>
          </div>
        </div>

        {/* Context */}
        <div>
          <Label>Context note (optional)</Label>
          <input
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="e.g. Primary submit button on checkout page"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* Results */}
      {result && (
        <div style={{ padding: 20 }}>
          <Label style={{ marginBottom: 12 }}>Results</Label>

          {/* Big metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            <MetricCard label="Index of Difficulty" value={result.id.toFixed(2)} unit="bits" />
            <MetricCard label="Movement Time" value={result.time.toString()} unit="ms" highlight />
            <div style={{
              background: result.bgColor,
              border: `1px solid ${result.color}40`,
              borderRadius: 8, padding: "12px 14px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rating</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: result.color }}>{result.label}</span>
              <span style={{ fontSize: 10, color: result.color + "bb" }}>ID {result.id.toFixed(2)} bits</span>
            </div>
          </div>

          {/* Formula steps */}
          <div style={{ marginTop: 12, background: "var(--bg-elevated)", borderRadius: 8, padding: "12px 14px" }}>
            <p style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Step-by-step calculation</p>
            <pre className="mono" style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 2, whiteSpace: "pre-wrap" }}>{result.steps}</pre>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Lightbulb size={13} color="var(--accent)" />
              <Label>UX Suggestions</Label>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", ...style }}>{children}</p>;
}

function MetricCard({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: `1px solid ${highlight ? "var(--accent)40" : "var(--border)"}`, borderRadius: 8, padding: "12px 14px" }}>
      <p style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p className="mono" style={{ fontSize: 22, fontWeight: 700, color: highlight ? "var(--accent)" : "var(--text-primary)" }}>{value}</p>
      <p style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{unit}</p>
    </div>
  );
}

function btnStyle(variant: "ghost" | "accent"): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 5,
    padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
    border: variant === "ghost" ? "1px solid var(--border)" : "1px solid var(--accent)40",
    background: variant === "ghost" ? "transparent" : "var(--accent-dim)",
    color: variant === "ghost" ? "var(--text-secondary)" : "var(--accent)",
  };
}

const presetBtn: React.CSSProperties = {
  padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 500,
  cursor: "pointer", border: "1px solid var(--border)",
  background: "var(--bg-elevated)", color: "var(--text-secondary)",
};

const inputStyle: React.CSSProperties = {
  marginTop: 8, width: "100%", background: "var(--bg-elevated)",
  border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 10px", fontSize: 12, color: "var(--text-primary)",
  outline: "none",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "5px 12px", borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: "pointer",
  border: active ? "1px solid var(--accent)60" : "1px solid var(--border)",
  background: active ? "var(--accent-dim)" : "var(--bg-elevated)",
  color: active ? "var(--accent)" : "var(--text-secondary)",
});
