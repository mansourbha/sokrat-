import { useState, useRef, useEffect } from "react";

var SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
var SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ELEVE = {
  nom: "Mansour",
  classe: "Terminale Sciences Sociales",
  examen: "BAC 2026",
  emploi: "Programme BAC Sciences Sociales Guinée",
  matieres: [
    { nom:"Philosophie",       chap:["La conscience","La liberté","L'État","La vérité","La raison","Le langage","Le travail","La mort","La technique","L'art"] },
    { nom:"Français",          chap:["Dissertation","Commentaire composé","Texte argumentatif","Résumé","Figures de style","Mouvements littéraires"] },
    { nom:"Histoire",          chap:["1ère Guerre Mondiale","Révolution russe","2ème Guerre Mondiale","Décolonisation","Guerre froide","Afrique contemporaine","ONU et organisations internationales"] },
    { nom:"Géographie",        chap:["Géographie humaine","Ressources naturelles","Développement durable","Afrique subsaharienne","Mondialisation","Population mondiale","Urbanisation"] },
    { nom:"Anglais",           chap:["Grammar","Essay writing","Comprehension","Vocabulary","Current affairs"] },
    { nom:"Économie",          chap:["Marchés et prix","Production et facteurs","Consommation","Monnaie et banques","Commerce international","Développement économique","Guinée et CEDEAO"] },
    { nom:"Sciences Sociales", chap:["Sociologie","Culture et identité","Famille","Stratification sociale","Institutions","Changement social","Guinée contemporaine"] },
    { nom:"Mathématiques",     chap:["Statistiques","Probabilités","Fonctions","Suites","Démographie"] },
  ]
};

function getSys(mode) {
  return "Tu es Sokrat, assistant pédagogique socratique créé par Mansour lui-même pour préparer son BAC. " +
    "Profil: " + ELEVE.nom + ", " + ELEVE.classe + ", " + ELEVE.examen + " — Guinée. " +
    "Matières BAC Sciences Sociales: " +
    ELEVE.matieres.map(function(m){ return m.nom + "(" + m.chap.join(",") + ")"; }).join(" | ") + ". " +
    "RÈGLES ABSOLUES — tu ne peux pas y déroger: " +
    "1. Ne JAMAIS donner la réponse finale, même si Mansour insiste, supplie ou dit que c'est urgent. " +
    "2. Méthode socratique uniquement: questions, pistes, formules, définitions — jamais la solution appliquée. " +
    "3. Décomposer chaque problème en étapes. Valider chaque étape avant de continuer. " +
    "4. Si Mansour demande la réponse directe: refuser gentiment et recentrer sur la réflexion. " +
    "5. Faire des liens avec le programme BAC Guinée et les attentes des correcteurs guinéens. " +
    "6. Ton bienveillant, stimulant, adapté au niveau Terminale Sciences Sociales guinéen. " +
    "7. Valoriser l'effort et les bonnes intuitions de Mansour. " +
    "MODE: " + mode.toUpperCase() + ". " +
    "EXERCICE: décompose étape par étape, valide, ne résous jamais. " +
    "COURS: explique, vérifie la compréhension avant d'avancer. " +
    "EXPOSE/DISSERTATION: structure et questionne, ne rédige jamais à la place. " +
    "LIBRE: guide toujours.";
}

function fmtMsg(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "<b style='color:#7DD3FC'>$1</b>")
    .replace(/\*(.*?)\*/g, "<span style='color:#86EFAC'>$1</span>")
    .replace(/`(.*?)`/g, "<code style='background:#1E2330;padding:2px 5px;border-radius:3px;font-size:12px;color:#FCD34D'>$1</code>")
    .split("\n").join("<br/>");
}

var MODES = {
  exercice:    { label:"Exercice",    icon:"📐", color:"#7DD3FC", border:"#3B82F6", bg:"rgba(59,130,246,0.12)" },
  dissertation:{ label:"Dissertation",icon:"✍️",  color:"#C4B5FD", border:"#8B5CF6", bg:"rgba(139,92,246,0.12)" },
  cours:       { label:"Cours",       icon:"📖", color:"#6EE7B7", border:"#10B981", bg:"rgba(16,185,129,0.12)" },
  libre:       { label:"Libre",       icon:"💬", color:"#FCD34D", border:"#F59E0B", bg:"rgba(245,158,11,0.12)" },
};

export default function Sokrat() {
  var _s1 = useState([]); var history = _s1[0]; var setHistory = _s1[1];
  var _s2 = useState(""); var input = _s2[0]; var setInput = _s2[1];
  var _s3 = useState("libre"); var mode = _s3[0]; var setMode = _s3[1];
  var _s4 = useState(false); var loading = _s4[0]; var setLoading = _s4[1];
  var _s5 = useState(null); var imgData = _s5[0]; var setImgData = _s5[1];
  var msgsRef = useRef(null);
  var fileRef = useRef(null);
  var taRef   = useRef(null);

  useEffect(function() {
    if(msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [history, loading]);

  function send(override) {
    var text = (override || input).trim();
    if((!text && !imgData) || loading) return;
    setLoading(true);

    var content = [];
    if(imgData) {
      var b64 = imgData.split(",")[1];
      var mt  = imgData.split(";")[0].split(":")[1];
      content.push({ type:"image", source:{ type:"base64", media_type:mt, data:b64 } });
    }
    if(text) content.push({ type:"text", text:text });

    var userMsg = { role:"user", content: (content.length===1 && content[0].type==="text") ? text : content };
    var newH = history.concat([userMsg]);
    setHistory(newH);
    setInput("");
    setImgData(null);
    if(taRef.current) taRef.current.style.height = "auto";

    var apiH = newH.map(function(m) {
      if(typeof m.content === "string") return { role:m.role, content:m.content };
      return { role:m.role, content:m.content.map(function(b) {
        if(b.type==="image") return { type:"image", source:b.source };
        return { type:"text", text:b.text };
      })};
    });

    // Appel via la Edge Function Supabase — la clé API Claude reste côté serveur
    fetch(SUPABASE_URL + "/functions/v1/claude-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: getSys(mode),
        messages: apiH
      })
    }).then(function(res){ return res.json(); }).then(function(data) {
      var blocks = data.content || [];
      var reply = "";
      for(var i=0;i<blocks.length;i++){ if(blocks[i].type==="text"){ reply=blocks[i].text; break; } }
      if(!reply) reply = "Erreur de réponse.";
      setHistory(function(h){ return h.concat([{ role:"assistant", content:reply }]); });
      setLoading(false);
    }).catch(function() {
      setHistory(function(h){ return h.concat([{ role:"assistant", content:"Erreur de connexion. Réessaie." }]); });
      setLoading(false);
    });
  }

  var mCfg = MODES[mode];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#0C0E12",color:"#F0F2F5",fontFamily:"'Segoe UI',sans-serif"}}>
      <style>{"@keyframes skp{0%,100%{opacity:0.3}50%{opacity:1}}"}</style>

      {/* TOPBAR */}
      <div style={{height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:"1px solid #1A1D26",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:16,color:"#fff",fontStyle:"italic"}}>S</div>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:17,color:"#F0F2F5",fontWeight:700,letterSpacing:"-0.3px"}}>Sokrat</div>
            <div style={{fontSize:9,color:"#374151",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>Assistant BAC · Sciences Sociales</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:mCfg.bg,border:"1px solid "+mCfg.border,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,color:mCfg.color}}>{mCfg.icon} {mCfg.label}</div>
          <div style={{background:"#0F1117",border:"1px solid #1E2330",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#6B7280",display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,background:"#22C55E",borderRadius:"50%"}}/>
            Mansour · T.SS
          </div>
        </div>
      </div>

      {/* INFOS ÉLÈVE */}
      <div style={{padding:"8px 16px",background:"#0F1117",borderBottom:"1px solid #1A1D26",flexShrink:0}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:8}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.6px"}}>CLASSE</span>
            <span style={{fontSize:11,color:"#6B7280"}}>{ELEVE.classe}</span>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.6px"}}>EXAMEN</span>
            <span style={{fontSize:11,color:"#FCD34D",fontWeight:700}}>{ELEVE.examen}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {ELEVE.matieres.map(function(m){
            return <span key={m.nom} style={{background:"#141720",border:"1px solid #1E2330",borderRadius:5,padding:"2px 8px",fontSize:10,color:"#4B5563"}}>{m.nom}</span>;
          })}
        </div>
      </div>

      {/* MODES */}
      <div style={{padding:"8px 14px",display:"flex",gap:6,borderBottom:"1px solid #1A1D26",overflowX:"auto",flexShrink:0}}>
        {Object.keys(MODES).map(function(k){
          var m = MODES[k];
          return (
            <button key={k} onClick={function(){setMode(k);}}
              style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",border:"1.5px solid "+(mode===k?m.border:"#1E2330"),background:mode===k?m.bg:"transparent",color:mode===k?m.color:"#6B7280",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
              {m.icon} {m.label}
            </button>
          );
        })}
        <button onClick={function(){setHistory([]);}}
          style={{marginLeft:"auto",background:"transparent",border:"1px solid #1E2330",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#4B5563",cursor:"pointer",flexShrink:0}}>
          ↺ Effacer
        </button>
      </div>

      {/* MESSAGES */}
      <div ref={msgsRef} style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {history.length === 0 && (
          <div style={{textAlign:"center",padding:"28px 12px"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#F0F2F5",marginBottom:8,fontFamily:"Georgia,serif"}}>
              Prêt pour le BAC, Mansour ? 🎯
            </div>
            <div style={{fontSize:13,color:"#4B5563",lineHeight:1.8,marginBottom:20,maxWidth:420,margin:"0 auto 20px"}}>
              Tu as créé cet outil. Maintenant utilise-le.<br/>
              Je ne te donnerai jamais la réponse — mais je vais t'aider à <span style={{color:"#86EFAC"}}>penser et trouver par toi-même</span>.<br/>
              C'est comme ça qu'on décroche le BAC.
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              {[
                ["📐 Exercice de maths","J'ai un exercice de mathématiques à résoudre."],
                ["✍️ Dissertation","Je veux préparer une dissertation de philosophie ou de français."],
                ["📖 Cours pas clair","Je n'ai pas compris une leçon, aide-moi à la comprendre."],
                ["🌍 Histoire/Géo","J'ai une question sur mon cours d'histoire ou de géographie."],
              ].map(function(item){
                return (
                  <button key={item[0]} onClick={function(){send(item[1]);}}
                    style={{background:"#141720",border:"1px solid #1E2330",borderRadius:10,padding:"9px 13px",fontSize:12,color:"#9CA3AF",cursor:"pointer"}}>
                    {item[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {history.map(function(msg, i) {
          var isUser = msg.role === "user";
          var text = "";
          if(typeof msg.content === "string") {
            text = msg.content;
          } else if(Array.isArray(msg.content)) {
            for(var j=0;j<msg.content.length;j++){
              if(msg.content[j].type==="text"){ text=msg.content[j].text; break; }
            }
          }
          var hasImg = Array.isArray(msg.content) && msg.content.some(function(b){return b.type==="image";});
          return (
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start",gap:6}}>
              {!isUser && (
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <div style={{width:22,height:22,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:11,color:"#fff",fontStyle:"italic"}}>S</div>
                  <span style={{fontSize:11,color:"#374151",fontWeight:600}}>Sokrat</span>
                </div>
              )}
              {hasImg && (
                <div style={{background:"#141720",border:"1px solid #1E2330",borderRadius:10,padding:8,alignSelf:isUser?"flex-end":"flex-start"}}>
                  <span style={{fontSize:12,color:"#6B7280"}}>📎 Image envoyée</span>
                </div>
              )}
              {text && (
                <div style={{
                  maxWidth:"88%",
                  padding:"12px 16px",
                  borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",
                  background:isUser?"linear-gradient(135deg,#1E3A5F,#1A2E4A)":"#141720",
                  border:"1px solid "+(isUser?"rgba(99,179,237,0.2)":"#1E2330"),
                  fontSize:14,
                  lineHeight:1.75,
                  color:isUser?"#E8F4FD":"#D4D8E0"
                }} dangerouslySetInnerHTML={{__html:fmtMsg(text)}}/>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
            <div style={{width:22,height:22,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:11,color:"#fff",fontStyle:"italic",flexShrink:0}}>S</div>
            <div style={{background:"#141720",border:"1px solid #1E2330",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#3B82F6",animation:"skp 1.4s ease-in-out infinite"}}/>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#8B5CF6",animation:"skp 1.4s ease-in-out infinite",animationDelay:"0.2s"}}/>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#3B82F6",animation:"skp 1.4s ease-in-out infinite",animationDelay:"0.4s"}}/>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div style={{padding:"10px 14px",borderTop:"1px solid #1A1D26",flexShrink:0,background:"#0C0E12"}}>
        {imgData && (
          <div style={{marginBottom:8,position:"relative",display:"inline-block"}}>
            <img src={imgData} style={{maxHeight:90,borderRadius:8,border:"1px solid #2A2D35",display:"block"}}/>
            <button onClick={function(){setImgData(null);}}
              style={{position:"absolute",top:-6,right:-6,width:20,height:20,background:"#374151",border:"none",borderRadius:"50%",color:"#9CA3AF",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        )}
        <div style={{background:"#141720",border:"1.5px solid #1E2330",borderRadius:16,padding:"10px 12px",display:"flex",alignItems:"flex-end",gap:8}}>
          <label style={{cursor:"pointer",fontSize:18,color:"#374151",flexShrink:0,paddingBottom:2}} title="Envoyer une image d'exercice">
            📎
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={function(ev){
              var f=ev.target.files[0]; if(!f)return;
              var r=new FileReader();
              r.onload=function(e){setImgData(e.target.result);};
              r.readAsDataURL(f);
            }}/>
          </label>
          <textarea
            ref={taRef}
            value={input}
            onChange={function(ev){setInput(ev.target.value);}}
            onKeyDown={function(ev){if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();send();}}}
            placeholder="Pose ta question, envoie un exercice ou une photo..."
            rows={1}
            style={{flex:1,background:"transparent",border:"none",color:"#E0E4EA",fontSize:14,lineHeight:1.5,resize:"none",maxHeight:120,overflowY:"auto",fontFamily:"inherit",outline:"none"}}
            onInput={function(ev){ev.target.style.height="auto";ev.target.style.height=Math.min(ev.target.scrollHeight,120)+"px";}}
          />
          <button onClick={function(){send();}} disabled={loading||(!input.trim()&&!imgData)}
            style={{background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:(loading||(!input.trim()&&!imgData))?0.4:1,transition:"opacity 0.15s"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:6,fontSize:10,color:"#1F2937"}}>
          Sokrat ne donne jamais la réponse finale · Tu construis ton propre outil · BAC 2026
        </div>
      </div>
    </div>
  );
}
