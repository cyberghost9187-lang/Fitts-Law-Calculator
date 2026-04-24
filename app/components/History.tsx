"use client";
import { HistoryEntry } from "../lib/fitts";
import { Trash2, Clock, Download } from "lucide-react";
import { getDeviceLabel } from "../lib/fitts";

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
  onExport: () => void;
}

export default function History({ entries, onClear, onExport }: Props) {
  if (entries.length === 0) {
    return (
      <div style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Clock size={28} color="var(--text-tertiary)" />
        <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>No saved calculations yet</p>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", maxWidth: 200, lineHeight: 1.6 }}>
          Use the calculator and click "Save to history" to track your sessions
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Session History</p>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{entries.length} saved calculation{entries.length > 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onExport} style={btnStyle}>
            <Download size={12} /> Export
          </button>
          <button onClick={onClear} style={{ ...btnStyle, color: "#D94F4F", borderColor: "rgba(217,79,79,0.3)" }}>
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[...entries].reverse().map(entry => (
          <HistoryRow key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Stats summary */}
      {entries.length > 1 && (
        <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Session summary</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <SumCard label="Avg movement time" value={`${Math.round(entries.reduce((s, e) => s + e.result.time, 0) / entries.length)}ms`} />
            <SumCard label="Avg ID" value={`${(entries.reduce((s, e) => s + e.result.id, 0) / entries.length).toFixed(2)} bits`} />
            <SumCard label="Best scenario" value={`${entries.reduce((min, e) => e.result.time < min.result.time ? e : min, entries[0]).scenario.name}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const { scenario, result } = entry;
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "12px 14px",
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 12, alignItems: "center",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{scenario.name}</span>
          <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{time}</span>
          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
            {getDeviceLabel(scenario.device)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Stat label="D" value={`${scenario.distance}px`} />
          <Stat label="W" value={`${scenario.targetSize}px`} />
          <Stat label="ID" value={`${result.id.toFixed(2)} bits`} />
          {scenario.context && <Stat label="Context" value={scenario.context} />}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p className="mono" style={{ fontSize: 20, fontWeight: 700, color: result.color }}>{result.time}ms</p>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
          background: result.bgColor, color: result.color, marginTop: 4, display: "inline-block"
        }}>
          {result.label}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label} </span>
      <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

function SumCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px" }}>
      <p style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p className="mono" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer",
  border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)",
};
