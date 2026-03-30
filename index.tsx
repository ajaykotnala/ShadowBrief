import { useState, useEffect, useRef } from "react";

const AGENT_CODES = ["WRAITH-7","CIPHER-9","PHANTOM-3","ECLIPSE-5","VENOM-12","SPECTER-4"];
const THREAT_LEVELS = ["MINIMAL","GUARDED","ELEVATED","HIGH","CRITICAL","EXTREME"];
const THREAT_COLORS = {"MINIMAL":"#4ade80","GUARDED":"#a3e635","ELEVATED":"#facc15","HIGH":"#fb923c","CRITICAL":"#f87171","EXTREME":"#ff0000"};

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomId() { return "DOC-" + Math.random().toString(36).substr(2,5).toUpperCase() + "-" + Math.floor(Math.random()*9000+1000); }
function randomDate() {
  const d = new Date(Date.now() - Math.random()*1e10);
  return d.toISOString().split("T")[0];
}

const RedactedBar = ({ width = "60%" }) => (
  <span style={{
    display:"inline-block", background:"#111", width, height:"1em",
    verticalAlign:"middle", margin:"0 4px", cursor:"default",
    transition:"filter 0.3s", filter:"none", borderRadius:2
  }}
  onMouseEnter={e => e.currentTarget.style.filter = "blur(0) brightness(1.1)"}
  onMouseLeave={e => e.currentTarget.style.filter = "none"}
  title="[REDACTED]"
  />
);

const TypewriterText = ({ text, delay = 0, speed = 18, onDone }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { clearInterval(interval); onDone && onDone(); }
    }, speed);
    return () => clearInterval(interval);
  }, [started, text]);
  return <span>{displayed}<span style={{opacity: displayed.length < text.length ? 1 : 0}}>█</span></span>;
};

export default function App() {
  const [phase, setPhase] = useState("input"); // input | loading | dossier
  const [subject, setSubject] = useState("");
  const [dossier, setDossier] = useState(null);
  const [meta, setMeta] = useState(null);
  const [revealedSections, setRevealedSections] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef();

  useEffect(() => { if (phase === "input") inputRef.current?.focus(); }, [phase]);

  async function generateDossier() {
    if (!subject.trim()) return;
    setPhase("loading");
    setError("");
    setRevealedSections(0);
    const m = {
      id: randomId(), date: randomDate(),
      agent: randomFrom(AGENT_CODES),
      clearance: "LEVEL 5 — EYES ONLY"
    };
    setMeta(m);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a classified intelligence AI generating fictional, dramatic, darkly humorous dossiers on any subject. 
Respond ONLY with a valid JSON object, no markdown, no backticks, no preamble.
The JSON must have exactly these keys:
- subject_profile: { aliases: string[], origin: string, description: string }
- threat_level: one of MINIMAL/GUARDED/ELEVATED/HIGH/CRITICAL/EXTREME
- threat_rationale: string (1-2 sentences why this threat level)
- field_notes: string[] (3-4 short dramatic observations from a field agent, present tense)
- redacted_intel: string (a tantalizing hint about what is redacted, end mid-sentence so it can be cut off)
- recommended_action: one of MONITOR/NEUTRALIZE/RECRUIT/IGNORE/QUARANTINE/ESCALATE
- action_justification: string (1 sentence explaining the recommendation)
Keep tone: cold, clinical, conspiratorial, slightly ominous. Be creative and specific to the subject.`,
          messages: [{ role: "user", content: `Generate a classified dossier on: ${subject}` }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(b => b.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setDossier(parsed);
      setPhase("dossier");
      // Reveal sections one by one
      let s = 0;
      const iv = setInterval(() => {
        s++;
        setRevealedSections(s);
        if (s >= 5) clearInterval(iv);
      }, 900);
    } catch(e) {
      setError("TRANSMISSION FAILED. SIGNAL LOST. TRY AGAIN.");
      setPhase("input");
    }
  }

  const styles = {
    app: {
      minHeight: "100vh", background: "#0a0a0a", color: "#c9c9b0",
      fontFamily: "'Courier New', monospace", padding: "0",
      backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)",
      position: "relative", overflow: "hidden"
    },
    scanline: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "linear-gradient(transparent 50%, rgba(0,0,0,0.04) 50%)",
      backgroundSize: "100% 4px", pointerEvents: "none", zIndex: 100
    },
    header: {
      borderBottom: "1px solid #333", padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#0d0d0d"
    },
    logo: { fontSize: 11, letterSpacing: 6, color: "#666", textTransform: "uppercase" },
    logoMain: { fontSize: 20, letterSpacing: 8, color: "#c00", fontWeight: "bold" },
    center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: 24 },
    inputBox: {
      width: "100%", maxWidth: 560, background: "#0d0d0d",
      border: "1px solid #2a2a2a", borderRadius: 2, padding: "32px 36px"
    },
    label: { fontSize: 10, letterSpacing: 4, color: "#666", marginBottom: 8, display: "block" },
    input: {
      width: "100%", background: "transparent", border: "none",
      borderBottom: "1px solid #444", color: "#c9c9b0", fontSize: 15,
      fontFamily: "'Courier New', monospace", padding: "8px 0", outline: "none",
      letterSpacing: 2, boxSizing: "border-box"
    },
    btn: {
      marginTop: 24, width: "100%", background: "#8b0000", border: "none",
      color: "#fff", padding: "12px 0", fontSize: 11, letterSpacing: 5,
      fontFamily: "'Courier New', monospace", cursor: "pointer",
      textTransform: "uppercase", transition: "background 0.2s"
    },
    dossierWrap: { maxWidth: 720, margin: "0 auto", padding: "24px 16px" },
    docHeader: {
      border: "2px solid #333", background: "#0d0d0d", padding: "20px 28px",
      marginBottom: 0, position: "relative"
    },
    watermark: {
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%,-50%) rotate(-30deg)",
      fontSize: 56, fontWeight: 900, color: "rgba(180,0,0,0.07)",
      letterSpacing: 8, pointerEvents: "none", whiteSpace: "nowrap", userSelect: "none"
    },
    stamp: {
      display: "inline-block", border: "3px solid #c00", color: "#c00",
      fontSize: 13, fontWeight: 900, letterSpacing: 6, padding: "4px 10px",
      transform: "rotate(-3deg)", marginBottom: 12
    },
    metaRow: { display: "flex", gap: 32, fontSize: 10, color: "#555", letterSpacing: 2, marginTop: 8, flexWrap: "wrap" },
    section: {
      border: "1px solid #1e1e1e", background: "#0d0d0d",
      borderTop: "none", padding: "18px 28px",
      transition: "opacity 0.5s, transform 0.5s"
    },
    sectionTitle: {
      fontSize: 9, letterSpacing: 5, color: "#666",
      borderBottom: "1px solid #1e1e1e", paddingBottom: 8, marginBottom: 14
    },
    subjectName: { fontSize: 22, letterSpacing: 4, color: "#d4d4b8", marginBottom: 8 },
    aliases: { fontSize: 11, color: "#555", letterSpacing: 2 },
    desc: { fontSize: 13, lineHeight: 1.8, color: "#aaa", letterSpacing: 1 },
    fieldNote: {
      padding: "8px 0", borderBottom: "1px solid #161616",
      fontSize: 12, color: "#999", lineHeight: 1.7, letterSpacing: 0.5
    },
    threatBadge: (level) => ({
      display: "inline-block", border: `2px solid ${THREAT_COLORS[level] || "#666"}`,
      color: THREAT_COLORS[level] || "#666", fontSize: 11, letterSpacing: 5,
      padding: "4px 14px", marginBottom: 8, fontWeight: 700
    }),
    actionBadge: {
      display: "inline-block", background: "#1a0000", border: "1px solid #8b0000",
      color: "#ff6666", fontSize: 12, letterSpacing: 4, padding: "6px 18px", marginBottom: 8
    },
    redactedBlock: {
      background: "#080808", border: "1px solid #1a1a1a", padding: "14px 18px",
      fontSize: 12, color: "#666", lineHeight: 1.8, letterSpacing: 0.5
    },
    newBriefBtn: {
      width: "100%", background: "transparent", border: "1px solid #333",
      color: "#555", padding: "12px 0", fontSize: 10, letterSpacing: 5,
      fontFamily: "'Courier New', monospace", cursor: "pointer",
      textTransform: "uppercase", marginTop: 0, transition: "all 0.2s"
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.scanline} />
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>DECLASSIFIED INTELLIGENCE SYSTEM</div>
          <div style={styles.logoMain}>SHADOW BRIEF</div>
        </div>
        <div style={{ fontSize: 10, color: "#333", textAlign: "right", letterSpacing: 2 }}>
          <div>CLEARANCE: LEVEL 5</div>
          <div style={{ color: "#8b0000" }}>● SECURE CHANNEL</div>
        </div>
      </div>

      {phase === "input" && (
        <div style={styles.center}>
          <div style={styles.inputBox}>
            <div style={{ fontSize: 9, letterSpacing: 5, color: "#555", marginBottom: 24 }}>
              ENTER SUBJECT FOR INTELLIGENCE ANALYSIS
            </div>
            {error && <div style={{ color: "#c00", fontSize: 11, letterSpacing: 3, marginBottom: 16 }}>{error}</div>}
            <label style={styles.label}>SUBJECT DESIGNATION</label>
            <input
              ref={inputRef}
              style={styles.input}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateDossier()}
              placeholder="e.g.  ELON MUSK / KUBERNETES / BITCOIN"
              spellCheck={false}
            />
            <button
              style={styles.btn}
              onClick={generateDossier}
              onMouseEnter={e => e.currentTarget.style.background = "#a00000"}
              onMouseLeave={e => e.currentTarget.style.background = "#8b0000"}
            >
              REQUEST INTELLIGENCE BRIEF
            </button>
            <div style={{ marginTop: 20, fontSize: 9, color: "#333", letterSpacing: 3, textAlign: "center" }}>
              ANY SUBJECT · ANY TOPIC · CLASSIFIED EYES ONLY
            </div>
          </div>
        </div>
      )}

      {phase === "loading" && (
        <div style={styles.center}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: 6, color: "#555", marginBottom: 24 }}>ACCESSING SECURE ARCHIVES</div>
            <div style={{ fontSize: 13, color: "#8b0000", letterSpacing: 4 }}>
              <TypewriterText text="COMPILING INTELLIGENCE..." speed={60} />
            </div>
            <div style={{ marginTop: 32, display: "flex", gap: 6, justifyContent: "center" }}>
              {[0,1,2,3,4,5,6,7].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, background: "#8b0000", borderRadius: "50%",
                  animation: `pulse 1s ${i*0.12}s infinite alternate`,
                  opacity: 0.3
                }} />
              ))}
            </div>
            <style>{`@keyframes pulse { to { opacity: 1; transform: scale(1.4); } }`}</style>
          </div>
        </div>
      )}

      {phase === "dossier" && dossier && meta && (
        <div style={styles.dossierWrap}>
          {/* Doc Header */}
          <div style={styles.docHeader}>
            <div style={styles.watermark}>TOP SECRET</div>
            <div style={styles.stamp}>■ TOP SECRET ■</div>
            <div style={styles.metaRow}>
              <span>DOC ID: {meta.id}</span>
              <span>DATE: {meta.date}</span>
              <span>AGENT: {meta.agent}</span>
              <span>CLEARANCE: {meta.clearance}</span>
            </div>
          </div>

          {/* Subject Profile */}
          {revealedSections >= 1 && (
            <div style={{...styles.section, animation: "fadeIn 0.5s ease"}}>
              <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`}</style>
              <div style={styles.sectionTitle}>SECTION 01 — SUBJECT PROFILE</div>
              <div style={styles.subjectName}>{subject.toUpperCase()}</div>
              {dossier.subject_profile?.aliases?.length > 0 && (
                <div style={styles.aliases}>A.K.A: {dossier.subject_profile.aliases.join(" · ")}</div>
              )}
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, margin: "6px 0 12px" }}>
                ORIGIN: {dossier.subject_profile?.origin}
              </div>
              <div style={styles.desc}>{dossier.subject_profile?.description}</div>
            </div>
          )}

          {/* Threat Assessment */}
          {revealedSections >= 2 && (
            <div style={{...styles.section, animation: "fadeIn 0.5s ease"}}>
              <div style={styles.sectionTitle}>SECTION 02 — THREAT ASSESSMENT</div>
              <div style={styles.threatBadge(dossier.threat_level)}>
                THREAT LEVEL: {dossier.threat_level}
              </div>
              <div style={{ height: 8, background: "#111", marginBottom: 12, marginTop: 4, borderRadius: 2 }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: THREAT_COLORS[dossier.threat_level] || "#666",
                  width: `${(THREAT_LEVELS.indexOf(dossier.threat_level)+1)/6*100}%`,
                  transition: "width 1s ease"
                }} />
              </div>
              <div style={styles.desc}>{dossier.threat_rationale}</div>
            </div>
          )}

          {/* Field Notes */}
          {revealedSections >= 3 && (
            <div style={{...styles.section, animation: "fadeIn 0.5s ease"}}>
              <div style={styles.sectionTitle}>SECTION 03 — FIELD AGENT OBSERVATIONS</div>
              {(dossier.field_notes || []).map((note, i) => (
                <div key={i} style={styles.fieldNote}>
                  <span style={{ color: "#555", marginRight: 10 }}>▸ [{String(i+1).padStart(2,"0")}]</span>
                  {note}
                </div>
              ))}
            </div>
          )}

          {/* Redacted Intel */}
          {revealedSections >= 4 && (
            <div style={{...styles.section, animation: "fadeIn 0.5s ease"}}>
              <div style={styles.sectionTitle}>SECTION 04 — CLASSIFIED INTELLIGENCE <span style={{ color: "#8b0000" }}>[ REDACTED ]</span></div>
              <div style={styles.redactedBlock}>
                <span style={{ color: "#555" }}>
                  {dossier.redacted_intel?.slice(0, Math.floor((dossier.redacted_intel?.length || 0) * 0.55))}
                </span>
                {" "}<RedactedBar width="40%" />{" "}
                <RedactedBar width="55%" />{" "}
                <RedactedBar width="30%" />{" "}
                <span style={{ color: "#333" }}>███████ ██████ ███ ████████</span>
                {" "}<RedactedBar width="45%" />
              </div>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, marginTop: 8 }}>
                THIS SECTION REQUIRES LEVEL 7 CLEARANCE — ACCESS DENIED
              </div>
            </div>
          )}

          {/* Recommended Action */}
          {revealedSections >= 5 && (
            <div style={{...styles.section, animation: "fadeIn 0.5s ease"}}>
              <div style={styles.sectionTitle}>SECTION 05 — RECOMMENDED ACTION</div>
              <div style={styles.actionBadge}>⚠ {dossier.recommended_action}</div>
              <div style={styles.desc}>{dossier.action_justification}</div>
            </div>
          )}

          {/* Footer */}
          {revealedSections >= 5 && (
            <div style={{ border: "1px solid #1e1e1e", borderTop: "none", padding: "12px 28px", background: "#0a0a0a", animation: "fadeIn 0.5s ease" }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, marginBottom: 12 }}>
                DOCUMENT END — ALL RIGHTS RESERVED — SHADOW INTELLIGENCE DIVISION
              </div>
              <button
                style={styles.newBriefBtn}
                onClick={() => { setPhase("input"); setSubject(""); setDossier(null); }}
                onMouseEnter={e => { e.currentTarget.style.color = "#c9c9b0"; e.currentTarget.style.borderColor = "#555"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#333"; }}
              >
                ↩ REQUEST NEW INTELLIGENCE BRIEF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
