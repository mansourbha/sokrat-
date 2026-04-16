import { useState } from "react";

var MATIERES_PAR_CLASSE = {
  "Terminale SS":    ["Philosophie","Français","Histoire","Géographie","Anglais","Économie","Sciences Sociales","Mathématiques"],
  "Terminale SE":    ["Philosophie","Français","SVT","Physique-Chimie","Mathématiques","Anglais"],
  "Terminale Maths": ["Mathématiques","Physique","Chimie","Français","Anglais","Philosophie"],
  "10ème/BEPC":      ["Français","Mathématiques","Histoire-Géographie","Sciences","Anglais","EPS"],
  "Autre":           [],
};

var EXAMENS = ["BAC 2026","BAC 2027","BEPC 2026","BEPC 2027"];

var CLASSES = Object.keys(MATIERES_PAR_CLASSE);

export default function ProfileSetup({ onComplete, initial }) {
  var defClasse = initial ? initial.classe : "Terminale SS";
  var _a = useState(initial ? initial.prenom : ""); var prenom = _a[0]; var setPrenom = _a[1];
  var _b = useState(defClasse); var classe = _b[0]; var setClasse = _b[1];
  var _c = useState(initial ? initial.examen : "BAC 2026"); var examen = _c[0]; var setExamen = _c[1];
  var _d = useState(initial ? initial.matieres : (MATIERES_PAR_CLASSE[defClasse] || []));
  var matieres = _d[0]; var setMatieres = _d[1];
  var _e = useState(""); var autre = _e[0]; var setAutre = _e[1];
  var _f = useState(""); var err = _f[0]; var setErr = _f[1];

  function changeClasse(c) {
    setClasse(c);
    setMatieres(MATIERES_PAR_CLASSE[c] ? [...MATIERES_PAR_CLASSE[c]] : []);
  }

  function toggle(m) {
    setMatieres(function(prev) {
      return prev.includes(m) ? prev.filter(function(x){return x!==m;}) : prev.concat([m]);
    });
  }

  function addAutre() {
    var m = autre.trim();
    if (m && !matieres.includes(m)) {
      setMatieres(function(prev){ return prev.concat([m]); });
      setAutre("");
    }
  }

  function removeMatiere(m) {
    setMatieres(function(prev){ return prev.filter(function(x){return x!==m;}); });
  }

  function submit() {
    if (!prenom.trim()) { setErr("Entre ton prénom pour continuer."); return; }
    if (matieres.length === 0) { setErr("Sélectionne au moins une matière."); return; }
    var profile = { prenom: prenom.trim(), classe: classe, examen: examen, matieres: matieres };
    localStorage.setItem("sokrat_profile", JSON.stringify(profile));
    onComplete(profile);
  }

  var baseList = MATIERES_PAR_CLASSE[classe] || [];
  var isEditing = !!initial;

  var inp = {
    width:"100%", background:"#0F1117", border:"1px solid #1E2330",
    borderRadius:10, padding:"12px 14px", color:"#E0E4EA",
    fontSize:14, fontFamily:"inherit", outline:"none",
    boxSizing:"border-box",
  };

  return (
    <div style={{minHeight:"100vh",background:"#0C0E12",color:"#F0F2F5",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 40px"}}>
      <style>{"select option{background:#0F1117;color:#E0E4EA;}"}</style>

      {/* Logo */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:28}}>
        <div style={{width:56,height:56,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:28,color:"#fff",fontStyle:"italic",marginBottom:12,boxShadow:"0 0 30px rgba(99,102,241,0.35)"}}>S</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,letterSpacing:"-0.5px"}}>Sokrat</div>
        <div style={{fontSize:12,color:"#374151",marginTop:4,textAlign:"center"}}>
          {isEditing ? "Modifier mon profil" : "Configurons ton assistant BAC"}
        </div>
      </div>

      <div style={{width:"100%",maxWidth:440,display:"flex",flexDirection:"column",gap:20}}>

        {/* Prénom */}
        <div>
          <label style={{fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:8}}>Ton prénom</label>
          <input
            value={prenom}
            onChange={function(ev){setPrenom(ev.target.value); setErr("");}}
            placeholder="ex: Mansour"
            style={inp}
          />
        </div>

        {/* Classe */}
        <div>
          <label style={{fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:8}}>Classe</label>
          <select value={classe} onChange={function(ev){changeClasse(ev.target.value); setErr("");}}
            style={{...inp, appearance:"none", cursor:"pointer"}}>
            {CLASSES.map(function(c){ return <option key={c} value={c}>{c}</option>; })}
          </select>
        </div>

        {/* Examen */}
        <div>
          <label style={{fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:8}}>Examen cible</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {EXAMENS.map(function(ex){
              var sel = examen === ex;
              return (
                <button key={ex} onClick={function(){setExamen(ex);}}
                  style={{padding:"8px 16px",borderRadius:20,border:"1.5px solid "+(sel?"#6366F1":"#1E2330"),background:sel?"rgba(99,102,241,0.15)":"transparent",color:sel?"#A5B4FC":"#6B7280",fontSize:13,fontWeight:sel?700:400,cursor:"pointer"}}>
                  {ex}
                </button>
              );
            })}
          </div>
        </div>

        {/* Matières */}
        <div>
          <label style={{fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:8}}>Matières</label>

          {/* Cases à cocher pour les matières standards */}
          {baseList.length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
              {baseList.map(function(m){
                var sel = matieres.includes(m);
                return (
                  <button key={m} onClick={function(){toggle(m);}}
                    style={{padding:"6px 12px",borderRadius:8,border:"1.5px solid "+(sel?"#3B82F6":"#1E2330"),background:sel?"rgba(59,130,246,0.12)":"#0F1117",color:sel?"#7DD3FC":"#6B7280",fontSize:12,fontWeight:sel?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:14,height:14,borderRadius:3,border:"1.5px solid "+(sel?"#3B82F6":"#374151"),background:sel?"#3B82F6":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:9,color:"white"}}>
                      {sel ? "✓" : ""}
                    </span>
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* Matières ajoutées manuellement (hors liste ou pour "Autre") */}
          {matieres.filter(function(m){return !baseList.includes(m);}).length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {matieres.filter(function(m){return !baseList.includes(m);}).map(function(m){
                return (
                  <div key={m} style={{padding:"4px 10px",borderRadius:20,background:"rgba(139,92,246,0.15)",border:"1px solid #8B5CF6",color:"#C4B5FD",fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                    {m}
                    <span onClick={function(){removeMatiere(m);}} style={{cursor:"pointer",color:"#6B7280",fontSize:14,lineHeight:1}}>×</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ajouter une matière personnalisée */}
          <div style={{display:"flex",gap:8}}>
            <input value={autre} onChange={function(ev){setAutre(ev.target.value);}}
              onKeyDown={function(ev){if(ev.key==="Enter"){ev.preventDefault();addAutre();}}}
              placeholder={classe==="Autre" ? "Nom de la matière" : "Ajouter une matière..."}
              style={{...inp,flex:1,padding:"9px 12px",fontSize:13}}
            />
            <button onClick={addAutre}
              style={{background:"rgba(99,102,241,0.2)",border:"1px solid #6366F1",borderRadius:10,padding:"9px 14px",color:"#A5B4FC",fontSize:13,cursor:"pointer",flexShrink:0}}>
              +
            </button>
          </div>
        </div>

        {/* Erreur */}
        {err && (
          <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#FCA5A5"}}>
            {err}
          </div>
        )}

        {/* Bouton valider */}
        <button onClick={submit}
          style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",border:"none",borderRadius:14,padding:"14px",color:"white",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(99,102,241,0.35)",marginTop:4}}>
          {isEditing ? "Enregistrer les modifications" : "Commencer avec Sokrat →"}
        </button>

      </div>
    </div>
  );
}
