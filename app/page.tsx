"use client";
import { useState, useCallback } from "react";
import Calculator from "./components/Calculator";
import Comparison from "./components/Comparison";
import ChartPanel from "./components/ChartPanel";
import History from "./components/History";
import { HistoryEntry, ScenarioInput, FittsResult } from "./lib/fitts";
import { Calculator as CalcIcon, GitCompare, BarChart2, Clock, ExternalLink } from "lucide-react";

type Tab = "calculator" | "comparison" | "chart" | "history";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "calculator", label: "Calculator", icon: <CalcIcon size={13} /> },
  { id: "comparison", label: "Compare",    icon: <GitCompare size={13} /> },
  { id: "chart",      label: "Chart",      icon: <BarChart2 size={13} /> },
  { id: "history",    label: "History",    icon: <Clock size={13} /> },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("calculator");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [comparisonQueue, setComparisonQueue] = useState<ScenarioInput[]>([]);
  const [currentW, setCurrentW] = useState(44);
  const [currentD, setCurrentD] = useState(300);

  const handleSave = useCallback((scenario: ScenarioInput, result: FittsResult) => {
    const entry: HistoryEntry = { id: Date.now().toString(), timestamp: Date.now(), scenario, result };
    setHistory(prev => [...prev, entry]);
    setCurrentW(scenario.targetSize);
    setCurrentD(scenario.distance);
  }, []);

  const handleAddComparison = useCallback((scenario: ScenarioInput) => {
    setComparisonQueue(prev => [...prev.slice(-3), scenario]);
    setTab("comparison");
  }, []);

  const handleClearHistory = useCallback(() => setHistory([]), []);

  const handleExportHistory = useCallback(() => {
    if (!history.length) return;
    const rows = [
      ["Name","Device","Distance (px)","Target Size (px)","ID (bits)","Time (ms)","Rating","Context","Timestamp"].join(","),
      ...history.map(e => [e.scenario.name,e.scenario.device,e.scenario.distance,e.scenario.targetSize,e.result.id.toFixed(3),e.result.time,e.result.label,`"${e.scenario.context}"`,new Date(e.timestamp).toISOString()].join(",")),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "fittslab-session.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top nav */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:52, background:"var(--bg-surface)", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:26, height:26, borderRadius:6, background:"var(--accent-dim)", border:"1px solid var(--accent)40", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--accent)" }}>F</span>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.02em" }}>FittsLab</span>
          <span style={{ fontSize:11, color:"var(--text-tertiary)", marginLeft:4 }}>Fitts's Law for designers</span>
        </div>
        <nav style={{ display:"flex", gap:2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:6, fontSize:12, fontWeight:500, cursor:"pointer", border:"none", background:tab===t.id?"var(--bg-hover)":"transparent", color:tab===t.id?"var(--text-primary)":"var(--text-secondary)" }}>
              {t.icon} {t.label}
              {t.id==="history" && history.length>0 && <span style={{ minWidth:16, height:16, borderRadius:8, fontSize:9, fontWeight:700, background:"var(--accent)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{history.length}</span>}
            </button>
          ))}
        </nav>
        <a href="https://www.nngroup.com/articles/fitts-law/" target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-tertiary)", textDecoration:"none" }}>
          <ExternalLink size={11} /> NN/g Reference
        </a>
      </header>

      {/* Main */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:tab==="calculator"?"380px 1fr":"1fr", overflow:"hidden", minHeight:0 }}>
        {tab==="calculator" && (
          <aside style={{ background:"var(--bg-surface)", borderRight:"1px solid var(--border)", overflowY:"auto" }}>
            <Calculator onSave={handleSave} onAddComparison={handleAddComparison} />
          </aside>
        )}
        <main style={{ overflowY:"auto", background:"var(--bg-base)" }}>
          {tab==="calculator" && (
            <div style={{ padding:24 }}>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.02em" }}>Fitts's Law Calculator</h1>
                <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>Calculate interaction cost, get difficulty ratings, and see improvement suggestions — built for real design decisions.</p>
              </div>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
                <p style={{ fontSize:10, fontWeight:500, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>The equation</p>
                <p className="mono" style={{ fontSize:20, fontWeight:700, color:"var(--text-primary)" }}>T = a + b × log₂(2D / W)</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:14 }}>
                  {[{sym:"T",desc:"Movement time (ms)"},{sym:"D",desc:"Distance to target center"},{sym:"W",desc:"Target size along movement axis"},{sym:"a, b",desc:"Device constants (empirical)"}].map(v => (
                    <div key={v.sym}>
                      <p className="mono" style={{ fontSize:14, fontWeight:700, color:"var(--accent)", marginBottom:3 }}>{v.sym}</p>
                      <p style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.4 }}>{v.desc}</p>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop:12, fontSize:11, color:"var(--text-tertiary)", lineHeight:1.5 }}>Constants: mouse b=100ms/bit · touch b=130ms/bit · stylus b=115ms/bit · trackpad b=110ms/bit (MacKenzie, 1992 — educational approximations)</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[{title:"Increase W",desc:"Adding invisible padding to icon buttons is the fastest win — same visual, bigger hitbox."},{title:"Reduce D",desc:"Move primary actions close to where interaction starts, not where it looks good."},{title:"ID < 3 bits",desc:"Target for primary and high-frequency actions. Above 4 bits causes noticeable friction."},{title:"Touch targets",desc:"44px is the WCAG 2.5.5 minimum. 48–56px is the comfortable zone for most thumb grips."}].map(tip => (
                  <div key={tip.title} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:8, padding:"14px 16px" }}>
                    <p style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", marginBottom:5 }}>{tip.title}</p>
                    <p style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.6 }}>{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="comparison" && <Comparison initialScenarios={comparisonQueue.length>0?comparisonQueue:undefined} />}
          {tab==="chart" && <ChartPanel currentW={currentW} currentD={currentD} />}
          {tab==="history" && <History entries={history} onClear={handleClearHistory} onExport={handleExportHistory} />}
        </main>
      </div>

      <footer style={{ borderTop:"1px solid var(--border)", padding:"10px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--bg-surface)" }}>
        <p style={{ fontSize:11, color:"var(--text-tertiary)" }}>FittsLab — Built for designers who want numbers, not guesswork</p>
        <p style={{ fontSize:11, color:"var(--text-tertiary)" }}>Based on P.M. Fitts (1954) · MacKenzie (1992)</p>
      </footer>
    </div>
  );
}
