import { useState, useRef, useEffect } from "react";
// eslint-disable-next-line
import {
  loginWithPhone,
  getMembers, addMember as dbAddMember, updateMember as dbUpdateMember, bulkAddMembers as dbBulkAdd,
  getFees, toggleFee as dbToggleFee,
  getPayments, submitPayment as dbSubmitPayment, approvePayment as dbApprovePayment, rejectPayment as dbRejectPayment,
  getIncome, addIncome as dbAddIncome, updateIncome as dbUpdateIncome, deleteIncome as dbDeleteIncome,
  getExpenses, addExpense as dbAddExpense, updateExpense as dbUpdateExpense, deleteExpense as dbDeleteExpense,
  getEvents, addEvent as dbAddEvent, updateEvent as dbUpdateEvent, deleteEvent as dbDeleteEvent, toggleAttendance as dbToggleAttendance,
  getAnnouncements, addAnnouncement as dbAddAnn, togglePinAnnouncement as dbTogglePin, deleteAnnouncement as dbDeleteAnn,
  getSettings, saveSettings as dbSaveSettings,
} from './supabase-integration';

// ─── THEME ────────────────────────────────────────────────────────────────────
const G = {
  bg:      "#060a06",
  bg2:     "#0d130d",
  bg3:     "#111a11",
  card:    "#131d13",
  border:  "#1e2e1e",
  border2: "#2a3d2a",
  green:   "#16a34a",
  green2:  "#22c55e",
  green3:  "#4ade80",
  greenDim:"#16a34a44",
  text:    "#e8f5e8",
  text2:   "#7a9a7a",
  text3:   "#4a6a4a",
  red:     "#f87171",
  redDim:  "#f8717122",
  gold:    "#f59e0b",
  blue:    "#38bdf8",
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEAR   = 2026;
const ROLE_META = {
  President: { color: "#f59e0b", icon: "👑" },
  Secretary:  { color: "#38bdf8", icon: "📋" },
  Treasurer:  { color: G.green2, icon: "💰" },
  Member:     { color: "#a78bfa", icon: "👤" },
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_SETTINGS = {
  monthlyDue: 100,
  clubName: "Brothers Thekkepuram",
  location: "Kanhangad, Kasaragod",
  founded: "2011",
  regNo: "Reg: 369/2016",
  gpayNumber: "9876543212",
  gpayName: "Rahul Das",
  upiId: "9876543212@okaxis",
  gpayQR: null,   // base64 image string — admin uploads via settings
  upiQR:  null,   // base64 image string — admin uploads via settings
};

const INIT_MEMBERS = [
  { id:1, name:"Arjun Nair",   phone:"9876543210", role:"President", pin:"1111", joined:"2023-01", active:true },
  { id:2, name:"Vishnu Kumar", phone:"9876543211", role:"Secretary", pin:"2222", joined:"2023-01", active:true },
  { id:3, name:"Rahul Das",    phone:"9876543212", role:"Treasurer", pin:"3333", joined:"2023-02", active:true },
  { id:4, name:"Sooraj P",     phone:"9876543213", role:"Member",    pin:"4444", joined:"2023-03", active:true },
  { id:5, name:"Amal Jose",    phone:"9876543214", role:"Member",    pin:"5555", joined:"2023-04", active:true },
  { id:6, name:"Nikhil Babu",  phone:"9876543215", role:"Member",    pin:"6666", joined:"2023-05", active:true },
  { id:7, name:"Sreejith K",   phone:"9876543216", role:"Member",    pin:"7777", joined:"2023-06", active:true },
];

function genFees(members) {
  const f = {};
  members.forEach(m => {
    f[m.id] = {};
    MONTHS.forEach((_,i) => { f[m.id][`${YEAR}-${i}`] = Math.random() > 0.38; });
  });
  return f;
}
const INIT_FEES = genFees(INIT_MEMBERS);

const INIT_EXPENSES = [
  { id:1, desc:"Hall Rent – January",  amount:1500, date:"2026-01-05", cat:"Rent",        addedBy:"Rahul Das" },
  { id:2, desc:"Cleaning Supplies",    amount:320,  date:"2026-01-15", cat:"Maintenance", addedBy:"Rahul Das" },
  { id:3, desc:"Hall Rent – February", amount:1500, date:"2026-02-05", cat:"Rent",        addedBy:"Rahul Das" },
  { id:4, desc:"Sports Equipment",     amount:850,  date:"2026-02-20", cat:"Equipment",   addedBy:"Arjun Nair" },
  { id:5, desc:"Hall Rent – March",    amount:1500, date:"2026-03-05", cat:"Rent",        addedBy:"Rahul Das" },
];

const INIT_INCOME = [
  { id:1, desc:"March Dues Collection",     amount:700,  date:"2026-03-25", cat:"Monthly Dues",  fromName:"",              addedBy:"Rahul Das",  notes:"7 members × ₹100" },
  { id:2, desc:"Ramadan Donation",          amount:500,  date:"2026-03-20", cat:"Donation",      fromName:"Mohammed Ali",  addedBy:"Rahul Das",  notes:"" },
  { id:3, desc:"Cricket Sponsor – Adidas",  amount:2000, date:"2026-03-15", cat:"Sponsorship",   fromName:"Adidas Store",  addedBy:"Arjun Nair", notes:"Banner display for 1 month" },
  { id:4, desc:"Cricket Match Entry Fees",  amount:300,  date:"2026-03-10", cat:"Event Income",  fromName:"",              addedBy:"Vishnu Kumar",notes:"30 spectators × ₹10" },
];

const INIT_ANNOUNCEMENTS = [
  { id:1, title:"Club Reopening! 🎉", body:"We are officially reopening. Let's keep it active this time. Monthly meetings every last Thursday.", postedBy:"Arjun Nair", date:"2026-03-15", pinned:true },
  { id:2, title:"March Dues Deadline", body:"Please pay your March dues before the 25th. Use the Pay Dues button in the app or contact Treasurer.", postedBy:"Vishnu Kumar", date:"2026-03-18", pinned:false },
];

const INIT_EVENTS = [
  { id:1, title:"Monthly Meeting",   date:"2026-03-28", time:"7:00 PM", location:"Club Hall",          desc:"March general body meeting", rsvp:{1:true,2:true,3:true} },
  { id:2, title:"Cricket Match",     date:"2026-04-05", time:"6:00 AM", location:"Ground, Kanhangad",  desc:"Friendly match vs local team", rsvp:{1:true,4:true} },
  { id:3, title:"Vishu Celebration", date:"2026-04-14", time:"5:00 PM", location:"Club Hall",          desc:"Annual Vishu get-together",   rsvp:{} },
];

// pending payments: { id, memberId, memberName, month, year, amount, method, note, screenshot, status:"pending"|"approved"|"rejected", submittedAt }
const INIT_PAYMENTS = [
  { id:1, memberId:4, memberName:"Sooraj P",    month:1, year:YEAR, amount:100, method:"GPay",  note:"", screenshot:null, status:"pending",  submittedAt:"2026-02-03" },
  { id:2, memberId:5, memberName:"Amal Jose",   month:2, year:YEAR, amount:100, method:"Cash",  note:"Paid to Rahul", screenshot:null, status:"approved", submittedAt:"2026-02-10" },
];

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────
const CAN = {
  markFees:          r => r==="President"||r==="Treasurer",
  approvePayment:    r => r==="President"||r==="Treasurer",
  addExpense:        r => r==="President"||r==="Treasurer",
  addMember:         r => r==="President"||r==="Secretary",
  editMember:        r => r==="President"||r==="Secretary",
  removeMember:      r => r==="President",
  changeRole:        r => r==="President",
  postAnnouncement:  r => r==="President"||r==="Secretary",
  pinAnnouncement:   r => r==="President",
  deleteAnnouncement:r => r==="President"||r==="Secretary",
  addEvent:          r => r==="President"||r==="Secretary",
  markAttendance:    r => r==="President"||r==="Secretary",
  changeSettings:    r => r==="President",
  changeDues:        r => r==="President"||r==="Treasurer",
  exportReport:      r => r==="President"||r==="Treasurer"||r==="Secretary",
  bulkImport:        r => r==="President"||r==="Secretary",
  addIncome:         r => r==="President"||r==="Secretary"||r==="Treasurer",
  editIncome:        r => r==="President"||r==="Treasurer",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ini(name) { return name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2); }
function paidCount(fees, id) { return MONTHS.filter((_,i)=>fees[id]?.[`${YEAR}-${i}`]).length; }

// ─── LOGO SVG — matches uploaded Brothers Thekkepuram shield ─────────────────
function BTLogo({ size=48 }) {
  // Shield shape: black outer, white band, black inner, green bottom
  // Circle with football + hand, 5 green stars, BT monogram bottom
  function star(cx, cy, r, n=5) {
    const pts = [];
    for (let i=0;i<n*2;i++) {
      const angle = (i*Math.PI/n) - Math.PI/2;
      const rad = i%2===0 ? r : r*0.42;
      pts.push(`${cx+rad*Math.cos(angle)},${cy+rad*Math.sin(angle)}`);
    }
    return pts.join(" ");
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
      {/* Outer black shield */}
      <path d="M50,3 L93,18 L93,62 Q93,88 50,107 Q7,88 7,62 L7,18 Z" fill="#111" stroke={G.green} strokeWidth="2.5"/>
      {/* White band */}
      <path d="M50,7 L89,21 L89,62 Q89,85 50,103 Q11,85 11,62 L11,21 Z" fill="white" stroke="none"/>
      {/* Inner black shield */}
      <path d="M50,11 L85,24 L85,62 Q85,82 50,99 Q15,82 15,62 L15,24 Z" fill="#111" stroke="none"/>
      {/* Green bottom accent */}
      <path d="M15,72 Q15,82 50,99 Q85,82 85,72 Z" fill={G.green} stroke="none"/>
      {/* "Since: 2011" top bar */}
      <rect x="22" y="12" width="56" height="10" rx="2" fill="#222" stroke={G.green} strokeWidth=".8"/>
      <text x="50" y="20" textAnchor="middle" fill="white" fontSize="5" fontFamily="monospace" fontWeight="bold">Since: 2011</text>
      {/* Circle background */}
      <circle cx="50" cy="46" r="22" fill="#1a1a1a" stroke={G.green} strokeWidth="1.5"/>
      {/* Hand (grey arc) */}
      <path d="M32,54 Q34,38 50,34 Q66,38 68,54" fill="none" stroke="#888" strokeWidth="3" strokeLinecap="round"/>
      {/* Football */}
      <circle cx="50" cy="44" r="11" fill="white" stroke="#333" strokeWidth="1"/>
      <path d="M50,33 L50,38 M42,36 L46,40 M58,36 L54,40 M39,44 L44,44 M56,44 L61,44 M42,52 L46,48 M58,52 L54,48 M50,55 L50,50" stroke="#222" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="50" cy="44" r="4" fill="#222"/>
      {/* Speed lines */}
      <path d="M63,38 L72,32 M65,43 L75,42" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
      {/* 5 green stars in ring */}
      {[0,1,2,3,4].map(i => {
        const a = (i/5)*Math.PI*2 - Math.PI/2;
        const rx=38, ry=36;
        return <polygon key={i} points={star(50+rx*Math.cos(a), 46+ry*Math.sin(a), 4)} fill={G.green}/>;
      })}
      {/* White name band */}
      <rect x="13" y="68" width="74" height="20" rx="0" fill="white"/>
      <text x="50" y="76" textAnchor="middle" fill="#111" fontSize="7.5" fontFamily="'Arial Black',sans-serif" fontWeight="900" letterSpacing="1">BROTHERS</text>
      <text x="50" y="84" textAnchor="middle" fill="#111" fontSize="7" fontFamily="'Arial Black',sans-serif" fontWeight="900" letterSpacing=".5">THEKKEPURAM</text>
      {/* BT monogram hexagon at bottom */}
      <polygon points="50,89 55,92 55,98 50,101 45,98 45,92" fill={G.green} stroke="#333" strokeWidth=".8"/>
      <text x="50" y="98" textAnchor="middle" fill="white" fontSize="6" fontFamily="monospace" fontWeight="bold">BT</text>
    </svg>
  );
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Av({ name, role, size=40 }) {
  const c = ROLE_META[role]?.color || G.green;
  return (
    <div style={{width:size,height:size,borderRadius:size*.28,flexShrink:0,background:`${c}18`,color:c,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",fontWeight:700,fontSize:size*.3,border:`1.5px solid ${c}44`}}>
      {ini(name)}
    </div>
  );
}
function Chip({ label, color }) {
  return <span style={{background:`${color}18`,color,border:`1px solid ${color}40`,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700}}>{label}</span>;
}
function Toast({ msg, type="success" }) {
  const bg = type==="error" ? G.red : G.green2;
  return msg ? <div style={{position:"fixed",top:18,right:18,background:bg,color:"#050a05",padding:"11px 20px",borderRadius:12,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:`0 8px 32px ${bg}55`,animation:"slideDown .3s ease"}}>
    {type==="error"?"✕":"✓"} {msg}
  </div> : null;
}
function Card({ children, style={}, onClick }) {
  return <div onClick={onClick} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,padding:18,...style}}>{children}</div>;
}
function Inp({ ...p }) {
  return <input {...p} style={{background:G.bg3,border:`1px solid ${G.border2}`,color:G.text,padding:"10px 14px",borderRadius:11,fontFamily:"'Sora',sans-serif",fontSize:13,width:"100%",outline:"none",...p.style}} />;
}
function Sel({ children, ...p }) {
  return <select {...p} style={{background:G.bg3,border:`1px solid ${G.border2}`,color:G.text,padding:"10px 14px",borderRadius:11,fontFamily:"'Sora',sans-serif",fontSize:13,width:"100%",outline:"none",...p.style}}>{children}</select>;
}
function Btn({ children, variant="green", style={}, ...p }) {
  const v = {
    green:  {background:G.green,color:"#fff",border:"none"},
    ghost:  {background:G.bg3,color:G.text2,border:`1px solid ${G.border2}`},
    danger: {background:G.redDim,color:G.red,border:`1px solid ${G.red}44`},
    blue:   {background:"#38bdf822",color:G.blue,border:"1px solid #38bdf844"},
    gold:   {background:"#f59e0b22",color:G.gold,border:"1px solid #f59e0b44"},
  };
  return <button {...p} style={{...v[variant],padding:"10px 18px",borderRadius:11,fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",...style}}>{children}</button>;
}
function Modal({ title, onClose, children, wide=false }) {
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:G.bg2,border:`1px solid ${G.border2}`,borderRadius:20,padding:24,width:"100%",maxWidth:wide?540:420,animation:"popIn .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontWeight:800,fontSize:16,color:G.text}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:G.text3,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Label({ children }) {
  return <div style={{fontSize:11,color:G.text2,fontWeight:600,marginBottom:6,letterSpacing:.5}}>{children}</div>;
}
function Divider() { return <div style={{height:1,background:G.border,margin:"12px 0"}} />; }

// ─── QR CODE (SVG placeholder that looks like a real QR) ─────────────────────
function QRCode({ value, size=180 }) {
  // Visual QR-like grid for demo (real QR needs a library)
  const seed = value.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const cells = 21;
  const grid = Array.from({length:cells*cells},(_,i)=>{
    const x=i%cells, y=Math.floor(i/cells);
    if((x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13)) return true; // finder patterns
    if(x===7||y===7||x===13||y===13) return (x+y)%2===0; // separators
    return ((seed*i*31+i*17)%7)<3;
  });
  const cell = size/cells;
  return (
    <svg width={size} height={size} style={{borderRadius:12,background:"white",padding:8}}>
      {grid.map((on,i)=> on ? <rect key={i} x={(i%cells)*cell} y={Math.floor(i/cells)*cell} width={cell} height={cell} fill="#000"/> : null)}
    </svg>
  );
}

// ─── PAY DUES MODAL ───────────────────────────────────────────────────────────
function PayDuesModal({ user, settings, selMonth, onSubmit, onClose, existingPayment }) {
  const [method, setMethod]   = useState("GPay");
  const [note, setNote]       = useState("");
  const [step, setStep]       = useState("choose"); // choose | qr | confirm
  const [screenshot, setScr]      = useState(null);
  const [screenshotData, setScrData] = useState(null);
  const fileRef = useRef();

  const monthName = MONTHS[selMonth];
  const gpayUPI   = settings.upiId || `${settings.gpayNumber}@okaxis`;

  if (existingPayment) return (
    <Modal title="Payment Status" onClose={onClose}>
      <div style={{textAlign:"center",padding:"16px 0"}}>
        <div style={{fontSize:40,marginBottom:12}}>
          {existingPayment.status==="approved"?"✅":existingPayment.status==="rejected"?"❌":"⏳"}
        </div>
        <div style={{fontWeight:700,fontSize:16,color:G.text,marginBottom:8}}>
          {existingPayment.status==="approved"?"Payment Approved!":existingPayment.status==="rejected"?"Payment Rejected":"Pending Verification"}
        </div>
        <div style={{fontSize:13,color:G.text2}}>
          {existingPayment.status==="pending"?"Your payment is being reviewed by the Treasurer.":""}
        </div>
        <div style={{background:G.bg3,borderRadius:12,padding:14,marginTop:16,textAlign:"left"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{color:G.text2,fontSize:12}}>Month</span>
            <span style={{color:G.text,fontSize:12,fontWeight:600}}>{MONTHS[existingPayment.month]} {existingPayment.year}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{color:G.text2,fontSize:12}}>Amount</span>
            <span style={{color:G.green2,fontSize:12,fontWeight:700}}>₹{existingPayment.amount}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{color:G.text2,fontSize:12}}>Method</span>
            <span style={{color:G.text,fontSize:12,fontWeight:600}}>{existingPayment.method}</span>
          </div>
        </div>
      </div>
    </Modal>
  );

  if (step==="choose") return (
    <Modal title={`Pay Dues — ${monthName} ${YEAR}`} onClose={onClose}>
      <div style={{background:G.bg3,borderRadius:12,padding:14,marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:G.text2}}>Amount Due</div>
        <div style={{fontSize:24,fontWeight:800,color:G.green2,fontFamily:"monospace"}}>₹{settings.monthlyDue}</div>
      </div>
      <Label>SELECT PAYMENT METHOD</Label>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {[
          {id:"GPay", icon:"📱", label:"Google Pay (GPay)", sub:"Scan QR code to pay"},
          {id:"UPI",  icon:"💳", label:"UPI (PhonePe / Paytm)", sub:"Use any UPI app"},
          {id:"Cash", icon:"💵", label:"Cash", sub:"Paid directly to Treasurer"},
        ].map(m=>(
          <div key={m.id} onClick={()=>setMethod(m.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,border:`2px solid ${method===m.id?G.green:G.border2}`,background:method===m.id?`${G.green}12`:G.bg3,cursor:"pointer",transition:"all .2s"}}>
            <div style={{fontSize:24}}>{m.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14,color:G.text}}>{m.label}</div>
              <div style={{fontSize:11,color:G.text2,marginTop:2}}>{m.sub}</div>
            </div>
            <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${method===m.id?G.green:G.border2}`,background:method===m.id?G.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{method===m.id?"✓":""}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn variant="ghost" style={{flex:1}} onClick={onClose}>Cancel</Btn>
        <Btn variant="green" style={{flex:2}} onClick={()=>setStep(method==="Cash"?"confirm":"qr")}>
          {method==="Cash"?"Confirm Cash Payment →":"Next: View QR →"}
        </Btn>
      </div>
    </Modal>
  );

  if (step==="qr") return (
    <Modal title={`Pay via ${method}`} onClose={onClose}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:12,color:G.text2,marginBottom:4}}>Pay to</div>
        <div style={{fontWeight:700,fontSize:16,color:G.text}}>{settings.gpayName}</div>
        <div style={{fontFamily:"monospace",fontSize:13,color:G.green2,marginTop:2}}>{gpayUPI}</div>
      </div>
      {/* QR — show admin-uploaded image or fallback UPI ID */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        {(method==="GPay"&&settings.gpayQR)||(method==="UPI"&&settings.upiQR)||settings.gpayQR ? (
          <div style={{background:"white",padding:10,borderRadius:16,boxShadow:`0 0 40px ${G.green}33`}}>
            <img src={method==="GPay"?(settings.gpayQR||settings.upiQR):(settings.upiQR||settings.gpayQR)} alt="QR Code" style={{width:180,height:180,borderRadius:10,objectFit:"contain",display:"block"}} />
          </div>
        ) : (
          <div style={{background:G.bg3,border:`2px dashed ${G.border2}`,borderRadius:16,padding:28,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:8}}>📵</div>
            <div style={{fontSize:13,color:G.text2,fontWeight:600}}>QR Not Set Up Yet</div>
            <div style={{fontSize:11,color:G.text3,marginTop:4}}>Admin needs to upload QR in Settings</div>
          </div>
        )}
      </div>
      <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:12,padding:12,marginBottom:16}}>
        <div style={{fontSize:11,color:G.text3,marginBottom:4}}>UPI ID — copy and pay manually if QR doesn't work</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontFamily:"monospace",fontSize:14,color:G.green2,fontWeight:700,flex:1}}>{gpayUPI}</div>
          <button onClick={()=>navigator.clipboard.writeText(gpayUPI)} style={{background:G.green,border:"none",color:"#fff",padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"Sora,sans-serif"}}>Copy</button>
        </div>
        <div style={{fontSize:11,color:G.text3,marginTop:6}}>Amount: <strong style={{color:G.green2}}>₹{settings.monthlyDue}</strong> · Pay to {settings.gpayName}</div>
      </div>
      <Label>UPLOAD PAYMENT SCREENSHOT</Label>
      <div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${screenshot?G.green:G.border2}`,borderRadius:12,padding:"20px",textAlign:"center",cursor:"pointer",background:screenshot?`${G.green}08`:G.bg3,marginBottom:16,transition:"all .2s"}}>
        {screenshot ? (
          <div>
            <div style={{fontSize:20,marginBottom:4}}>✅</div>
            <div style={{fontSize:12,color:G.green2,fontWeight:600}}>{screenshot.name}</div>
            <div style={{fontSize:11,color:G.text3,marginTop:2}}>Tap to change</div>
          </div>
        ) : (
          <div>
            <div style={{fontSize:28,marginBottom:6}}>📸</div>
            <div style={{fontSize:13,color:G.text2,fontWeight:600}}>Tap to upload screenshot</div>
            <div style={{fontSize:11,color:G.text3,marginTop:2}}>JPG, PNG supported</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
          const f=e.target.files[0]||null; setScr(f);
          if(f){const r=new FileReader();r.onload=ev=>setScrData(ev.target.result);r.readAsDataURL(f);}else setScrData(null);
        }} />
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn variant="ghost" style={{flex:1}} onClick={()=>setStep("choose")}>← Back</Btn>
        <Btn variant="green" style={{flex:2}} onClick={()=>setStep("confirm")}>Confirm →</Btn>
      </div>
    </Modal>
  );

  // confirm step
  return (
    <Modal title="Confirm Payment" onClose={onClose}>
      <div style={{background:G.bg3,borderRadius:14,padding:16,marginBottom:16}}>
        {[
          {l:"Member",  v:user.name},
          {l:"Month",   v:`${monthName} ${YEAR}`},
          {l:"Amount",  v:`₹${settings.monthlyDue}`, color:G.green2},
          {l:"Method",  v:method},
          {l:"Screenshot", v:screenshot?screenshot.name:"Not uploaded"},
        ].map(r=>(
          <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${G.border}`}}>
            <span style={{fontSize:12,color:G.text2}}>{r.l}</span>
            <span style={{fontSize:12,fontWeight:700,color:r.color||G.text}}>{r.v}</span>
          </div>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <Label>ADD A NOTE (OPTIONAL)</Label>
        <Inp placeholder="e.g. Paid at meeting, transaction ID..." value={note} onChange={e=>setNote(e.target.value)} />
      </div>
      <div style={{background:`${G.gold}12`,border:`1px solid ${G.gold}33`,borderRadius:10,padding:12,fontSize:12,color:G.text2,marginBottom:16}}>
        ⏳ Your payment will be reviewed and approved by the Treasurer or President.
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn variant="ghost" style={{flex:1}} onClick={()=>setStep(method==="Cash"?"choose":"qr")}>← Back</Btn>
        <Btn variant="green" style={{flex:2}} onClick={()=>onSubmit({method,note,screenshot:screenshot?.name||null,screenshotData})}>Submit Payment ✓</Btn>
      </div>
    </Modal>
  );
}

// ─── BULK IMPORT MODAL ────────────────────────────────────────────────────────
function BulkImportModal({ onImport, onClose }) {
  const [csv, setCsv]       = useState("");
  const [preview, setPreview] = useState([]);
  const [err, setErr]       = useState("");
  const fileRef = useRef();

  const SAMPLE = `name,phone,role,pin\nMohammed Ali,9876540001,Member,1234\nPriya Nair,9876540002,Member,2345\nSuresh Kumar,9876540003,Secretary,3456`;

  function parseCSV(text) {
    try {
      const lines = text.trim().split("\n").filter(Boolean);
      if (!lines.length) { setErr("Empty file"); return; }
      const headers = lines[0].toLowerCase().split(",").map(h=>h.trim());
      if (!headers.includes("name")||!headers.includes("phone")) { setErr("CSV must have 'name' and 'phone' columns"); return; }
      const rows = lines.slice(1).map(line=>{
        const vals = line.split(",").map(v=>v.trim());
        const obj = {};
        headers.forEach((h,i)=>{ obj[h]=vals[i]||""; });
        return { name:obj.name, phone:obj.phone, role:["President","Secretary","Treasurer","Member"].includes(obj.role)?obj.role:"Member", pin:obj.pin||"0000" };
      }).filter(r=>r.name&&r.phone);
      setPreview(rows);
      setErr("");
    } catch(e) { setErr("Could not parse CSV. Check format."); }
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => { setCsv(ev.target.result); parseCSV(ev.target.result); };
    reader.readAsText(f);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="btc_members_sample.csv"; a.click();
  }

  return (
    <Modal title="Bulk Import Members" onClose={onClose} wide>
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <Btn variant="ghost" style={{flex:1,fontSize:12}} onClick={downloadSample}>⬇ Download Sample CSV</Btn>
          <Btn variant="green" style={{flex:1,fontSize:12}} onClick={()=>fileRef.current.click()}>📁 Upload CSV</Btn>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{display:"none"}} onChange={handleFile} />
        <div style={{fontSize:11,color:G.text3,marginBottom:8}}>Or paste CSV directly:</div>
        <textarea value={csv} onChange={e=>{setCsv(e.target.value);parseCSV(e.target.value);}} placeholder={"name,phone,role,pin\nMohammed Ali,9876540001,Member,1234"} rows={4}
          style={{background:G.bg3,border:`1px solid ${G.border2}`,color:G.text,padding:"10px 14px",borderRadius:11,fontFamily:"monospace",fontSize:12,width:"100%",outline:"none",resize:"vertical"}} />
      </div>
      {err && <div style={{color:G.red,fontSize:12,marginBottom:12,background:G.redDim,padding:"8px 12px",borderRadius:8}}>{err}</div>}
      {preview.length>0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:G.green2,fontWeight:700,marginBottom:8}}>✓ {preview.length} members ready to import</div>
          <div style={{maxHeight:200,overflowY:"auto",background:G.bg3,borderRadius:12,border:`1px solid ${G.border2}`}}>
            {preview.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:12,padding:"10px 14px",borderBottom:`1px solid ${G.border}`,alignItems:"center"}}>
                <Av name={m.name} role={m.role} size={32} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:G.text}}>{m.name}</div>
                  <div style={{fontSize:11,color:G.text2,marginTop:1}}>{m.phone} · PIN: {m.pin}</div>
                </div>
                <Chip label={m.role} color={ROLE_META[m.role].color} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <Btn variant="ghost" style={{flex:1}} onClick={onClose}>Cancel</Btn>
        <Btn variant="green" style={{flex:2}} onClick={()=>preview.length&&onImport(preview)} disabled={!preview.length}>
          Import {preview.length>0?`${preview.length} Members`:""} →
        </Btn>
      </div>
    </Modal>
  );
}

// ─── PAYMENT APPROVAL CARD ────────────────────────────────────────────────────
function PaymentApprovalCard({ p, onApprove, onReject }) {
  const [showScr, setShowScr] = useState(false);
  const statusColor = p.status==="approved"?G.green2:p.status==="rejected"?G.red:G.gold;
  return (
    <div style={{background:G.bg3,border:`1px solid ${p.status==="pending"?`${G.gold}44`:G.border}`,borderRadius:14,padding:14,marginBottom:10}}>
      {/* Screenshot fullscreen viewer */}
      {showScr && p.screenshotData && (
        <div style={{position:"fixed",inset:0,background:"#000e",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowScr(false)}>
          <div style={{position:"relative",maxWidth:480,width:"100%"}}>
            <img src={p.screenshotData} alt="Payment screenshot" style={{width:"100%",borderRadius:16,boxShadow:"0 20px 60px #000a"}} />
            <button onClick={()=>setShowScr(false)} style={{position:"absolute",top:-12,right:-12,background:G.red,border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",fontSize:16,cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:G.text}}>{p.memberName}</div>
          <div style={{fontSize:12,color:G.text2,marginTop:2}}>{MONTHS[p.month]} {p.year} · {p.method} · ₹{p.amount}</div>
          {p.note&&<div style={{fontSize:11,color:G.text3,marginTop:2,fontStyle:"italic"}}>"{p.note}"</div>}
          <div style={{fontSize:11,color:G.text3,marginTop:2}}>{p.submittedAt}</div>
        </div>
        <Chip label={p.status.toUpperCase()} color={statusColor} />
      </div>
      {/* Screenshot preview */}
      {p.screenshotData ? (
        <div style={{marginBottom:10,cursor:"pointer"}} onClick={()=>setShowScr(true)}>
          <img src={p.screenshotData} alt="Payment proof" style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:10,border:`1px solid ${G.border2}`}} />
          <div style={{fontSize:11,color:G.blue,marginTop:4,textAlign:"center"}}>👆 Tap to view full screenshot</div>
        </div>
      ) : (
        <div style={{background:G.bg,borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:12,color:G.text3,textAlign:"center",border:`1px solid ${G.border}`}}>
          {p.method==="Cash"?"💵 Cash payment — no screenshot needed":"📵 No screenshot uploaded"}
        </div>
      )}
      {p.status==="pending"&&(
        <div style={{display:"flex",gap:8}}>
          <Btn variant="danger" style={{flex:1,padding:"7px",fontSize:12}} onClick={()=>onReject(p.id)}>✕ Reject</Btn>
          <Btn variant="green" style={{flex:2,padding:"7px",fontSize:12}} onClick={()=>onApprove(p.id)}>✓ Approve</Btn>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ members, settings, onLogin }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin]     = useState("");
  const [err, setErr]     = useState("");
  const [found, setFound] = useState(null);

  function handlePhone(val) {
    const v = val.replace(/\D/g,"").slice(0,10);
    setPhone(v); setErr("");
    setFound(members.find(m=>m.active&&m.phone===v)||null);
  }
  function handlePin(val) { setPin(val.replace(/\D/g,"").slice(0,4)); setErr(""); }
  function tryLogin() {
    if (!found)          { setErr("Phone number not registered."); return; }
    if (pin.length!==4)  { setErr("Enter your 4-digit PIN."); return; }
    if (pin!==found.pin) { setErr("Wrong PIN. Try again."); setPin(""); return; }
    onLogin(found);
  }

  const rc = found ? ROLE_META[found.role].color : G.green;

  return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      {/* bg decoration */}
      <div style={{position:"fixed",top:"-10%",left:"50%",transform:"translateX(-50%)",width:400,height:400,borderRadius:"50%",background:`${G.green}06`,filter:"blur(80px)",pointerEvents:"none"}} />
      <div style={{position:"fixed",bottom:"-10%",left:"50%",transform:"translateX(-50%)",width:300,height:300,borderRadius:"50%",background:`${G.green}04`,filter:"blur(60px)",pointerEvents:"none"}} />

      <div style={{width:"100%",maxWidth:360,position:"relative"}}>
        {/* Logo & Title */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
            <div style={{background:G.bg2,border:`2px solid ${G.green}`,borderRadius:20,padding:12,boxShadow:`0 0 40px ${G.green}33`}}>
              <BTLogo size={64} />
            </div>
          </div>
          <div style={{fontSize:11,color:G.green2,fontFamily:"monospace",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Since 2011</div>
          <div style={{fontSize:26,fontWeight:800,color:G.text,letterSpacing:"-0.5px",fontFamily:"'Sora',sans-serif"}}>Brothers Thekkepuram</div>
          <div style={{color:G.text3,fontSize:12,marginTop:4,fontFamily:"monospace",letterSpacing:1}}>KANHANGAD · KASARAGOD</div>
          <div style={{color:G.text3,fontSize:10,marginTop:2,fontFamily:"monospace"}}>{settings.regNo}</div>
        </div>

        {/* Login Card */}
        <div style={{background:G.card,border:`1px solid ${G.border2}`,borderRadius:20,padding:24,boxShadow:`0 20px 60px #000a`}}>
          {/* Member preview */}
          {found ? (
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,background:`${rc}12`,border:`1px solid ${rc}30`,borderRadius:12,padding:"11px 14px",animation:"slideDown .3s ease"}}>
              <Av name={found.name} role={found.role} size={42} />
              <div>
                <div style={{fontWeight:700,fontSize:14,color:G.text}}>{found.name}</div>
                <div style={{marginTop:4}}><Chip label={found.role} color={rc} /></div>
              </div>
            </div>
          ) : phone.length===10 ? (
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,background:G.redDim,border:`1px solid ${G.red}33`,borderRadius:12,padding:"11px 14px"}}>
              <span style={{fontSize:18}}>❌</span>
              <span style={{fontSize:13,color:G.red}}>Number not registered.</span>
            </div>
          ) : null}

          {/* Phone */}
          <div style={{marginBottom:14}}>
            <Label>PHONE NUMBER</Label>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:13,color:G.text3,fontFamily:"monospace"}}>+91</div>
              <input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e=>handlePhone(e.target.value)} placeholder="98765 43210"
                style={{background:G.bg3,border:`1px solid ${found?G.green+`88`:phone.length===10?G.red+`66`:G.border2}`,color:G.text,padding:"12px 14px 12px 50px",borderRadius:11,fontFamily:"monospace",fontSize:15,width:"100%",outline:"none",letterSpacing:2,transition:"border .2s"}} />
            </div>
          </div>

          {/* PIN */}
          <div style={{marginBottom:18}}>
            <Label>4-DIGIT PIN</Label>
            <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:10}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:12,height:12,borderRadius:"50%",background:i<pin.length?rc:G.border2,transition:"all .15s",boxShadow:i<pin.length?`0 0 8px ${rc}99`:"none"}} />
              ))}
            </div>
            <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e=>handlePin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="••••"
              style={{background:G.bg3,border:`1px solid ${pin.length===4?rc+"66":G.border2}`,color:G.text,padding:"12px 14px",borderRadius:11,fontFamily:"monospace",fontSize:22,width:"100%",outline:"none",textAlign:"center",letterSpacing:10,transition:"border .2s"}} />
          </div>

          {err&&<div style={{color:G.red,fontSize:12,marginBottom:12,textAlign:"center",background:G.redDim,padding:"8px 12px",borderRadius:8}}>{err}</div>}

          <button onClick={tryLogin} style={{width:"100%",padding:13,borderRadius:12,background:found&&pin.length===4?G.green:G.bg3,color:found&&pin.length===4?"#fff":G.text3,border:`1px solid ${found&&pin.length===4?G.green:G.border2}`,fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:15,cursor:"pointer",transition:"all .3s",boxShadow:found&&pin.length===4?`0 4px 20px ${G.green}55`:"none"}}>
            {found&&pin.length===4?`Login as ${found.name.split(" ")[0]} →`:"Login"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:14,color:G.text3,fontSize:11,fontFamily:"monospace"}}>Contact admin if you forgot your PIN</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(null);
  const [members, setMembers]   = useState(INIT_MEMBERS);
  const [fees, setFees]         = useState(INIT_FEES);
  const [expenses, setExpenses] = useState(INIT_EXPENSES);
  const [income, setIncome]     = useState(INIT_INCOME);
  const [announcements, setAnn] = useState(INIT_ANNOUNCEMENTS);
  const [events, setEvents]     = useState(INIT_EVENTS);
  const [settings, setSettings] = useState(INIT_SETTINGS);
  const [payments, setPayments] = useState(INIT_PAYMENTS);
  const [tab, setTab]           = useState("home");
  const [toast, setToast]       = useState(null);
  const [toastType, setToastType] = useState("success");
  const [selMonth, setSelMonth] = useState(2);
  const [modal, setModal]       = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // forms
  const [mForm,   setMForm]   = useState({name:"",phone:"",role:"Member",pin:""});
  const [expForm, setExpForm] = useState({desc:"",amount:"",date:"",cat:"Rent"});
  const [incForm, setIncForm] = useState({desc:"",amount:"",date:"",cat:"Donation",fromName:"",notes:""});
  const [evForm,  setEvForm]  = useState({title:"",date:"",time:"",location:"",desc:""});
  const [annForm, setAnnForm] = useState({title:"",body:""});
  const [pinForm, setPinForm] = useState({old:"",new1:"",new2:""});
  const [pinErr,  setPinErr]  = useState("");
  const [settForm, setSettForm] = useState({...INIT_SETTINGS});

  // ── LOAD ALL DATA FROM SUPABASE ON STARTUP ──
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function loadAll() {
      try {
        const [m, f, ex, inc, pay, ev, ann, sett] = await Promise.all([
          getMembers(), getFees(YEAR), getExpenses(), getIncome(),
          getPayments(), getEvents(), getAnnouncements(), getSettings()
        ]);
        if (m && m.length)   setMembers(m);
        if (f)               setFees(f);
        if (ex && ex.length) setExpenses(ex);
        if (inc && inc.length) setIncome(inc);
        if (pay && pay.length) setPayments(pay);
        if (ev && ev.length)  setEvents(ev);
        if (ann && ann.length) setAnn(ann);
        if (sett) setSettings(s => ({...s,
          monthlyDue: sett.monthly_due  || s.monthlyDue,
          clubName:   sett.club_name    || s.clubName,
          gpayNumber: sett.gpay_number  || s.gpayNumber,
          gpayName:   sett.gpay_name    || s.gpayName,
          upiId:      sett.upi_id       || s.upiId,
          gpayQR:     sett.gpay_qr_url  || s.gpayQR,
          upiQR:      sett.upi_qr_url   || s.upiQR,
          regNo:      sett.reg_no       || s.regNo,
          founded:    sett.founded      || s.founded,
          location:   sett.location     || s.location,
        }));
      } catch(e) { console.error("Supabase load error:", e); }
      setLoading(false);
    }
    loadAll();
  }, []); // eslint-disable-line

  const role          = user?.role;
  const activeMembers = members.filter(m=>m.active);
  const due           = settings.monthlyDue;
  const totalCollected= activeMembers.reduce((s,m)=>s+paidCount(fees,m.id)*due,0);
  const totalExp      = expenses.reduce((s,e)=>s+e.amount,0);
  const totalIncome   = income.reduce((s,i)=>s+i.amount,0);
  const balance       = totalCollected + totalIncome - totalExp;
  const monthDefaulters = activeMembers.filter(m=>!fees[m.id]?.[`${YEAR}-${selMonth}`]);
  const monthPaid       = activeMembers.filter(m=> fees[m.id]?.[`${YEAR}-${selMonth}`]);
  const pendingPayments = payments.filter(p=>p.status==="pending");
  const myPendingPay    = user ? payments.find(p=>p.memberId===user.id&&p.month===selMonth&&p.year===YEAR) : null;

  function notify(msg, type="success") { setToast(msg); setToastType(type); setTimeout(()=>setToast(null),2500); }
  function closeModal() { setModal(null); setEditTarget(null); setPinErr(""); }

  // payment actions
  async function submitPayment({method,note,screenshotData}) {
    try {
      // Convert base64 to File for upload if screenshot exists
      let screenshotFile = null;
      if (screenshotData) {
        const res = await fetch(screenshotData);
        const blob = await res.blob();
        screenshotFile = new File([blob], `payment_${Date.now()}.jpg`, {type:"image/jpeg"});
      }
      await dbSubmitPayment({
        member_id: user.id, member_name: user.name,
        month: selMonth, year: YEAR, amount: due,
        method, note: note||"", status:"pending"
      }, screenshotFile);
      getPayments().then(setPayments);
      closeModal();
      notify("Payment submitted! Awaiting approval.");
    } catch(e) { notify("Error submitting payment. Try again.","error"); }
  }

  async function approvePayment(id) {
    const p = payments.find(x=>x.id===id);
    if (!p) return;
    try {
      await dbApprovePayment(id, user.name, p.member_id||p.memberId, p.year, p.month);
      getPayments().then(setPayments);
      getFees(YEAR).then(setFees);
      notify("Payment approved!");
    } catch(e) { notify("Error approving. Try again.","error"); }
  }

  async function rejectPayment(id) {
    try {
      await dbRejectPayment(id, user.name);
      getPayments().then(setPayments);
      notify("Payment rejected.", "error");
    } catch(e) { notify("Error rejecting. Try again.","error"); }
  }

  // member actions
  async function saveMember() {
    if (!mForm.name.trim()||!mForm.pin||mForm.pin.length!==4) { notify("Fill all fields. PIN must be 4 digits.","error"); return; }
    try {
      if (editTarget) {
        await dbUpdateMember(editTarget.id, mForm);
        notify("Member updated!");
      } else {
        if (members.find(m=>m.phone===mForm.phone)) { notify("Phone number already exists!","error"); return; }
        await dbAddMember({...mForm, joined:`${YEAR}-03`, active:true});
        notify(`${mForm.name} added!`);
      }
      getMembers().then(setMembers);
      getFees(YEAR).then(setFees);
    } catch(e) { notify("Error saving member. Try again.","error"); return; }
    setMForm({name:"",phone:"",role:"Member",pin:""}); closeModal();
  }

  async function bulkImport(rows) {
    try {
      const added = await dbBulkAdd(rows.map(r=>({...r,joined:`${YEAR}-03`,active:true})));
      await getMembers().then(setMembers);
      await getFees(YEAR).then(setFees);
      closeModal();
      notify(`${added.length} members imported!`);
    } catch(e) { notify("Import failed. Try again.","error"); }
  }

  async function saveExpense() {
    if (!expForm.desc.trim()||!expForm.amount||!expForm.date) return;
    try {
      if (editTarget) {
        await dbUpdateExpense(editTarget.id, {description:expForm.desc, amount:Number(expForm.amount), date:expForm.date, category:expForm.cat});
        notify("Expense updated!");
      } else {
        await dbAddExpense({description:expForm.desc, amount:Number(expForm.amount), date:expForm.date, category:expForm.cat, added_by:user.name});
        notify("Expense added!");
      }
      getExpenses().then(setExpenses);
    } catch(e) { notify("Error saving expense.","error"); return; }
    setExpForm({desc:"",amount:"",date:"",cat:"Rent"}); closeModal();
  }

  async function saveIncome() {
    if (!incForm.desc.trim()||!incForm.amount||!incForm.date) { notify("Fill all required fields.","error"); return; }
    try {
      if (editTarget) {
        await dbUpdateIncome(editTarget.id, {description:incForm.desc, amount:Number(incForm.amount), date:incForm.date, category:incForm.cat, from_name:incForm.fromName, notes:incForm.notes});
        notify("Income updated!");
      } else {
        await dbAddIncome({description:incForm.desc, amount:Number(incForm.amount), date:incForm.date, category:incForm.cat, from_name:incForm.fromName||"", notes:incForm.notes||"", added_by:user.name});
        notify("Income entry added!");
      }
      getIncome().then(setIncome);
    } catch(e) { notify("Error saving income.","error"); return; }
    setIncForm({desc:"",amount:"",date:"",cat:"Donation",fromName:"",notes:""}); closeModal();
  }

  async function saveEvent() {
    if (!evForm.title.trim()||!evForm.date) return;
    try {
      if (editTarget) {
        await dbUpdateEvent(editTarget.id, {title:evForm.title, date:evForm.date, time:evForm.time, location:evForm.location, description:evForm.desc});
      } else {
        await dbAddEvent({title:evForm.title, date:evForm.date, time:evForm.time, location:evForm.location, description:evForm.desc, created_by:user.name});
      }
      getEvents().then(setEvents);
      notify("Event saved!");
    } catch(e) { notify("Error saving event.","error"); return; }
    setEvForm({title:"",date:"",time:"",location:"",desc:""}); closeModal();
  }

  async function postAnn() {
    if (!annForm.title.trim()||!annForm.body.trim()) return;
    try {
      await dbAddAnn({title:annForm.title, body:annForm.body, posted_by:user.name, pinned:false});
      getAnnouncements().then(setAnn);
      setAnnForm({title:"",body:""}); closeModal(); notify("Announcement posted!");
    } catch(e) { notify("Error posting announcement.","error"); }
  }

  async function changePin() {
    if (pinForm.old!==user.pin)    { setPinErr("Current PIN is wrong."); return; }
    if (pinForm.new1.length!==4)   { setPinErr("New PIN must be 4 digits."); return; }
    if (pinForm.new1!==pinForm.new2){ setPinErr("PINs don't match."); return; }
    try {
      await dbUpdateMember(user.id, {pin:pinForm.new1});
      const updated={...user,pin:pinForm.new1};
      setUser(updated);
      getMembers().then(setMembers);
      setPinForm({old:"",new1:"",new2:""}); closeModal(); notify("PIN changed!");
    } catch(e) { setPinErr("Error changing PIN. Try again."); }
  }

  function exportReport() {
    const lines=[
      `BROTHERS THEKKEPURAM CLUB — FEE REPORT`,`${MONTHS[selMonth]} ${YEAR}`,`Generated: ${new Date().toLocaleDateString()}`,``,
      `SUMMARY`,`Expected : ₹${activeMembers.length*due}`,`Collected: ₹${monthPaid.length*due}`,`Pending  : ₹${monthDefaulters.length*due}`,``,
      `PAID`,   ...monthPaid.map(m=>`  ✓ ${m.name} (${m.role})`),``,
      `PENDING`,...monthDefaulters.map(m=>`  ✗ ${m.name} — ${m.phone}`),``,
      `FULL YEAR`,...activeMembers.map(m=>`  ${m.name.padEnd(18)} ${paidCount(fees,m.id)}/12 — ₹${paidCount(fees,m.id)*due}`),
    ];
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/plain"}));
    a.download=`BTC_${MONTHS[selMonth]}${YEAR}.txt`; a.click(); notify("Report exported!");
  }

  function generateWhatsApp() {
    if (!monthDefaulters.length) { notify("No defaulters this month!"); return; }
    const msg=`🏠 *${settings.clubName}*\n\nPending dues for *${MONTHS[selMonth]} ${YEAR}*:\n\n${monthDefaulters.map((d,i)=>`${i+1}. ${d.name}`).join("\n")}\n\nMonthly due: ₹${due}\nPay via app or contact Treasurer.\n\nThank you 🙏`;
    navigator.clipboard.writeText(msg); notify("WhatsApp message copied!");
  }

  const NAV = [
    {id:"home",   icon:"⌂",  label:"Home"},
    {id:"fees",   icon:"₹",  label:"Fees"},
    {id:"ledger", icon:"📒", label:"Ledger"},
    {id:"events", icon:"📅", label:"Events"},
    {id:"notice", icon:"📢", label:"Notice"},
    ...(CAN.addMember(role)||CAN.markFees(role)||CAN.changeSettings(role)?[{id:"admin",icon:"⚙",label:"Admin"}]:[]),
    {id:"profile",icon:"◉",  label:"Me"},
  ];

  if (loading) return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <BTLogo size={64} />
      <div style={{fontSize:13,color:G.text3,fontFamily:"monospace",letterSpacing:2,animation:"fadeIn 1s infinite alternate"}}>LOADING...</div>
    </div>
  );
  if (!user) return <LoginScreen members={members} settings={settings} onLogin={m=>{setUser(m);setTab("home");}} />;

  const rc = ROLE_META[role].color;

  return (
    <div style={{fontFamily:"'Sora',sans-serif",background:G.bg,minHeight:"100vh",color:G.text,paddingBottom:76}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${G.border2}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        .fade{animation:fadeIn .25s ease}
        button:active{transform:scale(.97)}
      `}</style>

      <Toast msg={toast} type={toastType} />

      {/* ── MODALS ── */}
      {(modal==="addMember"||modal==="editMember")&&(
        <Modal title={modal==="editMember"?"Edit Member":"Add Member"} onClose={closeModal}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Label>FULL NAME</Label><Inp placeholder="Full Name" value={mForm.name} onChange={e=>setMForm(p=>({...p,name:e.target.value}))} /></div>
            <div><Label>PHONE</Label><Inp placeholder="10-digit phone" value={mForm.phone} onChange={e=>setMForm(p=>({...p,phone:e.target.value.replace(/\D/g,"").slice(0,10)}))} /></div>
            <div><Label>ROLE</Label>
              <Sel value={mForm.role} onChange={e=>setMForm(p=>({...p,role:e.target.value}))}>
                <option>Member</option>
                {CAN.changeRole(role)&&<><option>Secretary</option><option>Treasurer</option><option>President</option></>}
              </Sel>
            </div>
            <div><Label>4-DIGIT PIN</Label><Inp placeholder="e.g. 1234" maxLength={4} value={mForm.pin} onChange={e=>setMForm(p=>({...p,pin:e.target.value.replace(/\D/g,"")}))} /></div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn variant="ghost" style={{flex:1}} onClick={closeModal}>Cancel</Btn>
              <Btn variant="green" style={{flex:2}} onClick={saveMember}>{modal==="editMember"?"Save":"Add Member"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {modal==="bulkImport"&&<BulkImportModal onImport={bulkImport} onClose={closeModal} />}

      {modal==="payDues"&&(
        <PayDuesModal user={user} settings={settings} selMonth={selMonth} onSubmit={submitPayment} onClose={closeModal} existingPayment={myPendingPay} />
      )}

      {(modal==="addExpense"||modal==="editExpense")&&(
        <Modal title={modal==="editExpense"?"Edit Expense":"Add Expense"} onClose={closeModal}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Label>DESCRIPTION</Label><Inp placeholder="e.g. Hall Rent – April" value={expForm.desc} onChange={e=>setExpForm(p=>({...p,desc:e.target.value}))} /></div>
            <div><Label>AMOUNT (₹)</Label><Inp type="number" placeholder="Amount" value={expForm.amount} onChange={e=>setExpForm(p=>({...p,amount:e.target.value}))} /></div>
            <div><Label>DATE</Label><Inp type="date" value={expForm.date} onChange={e=>setExpForm(p=>({...p,date:e.target.value}))} /></div>
            <div><Label>CATEGORY</Label>
              <Sel value={expForm.cat} onChange={e=>setExpForm(p=>({...p,cat:e.target.value}))}>
                {["Rent","Maintenance","Equipment","Event","Salary","Miscellaneous"].map(c=><option key={c}>{c}</option>)}
              </Sel>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn variant="ghost" style={{flex:1}} onClick={closeModal}>Cancel</Btn>
              <Btn variant="green" style={{flex:2}} onClick={saveExpense}>{modal==="editExpense"?"Save":"Add"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {(modal==="addIncome"||modal==="editIncome")&&(
        <Modal title={modal==="editIncome"?"Edit Income":"Add Income"} onClose={closeModal}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Label>DESCRIPTION</Label><Inp placeholder="e.g. Ramadan Donation" value={incForm.desc} onChange={e=>setIncForm(p=>({...p,desc:e.target.value}))} /></div>
            <div><Label>AMOUNT (₹)</Label><Inp type="number" placeholder="Amount received" value={incForm.amount} onChange={e=>setIncForm(p=>({...p,amount:e.target.value}))} /></div>
            <div><Label>DATE</Label><Inp type="date" value={incForm.date} onChange={e=>setIncForm(p=>({...p,date:e.target.value}))} /></div>
            <div><Label>CATEGORY</Label>
              <Sel value={incForm.cat} onChange={e=>setIncForm(p=>({...p,cat:e.target.value}))}>
                {["Donation","Sponsorship","Event Income","Monthly Dues","Miscellaneous"].map(c=><option key={c}>{c}</option>)}
              </Sel>
            </div>
            <div><Label>FROM (NAME / ORGANIZATION)</Label><Inp placeholder="e.g. Adidas Store, Mohammed Ali..." value={incForm.fromName} onChange={e=>setIncForm(p=>({...p,fromName:e.target.value}))} /></div>
            <div><Label>NOTES (OPTIONAL)</Label><Inp placeholder="Any extra details..." value={incForm.notes} onChange={e=>setIncForm(p=>({...p,notes:e.target.value}))} /></div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn variant="ghost" style={{flex:1}} onClick={closeModal}>Cancel</Btn>
              <Btn variant="green" style={{flex:2}} onClick={saveIncome}>{modal==="editIncome"?"Save":"Add Income"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {(modal==="addEvent"||modal==="editEvent")&&(
        <Modal title={modal==="editEvent"?"Edit Event":"Add Event"} onClose={closeModal}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Label>TITLE</Label><Inp placeholder="Event title" value={evForm.title} onChange={e=>setEvForm(p=>({...p,title:e.target.value}))} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Label>DATE</Label><Inp type="date" value={evForm.date} onChange={e=>setEvForm(p=>({...p,date:e.target.value}))} /></div>
              <div><Label>TIME</Label><Inp placeholder="7:00 PM" value={evForm.time} onChange={e=>setEvForm(p=>({...p,time:e.target.value}))} /></div>
            </div>
            <div><Label>LOCATION</Label><Inp placeholder="Club Hall / Ground..." value={evForm.location} onChange={e=>setEvForm(p=>({...p,location:e.target.value}))} /></div>
            <div><Label>DESCRIPTION</Label><Inp placeholder="Optional" value={evForm.desc} onChange={e=>setEvForm(p=>({...p,desc:e.target.value}))} /></div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn variant="ghost" style={{flex:1}} onClick={closeModal}>Cancel</Btn>
              <Btn variant="green" style={{flex:2}} onClick={saveEvent}>{modal==="editEvent"?"Save":"Create"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {modal==="postAnn"&&(
        <Modal title="Post Announcement" onClose={closeModal}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Label>TITLE</Label><Inp placeholder="Announcement title" value={annForm.title} onChange={e=>setAnnForm(p=>({...p,title:e.target.value}))} /></div>
            <div><Label>MESSAGE</Label>
              <textarea value={annForm.body} onChange={e=>setAnnForm(p=>({...p,body:e.target.value}))} placeholder="Write your message..." rows={4}
                style={{background:G.bg3,border:`1px solid ${G.border2}`,color:G.text,padding:"10px 14px",borderRadius:11,fontFamily:"'Sora',sans-serif",fontSize:13,width:"100%",outline:"none",resize:"vertical"}} />
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn variant="ghost" style={{flex:1}} onClick={closeModal}>Cancel</Btn>
              <Btn variant="green" style={{flex:2}} onClick={postAnn}>Post</Btn>
            </div>
          </div>
        </Modal>
      )}

      {modal==="myPin"&&(
        <Modal title="Change My PIN" onClose={closeModal}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><Label>CURRENT PIN</Label><Inp type="password" maxLength={4} placeholder="Current PIN" value={pinForm.old} onChange={e=>setPinForm(p=>({...p,old:e.target.value.replace(/\D/g,"")}))} /></div>
            <div><Label>NEW PIN</Label><Inp type="password" maxLength={4} placeholder="New 4-digit PIN" value={pinForm.new1} onChange={e=>setPinForm(p=>({...p,new1:e.target.value.replace(/\D/g,"")}))} /></div>
            <div><Label>CONFIRM NEW PIN</Label><Inp type="password" maxLength={4} placeholder="Repeat new PIN" value={pinForm.new2} onChange={e=>setPinForm(p=>({...p,new2:e.target.value.replace(/\D/g,"")}))} /></div>
            {pinErr&&<div style={{color:G.red,fontSize:12,background:G.redDim,padding:"8px 12px",borderRadius:8}}>{pinErr}</div>}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn variant="ghost" style={{flex:1}} onClick={closeModal}>Cancel</Btn>
              <Btn variant="green" style={{flex:2}} onClick={changePin}>Change PIN</Btn>
            </div>
          </div>
        </Modal>
      )}

      {modal==="settings"&&(
        <Modal title="Club Settings" onClose={closeModal}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[
              {l:"CLUB NAME",      k:"clubName",   t:"text"},
              {l:"LOCATION",       k:"location",   t:"text"},
              {l:"FOUNDED YEAR",   k:"founded",    t:"text"},
              {l:"REG NUMBER",     k:"regNo",      t:"text"},
              {l:"MONTHLY DUE (₹)",k:"monthlyDue", t:"number"},
              {l:"GPAY / UPI NUMBER", k:"gpayNumber", t:"tel"},
              {l:"GPAY / UPI NAME",   k:"gpayName",   t:"text"},
              {l:"UPI ID (e.g. 98765@okaxis)", k:"upiId", t:"text"},
            ].map(f=>(
              <div key={f.k}><Label>{f.l}</Label>
                <Inp type={f.t} value={settForm[f.k]||""} onChange={e=>setSettForm(p=>({...p,[f.k]:f.t==="number"?Number(e.target.value):e.target.value}))} />
              </div>
            ))}
            {/* QR image uploads */}
            {[
              {l:"GPAY QR CODE IMAGE", k:"gpayQR"},
              {l:"UPI QR CODE IMAGE",  k:"upiQR"},
            ].map(f=>(
              <div key={f.k}>
                <Label>{f.l}</Label>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  {settForm[f.k] && <img src={settForm[f.k]} alt="QR" style={{width:56,height:56,borderRadius:8,objectFit:"contain",background:"white",padding:4}} />}
                  <label style={{flex:1,background:G.bg3,border:`1px dashed ${G.border2}`,borderRadius:11,padding:"10px 14px",cursor:"pointer",fontSize:12,color:G.text3,textAlign:"center",display:"block"}}>
                    {settForm[f.k]?"✓ QR Uploaded — tap to change":"📷 Upload QR Image"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                      const file=e.target.files[0]; if(!file) return;
                      const reader=new FileReader();
                      reader.onload=ev=>setSettForm(p=>({...p,[f.k]:ev.target.result}));
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                  {settForm[f.k]&&<button onClick={()=>setSettForm(p=>({...p,[f.k]:null}))} style={{background:G.redDim,border:"none",color:G.red,borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:13}}>✕</button>}
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn variant="ghost" style={{flex:1}} onClick={closeModal}>Cancel</Btn>
              <Btn variant="green" style={{flex:2}} onClick={async()=>{
                try {
                  const updates = {
                    club_name:settForm.clubName, location:settForm.location,
                    founded:settForm.founded, reg_no:settForm.regNo,
                    monthly_due:settForm.monthlyDue, gpay_number:settForm.gpayNumber,
                    gpay_name:settForm.gpayName, upi_id:settForm.upiId,
                    gpay_qr_url:settForm.gpayQR, upi_qr_url:settForm.upiQR,
                  };
                  await dbSaveSettings(updates);
                  setSettings(settForm); closeModal(); notify("Settings saved!");
                } catch(e) { notify("Error saving settings.","error"); }
              }}>Save</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── HEADER ── */}
      <div style={{borderBottom:`1px solid ${G.border}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,background:`${G.bg}ee`,backdropFilter:"blur(16px)",zIndex:100}}>
        <BTLogo size={32} />
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:14,letterSpacing:"-0.3px"}}>{settings.clubName}</div>
          <div style={{fontSize:10,color:G.text3,fontFamily:"monospace",marginTop:1,letterSpacing:.5}}>{settings.location}</div>
        </div>
        {pendingPayments.length>0&&CAN.approvePayment(role)&&(
          <div style={{background:`${G.gold}22`,border:`1px solid ${G.gold}44`,borderRadius:8,padding:"4px 10px",fontSize:11,color:G.gold,fontWeight:700}}>
            {pendingPayments.length} pending
          </div>
        )}
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:rc,fontWeight:700}}>{ROLE_META[role].icon} {role}</div>
          <div style={{fontSize:10,color:G.text3,fontFamily:"monospace"}}>{user.name.split(" ")[0]}</div>
        </div>
        <Av name={user.name} role={role} size={32} />
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"18px 14px"}}>

        {/* ══ HOME ══ */}
        {tab==="home"&&(
          <div className="fade">
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:G.text3,fontFamily:"monospace",letterSpacing:2,textTransform:"uppercase"}}>Welcome back</div>
              <div style={{fontSize:26,fontWeight:800,letterSpacing:"-0.8px",marginTop:3}}>{user.name.split(" ")[0]} 👋</div>
            </div>

            {/* Balance */}
            <div style={{background:`linear-gradient(135deg,${G.bg2},${G.bg3})`,border:`1px solid ${G.green}33`,borderRadius:20,padding:22,marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:`${G.green}08`}} />
              <div style={{fontSize:10,color:G.green2,fontFamily:"monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Club Balance</div>
              <div style={{fontSize:36,fontWeight:800,color:balance>=0?G.green2:G.red,fontFamily:"monospace",letterSpacing:"-1px"}}>₹{balance.toLocaleString()}</div>
              <div style={{fontSize:12,color:G.text3,marginTop:6}}>₹{(totalCollected+totalIncome).toLocaleString()} in · ₹{totalExp.toLocaleString()} out</div>
            <div style={{display:"flex",gap:12,marginTop:8}}>
              <div style={{fontSize:11,color:G.green2}}>📥 Dues ₹{totalCollected.toLocaleString()}</div>
              <div style={{fontSize:11,color:G.blue}}>💝 Other ₹{totalIncome.toLocaleString()}</div>
              <div style={{fontSize:11,color:G.red}}>📤 Spent ₹{totalExp.toLocaleString()}</div>
            </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              {[
                {v:activeMembers.length,l:"Members",c:G.blue},
                {v:`${Math.round((monthPaid.length/Math.max(activeMembers.length,1))*100)}%`,l:"Mar Collection",c:G.green2},
                {v:monthDefaulters.length,l:"Defaulters",c:G.red},
              ].map(s=>(
                <Card key={s.l} style={{textAlign:"center",padding:"14px 10px"}}>
                  <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
                  <div style={{fontSize:11,color:G.text3,marginTop:4}}>{s.l}</div>
                </Card>
              ))}
            </div>

            {/* My fee + pay button */}
            <Card style={{marginBottom:12,borderColor:`${rc}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:rc}}>My March Status</div>
                {fees[user.id]?.[`${YEAR}-${selMonth}`] ? (
                  <Chip label="✓ PAID" color={G.green2} />
                ) : myPendingPay?.status==="pending" ? (
                  <Chip label="⏳ PENDING" color={G.gold} />
                ) : (
                  <Btn variant="green" style={{padding:"7px 14px",fontSize:12}} onClick={()=>setModal("payDues")}>Pay Now →</Btn>
                )}
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {MONTHS.map((_,i)=>{
                  const paid=fees[user.id]?.[`${YEAR}-${i}`];
                  return <div key={i} style={{flex:"1 0 auto",minWidth:24,height:24,borderRadius:6,background:paid?`${G.green}22`:G.redDim,border:`1px solid ${paid?G.green+"44":G.red+"33"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,fontFamily:"monospace",color:paid?G.green2:G.red}} title={MONTHS[i]}>{MONTHS[i][0]}</div>
                })}
              </div>
              <div style={{fontSize:12,color:G.text3,marginTop:8}}>
                {paidCount(fees,user.id)}/12 paid ·
                {(12-paidCount(fees,user.id))*due>0 ? <span style={{color:G.red}}> ₹{(12-paidCount(fees,user.id))*due} pending</span> : <span style={{color:G.green2}}> All clear! ✓</span>}
              </div>
            </Card>

            {/* Pending approval banner for admins */}
            {CAN.approvePayment(role)&&pendingPayments.length>0&&(
              <div style={{background:`${G.gold}12`,border:`1px solid ${G.gold}33`,borderRadius:14,padding:14,marginBottom:12}} onClick={()=>setTab("admin")}>
                <div style={{fontWeight:700,color:G.gold,fontSize:13,marginBottom:6}}>⏳ {pendingPayments.length} Payment{pendingPayments.length>1?"s":""} Awaiting Approval</div>
                <div style={{fontSize:12,color:G.text2}}>Tap to review in Admin panel →</div>
              </div>
            )}

            {/* Pinned notices */}
            {announcements.filter(a=>a.pinned).map(a=>(
              <Card key={a.id} style={{marginBottom:10,borderColor:`${G.green}44`,background:`${G.green}06`}}>
                <div style={{fontSize:10,color:G.green2,fontFamily:"monospace",letterSpacing:1,marginBottom:5}}>📌 PINNED</div>
                <div style={{fontWeight:700,fontSize:14}}>{a.title}</div>
                <div style={{fontSize:13,color:G.text2,marginTop:6,lineHeight:1.6}}>{a.body}</div>
                <div style={{fontSize:11,color:G.text3,marginTop:8}}>— {a.postedBy} · {a.date}</div>
              </Card>
            ))}

            {/* Upcoming events */}
            <Card>
              <div style={{fontWeight:700,fontSize:13,marginBottom:14,color:G.text}}>Upcoming Events</div>
              {events.filter(e=>new Date(e.date)>=new Date()).slice(0,3).map(e=>(
                <div key={e.id} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${G.border}`,alignItems:"center"}}>
                  <div style={{background:`${G.green}18`,borderRadius:10,padding:"8px 10px",textAlign:"center",minWidth:46,border:`1px solid ${G.green}30`,flexShrink:0}}>
                    <div style={{fontSize:16,fontWeight:800,color:G.green2,fontFamily:"monospace"}}>{new Date(e.date).getDate()}</div>
                    <div style={{fontSize:9,color:`${G.green2}88`,textTransform:"uppercase",letterSpacing:1}}>{MONTHS[new Date(e.date).getMonth()]}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{e.title}</div>
                    <div style={{fontSize:11,color:G.text3,marginTop:2}}>{e.time} · {e.location}</div>
                  </div>
                  <Chip label={e.rsvp[user.id]?"Going":"RSVP"} color={e.rsvp[user.id]?G.green2:G.text3} />
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ══ FEES ══ */}
        {tab==="fees"&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
              <div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.6px"}}>Fee Tracker</div>
                <div style={{color:G.text3,fontSize:12,marginTop:3}}>₹{due}/month · {settings.clubName}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                {CAN.exportReport(role)&&<Btn variant="ghost" style={{padding:"7px 12px",fontSize:11}} onClick={exportReport}>📄</Btn>}
                {CAN.markFees(role)&&<Btn variant="ghost" style={{padding:"7px 12px",fontSize:11}} onClick={generateWhatsApp}>🤖</Btn>}
                {!CAN.markFees(role)&&<Btn variant="green" style={{padding:"7px 14px",fontSize:12}} onClick={()=>setModal("payDues")}>Pay Dues</Btn>}
              </div>
            </div>

            {/* Month chips */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {MONTHS.map((m,i)=>(
                <button key={i} onClick={()=>setSelMonth(i)} style={{padding:"6px 11px",borderRadius:8,border:`1px solid ${i===selMonth?G.green:G.border2}`,background:i===selMonth?G.green:G.bg3,color:i===selMonth?"#fff":G.text3,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"monospace",transition:"all .15s"}}>{m}</button>
              ))}
            </div>

            {/* Month summary */}
            <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:14,marginBottom:14,display:"flex",justifyContent:"space-around",textAlign:"center"}}>
              {[
                {v:monthPaid.length,l:"Paid",c:G.green2},
                {v:monthDefaulters.length,l:"Pending",c:G.red},
                {v:`₹${monthPaid.length*due}`,l:"Collected",c:G.gold},
              ].map((s,i)=>(
                <div key={i}>
                  <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
                  <div style={{fontSize:11,color:G.text3,marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Member rows */}
            {activeMembers.map(m=>{
              const key=`${YEAR}-${selMonth}`;
              const paid=fees[m.id]?.[key];
              const isMe=m.id===user.id;
              const mPayment=payments.find(p=>p.memberId===m.id&&p.month===selMonth&&p.status==="pending");
              return (
                <Card key={m.id} style={{marginBottom:8,borderColor:isMe?`${rc}44`:G.border}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <Av name={m.name} role={m.role} size={42} />
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:14}}>{m.name}</span>
                        {isMe&&<Chip label="You" color={rc} />}
                        {mPayment&&<Chip label="⏳ Submitted" color={G.gold} />}
                      </div>
                      <div style={{fontSize:11,color:G.text3,marginTop:2}}>{paidCount(fees,m.id)}/12 months paid</div>
                    </div>
                    {CAN.markFees(role) ? (
                      <button onClick={async()=>{const newVal=!fees[m.id]?.[key];setFees(p=>({...p,[m.id]:{...p[m.id],[key]:newVal}}));try{await dbToggleFee(m.id,YEAR,selMonth,newVal);}catch(e){notify("Sync error","error");}notify("Updated!");}} style={{padding:"7px 14px",borderRadius:9,border:`1px solid ${paid?G.green+"44":G.red+"44"}`,background:paid?`${G.green}18`:G.redDim,color:paid?G.green2:G.red,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"monospace",transition:"all .15s"}}>
                        {paid?"✓ PAID":"✗ DUE"}
                      </button>
                    ) : isMe ? (
                      paid ? <Chip label="✓ PAID" color={G.green2} /> :
                      mPayment ? <Chip label="⏳" color={G.gold} /> :
                      <Btn variant="green" style={{padding:"7px 12px",fontSize:12}} onClick={()=>setModal("payDues")}>Pay</Btn>
                    ) : (
                      <div style={{padding:"7px 14px",borderRadius:9,border:`1px solid ${paid?G.green+"44":G.red+"44"}`,background:paid?`${G.green}18`:G.redDim,color:paid?G.green2:G.red,fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{paid?"✓":"✗"}</div>
                    )}
                  </div>
                </Card>
              );
            })}

            {/* Year grid */}
            <Card style={{marginTop:14,overflowX:"auto"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Full Year Grid</div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    <td style={{fontSize:11,color:G.text3,paddingBottom:8,minWidth:80}}>Member</td>
                    {MONTHS.map((m,i)=><td key={i} style={{textAlign:"center",fontSize:9,color:i===selMonth?G.green2:G.text3,fontFamily:"monospace",paddingBottom:8,paddingInline:3}}>{m}</td>)}
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.map(m=>(
                    <tr key={m.id}>
                      <td style={{fontSize:11,paddingBottom:6,fontWeight:600,paddingRight:8,color:m.id===user.id?rc:G.text}}>{m.name.split(" ")[0]}</td>
                      {MONTHS.map((_,i)=>{
                        const k=`${YEAR}-${i}`, p=fees[m.id]?.[k];
                        return <td key={i} style={{textAlign:"center",paddingBottom:6}}>
                          <button onClick={async()=>{if(!CAN.markFees(role))return;const newVal=!fees[m.id]?.[k];setFees(f=>({...f,[m.id]:{...f[m.id],[k]:newVal}}));notify("Updated!");try{await dbToggleFee(m.id,YEAR,i,newVal);}catch(e){notify("Sync error","error");}}} style={{width:20,height:20,borderRadius:5,border:"none",cursor:CAN.markFees(role)?"pointer":"default",background:p?`${G.green}20`:G.redDim,color:p?G.green2:G.red,fontSize:9,fontWeight:700,transition:"all .15s"}}>{p?"✓":"✗"}</button>
                        </td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ══ EVENTS ══ */}
        {tab==="events"&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
              <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.6px"}}>Events</div>
              {CAN.addEvent(role)&&<Btn variant="green" style={{padding:"8px 14px",fontSize:12}} onClick={()=>{setEvForm({title:"",date:"",time:"",location:"",desc:""});setEditTarget(null);setModal("addEvent");}}>+ Add</Btn>}
            </div>
            {events.map(ev=>{
              const isPast=new Date(ev.date)<new Date();
              const going=activeMembers.filter(m=>ev.rsvp[m.id]).length;
              const iGoing=ev.rsvp[user.id];
              return (
                <Card key={ev.id} style={{marginBottom:12,opacity:isPast?.8:1}}>
                  <div style={{display:"flex",gap:12,marginBottom:12}}>
                    <div style={{background:isPast?G.bg3:`${G.green}18`,borderRadius:12,padding:"10px 12px",textAlign:"center",minWidth:50,border:`1px solid ${isPast?G.border:G.green+"30"}`,flexShrink:0}}>
                      <div style={{fontSize:18,fontWeight:800,color:isPast?G.text3:G.green2,fontFamily:"monospace"}}>{new Date(ev.date).getDate()}</div>
                      <div style={{fontSize:9,color:isPast?G.text3:`${G.green2}88`,textTransform:"uppercase"}}>{MONTHS[new Date(ev.date).getMonth()]}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:15}}>{ev.title}</span>
                        {isPast&&<Chip label="Past" color={G.text3} />}
                      </div>
                      {ev.time&&<div style={{fontSize:12,color:G.text3,marginTop:3}}>{ev.time}{ev.location&&` · ${ev.location}`}</div>}
                      {ev.desc&&<div style={{fontSize:12,color:G.text2,marginTop:4}}>{ev.desc}</div>}
                    </div>
                    {CAN.addEvent(role)&&(
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        <button onClick={()=>{setEvForm({title:ev.title,date:ev.date,time:ev.time,location:ev.location,desc:ev.desc});setEditTarget(ev);setModal("editEvent");}} style={{background:"none",border:"none",color:G.text3,cursor:"pointer",fontSize:15,padding:4}}>✎</button>
                        <button onClick={async()=>{try{await dbDeleteEvent(ev.id);getEvents().then(setEvents);}catch(e){notify("Error","error");}}} style={{background:"none",border:"none",color:`${G.red}66`,cursor:"pointer",fontSize:15,padding:4}}>✕</button>
                      </div>
                    )}
                  </div>
                  <Divider />
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:G.text3}}>{going}/{activeMembers.length} going</div>
                    {CAN.markAttendance(role) ? (
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {activeMembers.map(m=>(
                          <button key={m.id} onClick={async()=>{const newVal=!ev.rsvp[m.id];setEvents(p=>p.map(e=>e.id===ev.id?{...e,rsvp:{...e.rsvp,[m.id]:newVal}}:e));try{await dbToggleAttendance(ev.id,m.id,newVal);}catch(err){}}}
                            style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${ev.rsvp[m.id]?G.green+"44":G.border2}`,background:ev.rsvp[m.id]?`${G.green}18`:G.bg3,color:ev.rsvp[m.id]?G.green2:G.text3,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Sora,sans-serif"}}>
                            {ev.rsvp[m.id]?"✓ ":""}{m.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button onClick={async()=>{const newVal=!ev.rsvp[user.id];setEvents(p=>p.map(e=>e.id===ev.id?{...e,rsvp:{...e.rsvp,[user.id]:newVal}}:e));try{await dbToggleAttendance(ev.id,user.id,newVal);}catch(err){}}}
                        style={{padding:"7px 18px",borderRadius:9,border:`1px solid ${iGoing?G.green+"44":G.border2}`,background:iGoing?`${G.green}18`:G.bg3,color:iGoing?G.green2:G.text2,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"monospace"}}>
                        {iGoing?"✓ Going":"RSVP"}
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ══ NOTICE ══ */}
        {tab==="notice"&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
              <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.6px"}}>Notice Board</div>
              {CAN.postAnnouncement(role)&&<Btn variant="green" style={{padding:"8px 14px",fontSize:12}} onClick={()=>{setAnnForm({title:"",body:""});setModal("postAnn");}}>+ Post</Btn>}
            </div>
            {[...announcements].sort((a,b)=>b.pinned-a.pinned).map(a=>(
              <Card key={a.id} style={{marginBottom:12,borderColor:a.pinned?`${G.green}44`:G.border,background:a.pinned?`${G.green}06`:G.card}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{flex:1}}>
                    {a.pinned&&<div style={{fontSize:10,color:G.green2,fontFamily:"monospace",letterSpacing:1,marginBottom:4}}>📌 PINNED</div>}
                    <div style={{fontWeight:700,fontSize:15}}>{a.title}</div>
                  </div>
                  <div style={{display:"flex",gap:6,marginLeft:10}}>
                    {CAN.pinAnnouncement(role)&&<button onClick={async()=>{try{await dbTogglePin(a.id,!a.pinned);getAnnouncements().then(setAnn);}catch(e){}}} style={{background:"none",border:"none",color:a.pinned?G.green2:G.text3,cursor:"pointer",fontSize:16}}>📌</button>}
                    {CAN.deleteAnnouncement(role)&&<button onClick={async()=>{try{await dbDeleteAnn(a.id);getAnnouncements().then(setAnn);}catch(e){}}} style={{background:"none",border:"none",color:`${G.red}66`,cursor:"pointer",fontSize:16}}>✕</button>}
                  </div>
                </div>
                <div style={{fontSize:13,color:G.text2,lineHeight:1.7}}>{a.body}</div>
                <div style={{fontSize:11,color:G.text3,marginTop:10}}>— {a.postedBy} · {a.date}</div>
              </Card>
            ))}
          </div>
        )}


        {/* ══ LEDGER ══ */}
        {tab==="ledger"&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
              <div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.6px"}}>Ledger</div>
                <div style={{color:G.text3,fontSize:12,marginTop:3}}>All income & expenses</div>
              </div>
              {CAN.addIncome(role)&&<Btn variant="green" style={{padding:"8px 14px",fontSize:12}} onClick={()=>{setIncForm({desc:"",amount:"",date:"",cat:"Donation",fromName:"",notes:""});setEditTarget(null);setModal("addIncome");}}>+ Income</Btn>}
            </div>

            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[
                {l:"Total In",    v:`₹${(totalCollected+totalIncome).toLocaleString()}`, c:G.green2},
                {l:"Total Out",   v:`₹${totalExp.toLocaleString()}`,                     c:G.red},
                {l:"Net Balance", v:`₹${balance.toLocaleString()}`,                      c:balance>=0?G.green2:G.red},
              ].map(s=>(
                <Card key={s.l} style={{textAlign:"center",padding:"14px 8px"}}>
                  <div style={{fontSize:16,fontWeight:800,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
                  <div style={{fontSize:10,color:G.text3,marginTop:4}}>{s.l}</div>
                </Card>
              ))}
            </div>

            {/* Income breakdown */}
            <Card style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:700,color:G.green2}}>📥 Income Breakdown</div>
                <div style={{fontFamily:"monospace",fontSize:13,color:G.green2,fontWeight:700}}>₹{(totalCollected+totalIncome).toLocaleString()}</div>
              </div>
              {[
                {l:"Monthly Dues",  v:totalCollected, c:G.green2},
                {l:"Donations",     v:income.filter(i=>i.cat==="Donation").reduce((s,i)=>s+i.amount,0),     c:G.blue},
                {l:"Sponsorships",  v:income.filter(i=>i.cat==="Sponsorship").reduce((s,i)=>s+i.amount,0),  c:G.gold},
                {l:"Event Income",  v:income.filter(i=>i.cat==="Event Income").reduce((s,i)=>s+i.amount,0), c:"#a78bfa"},
                {l:"Miscellaneous", v:income.filter(i=>i.cat==="Miscellaneous").reduce((s,i)=>s+i.amount,0),c:G.text2},
              ].filter(r=>r.v>0).map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${G.border}`}}>
                  <span style={{fontSize:12,color:G.text2}}>{r.l}</span>
                  <span style={{fontSize:12,fontWeight:700,color:r.c,fontFamily:"monospace"}}>₹{r.v.toLocaleString()}</span>
                </div>
              ))}
            </Card>

            {/* Income entries */}
            <div style={{marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,fontWeight:700,color:G.text}}>Income Entries</div>
            </div>
            {income.map(inc=>{
              const catColors={"Monthly Dues":G.green2,Donation:G.blue,Sponsorship:G.gold,"Event Income":"#a78bfa",Miscellaneous:G.text2};
              const cc=catColors[inc.cat]||G.text2;
              return (
                <Card key={inc.id} style={{marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{background:`${cc}18`,border:`1px solid ${cc}33`,borderRadius:10,padding:"8px 10px",textAlign:"center",minWidth:46,flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:cc,fontFamily:"monospace"}}>{new Date(inc.date).getDate()}</div>
                      <div style={{fontSize:9,color:`${cc}88`,textTransform:"uppercase"}}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date(inc.date).getMonth()]}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13}}>{inc.desc}</div>
                      <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                        <Chip label={inc.cat} color={cc} />
                        {inc.fromName&&<span style={{fontSize:11,color:G.text3}}>from {inc.fromName}</span>}
                      </div>
                      {inc.notes&&<div style={{fontSize:11,color:G.text3,marginTop:3}}>{inc.notes}</div>}
                      <div style={{fontSize:11,color:G.text3,marginTop:2}}>Added by {inc.addedBy}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                      <div style={{fontFamily:"monospace",color:G.green2,fontWeight:800,fontSize:14}}>+₹{inc.amount.toLocaleString()}</div>
                      {CAN.editIncome(role)&&(
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>{setIncForm({desc:inc.desc,amount:String(inc.amount),date:inc.date,cat:inc.cat,fromName:inc.fromName||"",notes:inc.notes||""});setEditTarget(inc);setModal("editIncome");}} style={{background:"none",border:"none",color:G.text3,cursor:"pointer",fontSize:14,padding:2}}>✎</button>
                          <button onClick={async()=>{try{await dbDeleteIncome(inc.id);getIncome().then(setIncome);notify("Deleted!");}catch(err){notify("Error","error");}}} style={{background:"none",border:"none",color:`${G.red}66`,cursor:"pointer",fontSize:14,padding:2}}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            <Divider />

            {/* Expense entries */}
            <div style={{marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,fontWeight:700,color:G.text}}>Expense Entries</div>
              {CAN.addExpense(role)&&<Btn variant="ghost" style={{padding:"6px 12px",fontSize:11}} onClick={()=>{setExpForm({desc:"",amount:"",date:"",cat:"Rent"});setEditTarget(null);setModal("addExpense");}}>+ Expense</Btn>}
            </div>
            {expenses.map(exp=>(
              <Card key={exp.id} style={{marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{background:`${G.red}12`,border:`1px solid ${G.red}22`,borderRadius:10,padding:"8px 10px",textAlign:"center",minWidth:46,flexShrink:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:G.red,fontFamily:"monospace"}}>{new Date(exp.date).getDate()}</div>
                    <div style={{fontSize:9,color:`${G.red}88`,textTransform:"uppercase"}}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date(exp.date).getMonth()]}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{exp.desc}</div>
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      <Chip label={exp.cat} color={G.red} />
                    </div>
                    <div style={{fontSize:11,color:G.text3,marginTop:2}}>{exp.addedBy}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                    <div style={{fontFamily:"monospace",color:G.red,fontWeight:800,fontSize:14}}>−₹{exp.amount.toLocaleString()}</div>
                    {CAN.addExpense(role)&&(
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>{setExpForm({desc:exp.desc,amount:String(exp.amount),date:exp.date,cat:exp.cat});setEditTarget(exp);setModal("editExpense");}} style={{background:"none",border:"none",color:G.text3,cursor:"pointer",fontSize:14,padding:2}}>✎</button>
                        <button onClick={async()=>{try{await dbDeleteExpense(exp.id);getExpenses().then(setExpenses);notify("Deleted!");}catch(err){notify("Error","error");}}} style={{background:"none",border:"none",color:`${G.red}66`,cursor:"pointer",fontSize:14,padding:2}}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ══ ADMIN ══ */}
        {tab==="admin"&&(
          <div className="fade">
            <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.6px",marginBottom:4}}>Admin Panel</div>
            <div style={{color:G.text3,fontSize:12,marginBottom:18}}>{ROLE_META[role].icon} {role} access</div>

            {/* Payment approvals */}
            {CAN.approvePayment(role)&&(
              <Card style={{marginBottom:14,borderColor:pendingPayments.length?`${G.gold}44`:G.border}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:14,display:"flex",justifyContent:"space-between"}}>
                  <span>Payment Approvals</span>
                  {pendingPayments.length>0&&<Chip label={`${pendingPayments.length} pending`} color={G.gold} />}
                </div>
                {payments.length===0&&<div style={{fontSize:13,color:G.text3,textAlign:"center",padding:"16px 0"}}>No payments submitted yet.</div>}
                {payments.map(p=><PaymentApprovalCard key={p.id} p={p} onApprove={approvePayment} onReject={rejectPayment} />)}
              </Card>
            )}

            {/* Members */}
            {CAN.addMember(role)&&(
              <Card style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:14}}>Members ({members.length})</div>
                  <div style={{display:"flex",gap:6}}>
                    {CAN.bulkImport(role)&&<Btn variant="ghost" style={{padding:"7px 12px",fontSize:11}} onClick={()=>setModal("bulkImport")}>⬆ CSV</Btn>}
                    <Btn variant="green" style={{padding:"7px 12px",fontSize:11}} onClick={()=>{setMForm({name:"",phone:"",role:"Member",pin:""});setEditTarget(null);setModal("addMember");}}>+ Add</Btn>
                  </div>
                </div>
                {members.map(m=>(
                  <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${G.border}`,opacity:m.active?1:.45}}>
                    <Av name={m.name} role={m.role} size={36} />
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13}}>{m.name}</div>
                      <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                        <Chip label={m.role} color={ROLE_META[m.role].color} />
                        {!m.active&&<Chip label="Inactive" color={G.text3} />}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      {CAN.editMember(role)&&<button onClick={()=>{setMForm({name:m.name,phone:m.phone,role:m.role,pin:m.pin});setEditTarget(m);setModal("editMember");}} style={{background:G.bg3,border:"none",color:G.text2,cursor:"pointer",padding:"5px 10px",borderRadius:7,fontSize:12,fontFamily:"Sora,sans-serif"}}>Edit</button>}
                      {CAN.removeMember(role)&&(m.active
                        ? <button onClick={async()=>{try{await dbUpdateMember(m.id,{active:false});getMembers().then(setMembers);notify("Deactivated!");}catch(e){notify("Error","error");}}} style={{background:G.redDim,border:`1px solid ${G.red}33`,color:G.red,cursor:"pointer",padding:"5px 10px",borderRadius:7,fontSize:12,fontFamily:"Sora,sans-serif"}}>Deactivate</button>
                        : <button onClick={async()=>{try{await dbUpdateMember(m.id,{active:true});getMembers().then(setMembers);notify("Restored!");}catch(e){notify("Error","error");}}} style={{background:`${G.green}18`,border:`1px solid ${G.green}33`,color:G.green2,cursor:"pointer",padding:"5px 10px",borderRadius:7,fontSize:12,fontFamily:"Sora,sans-serif"}}>Restore</button>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {/* Ledger shortcut */}
            {CAN.addIncome(role)&&(
              <Card style={{marginBottom:14,borderColor:`${G.green}33`,cursor:"pointer"}} onClick={()=>setTab("ledger")}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>Income & Expenses</div>
                    <div style={{fontSize:11,color:G.text3,marginTop:3}}>
                      Total in: <span style={{color:G.green2}}>₹{(totalCollected+totalIncome).toLocaleString()}</span> ·
                      Total out: <span style={{color:G.red}}> ₹{totalExp.toLocaleString()}</span> ·
                      Balance: <span style={{color:balance>=0?G.green2:G.red}}> ₹{balance.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{fontSize:20,color:G.text3}}>→</div>
                </div>
              </Card>
            )}

            {/* Club Settings */}
            {CAN.changeSettings(role)&&(
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:14}}>Club Settings</div>
                  <Btn variant="blue" style={{padding:"7px 12px",fontSize:11}} onClick={()=>{setSettForm({...settings});setModal("settings");}}>Edit</Btn>
                </div>
                {[
                  {l:"Club Name",    v:settings.clubName},
                  {l:"Monthly Due",  v:`₹${settings.monthlyDue}`},
                  {l:"GPay Number",  v:settings.gpayNumber},
                  {l:"GPay Name",    v:settings.gpayName},
                  {l:"Founded",      v:settings.founded},
                ].map(s=>(
                  <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${G.border}`}}>
                    <div style={{fontSize:12,color:G.text3}}>{s.l}</div>
                    <div style={{fontSize:13,fontWeight:600,fontFamily:"monospace"}}>{s.v}</div>
                  </div>
                ))}
              </Card>
            )}

            {/* Treasurer — change dues only */}
            {role==="Treasurer"&&(
              <Card style={{marginTop:14}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Monthly Due Amount</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Inp type="number" value={settings.monthlyDue} onChange={e=>setSettings(p=>({...p,monthlyDue:Number(e.target.value)}))} style={{flex:1}} />
                  <Btn variant="green" onClick={()=>notify("Monthly due updated!")}>Save</Btn>
                </div>
                <div style={{fontSize:11,color:G.text3,marginTop:8}}>Current: ₹{settings.monthlyDue}/month</div>
              </Card>
            )}
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {tab==="profile"&&(
          <div className="fade">
            <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.6px",marginBottom:18}}>My Profile</div>
            <Card style={{marginBottom:14,borderColor:`${rc}33`}}>
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
                <Av name={user.name} role={role} size={60} />
                <div>
                  <div style={{fontSize:20,fontWeight:800}}>{user.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                    <Chip label={role} color={rc} />
                    <Chip label={`#${String(user.id).padStart(3,"0")}`} color={G.text3} />
                  </div>
                  <div style={{fontSize:12,color:G.text3,marginTop:6,fontFamily:"monospace"}}>{user.phone}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="ghost" style={{flex:1,fontSize:12}} onClick={()=>setModal("payDues")}>💳 Pay Dues</Btn>
                <Btn variant="blue" style={{flex:1,fontSize:12}} onClick={()=>setModal("myPin")}>🔑 Change PIN</Btn>
              </div>
            </Card>

            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>My Fee History — {YEAR}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {MONTHS.map((m,i)=>{
                  const paid=fees[user.id]?.[`${YEAR}-${i}`];
                  return (
                    <div key={i} style={{flex:"1 0 58px",background:paid?`${G.green}12`:G.redDim,border:`1px solid ${paid?G.green+"33":G.red+"30"}`,borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
                      <div style={{fontSize:12,color:paid?G.green2:G.red,fontWeight:700,fontFamily:"monospace"}}>{paid?"✓":"✗"}</div>
                      <div style={{fontSize:10,color:G.text3,marginTop:3}}>{m}</div>
                    </div>
                  );
                })}
              </div>
              <Divider />
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
                <div style={{fontSize:13,color:G.text2}}>Total Paid</div>
                <div style={{fontFamily:"monospace",fontWeight:700,color:G.green2}}>₹{paidCount(fees,user.id)*due}</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
                <div style={{fontSize:13,color:G.text2}}>Outstanding</div>
                <div style={{fontFamily:"monospace",fontWeight:700,color:(12-paidCount(fees,user.id))*due>0?G.red:G.green2}}>
                  {(12-paidCount(fees,user.id))*due>0?`₹${(12-paidCount(fees,user.id))*due}`:"All paid ✓"}
                </div>
              </div>
            </Card>

            {/* My payment history */}
            {payments.filter(p=>p.memberId===user.id).length>0&&(
              <Card style={{marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Payment Submissions</div>
                {payments.filter(p=>p.memberId===user.id).map(p=>{
                  const sc = p.status==="approved"?G.green2:p.status==="rejected"?G.red:G.gold;
                  return (
                    <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${G.border}`}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600}}>{MONTHS[p.month]} {p.year} · {p.method}</div>
                        <div style={{fontSize:11,color:G.text3,marginTop:2}}>{p.submittedAt}</div>
                      </div>
                      <Chip label={p.status.toUpperCase()} color={sc} />
                    </div>
                  );
                })}
              </Card>
            )}

            <Btn variant="danger" style={{width:"100%",padding:14,fontSize:14}} onClick={()=>{setUser(null);setTab("home");}}>Sign Out</Btn>
          </div>
        )}

      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:`${G.bg}f0`,backdropFilter:"blur(18px)",borderTop:`1px solid ${G.border}`,display:"flex",justifyContent:"space-around",padding:"10px 0 8px",zIndex:200}}>
        {NAV.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 14px",color:tab===t.id?G.green2:G.text3,fontFamily:"Sora,sans-serif",fontSize:10,fontWeight:600,transition:"all .2s",borderRadius:10,position:"relative"}}>
            <span style={{fontSize:18,transition:"transform .2s",transform:tab===t.id?"scale(1.2)":"scale(1)"}}>{t.icon}</span>
            <span>{t.label}</span>
            {t.id==="admin"&&pendingPayments.length>0&&CAN.approvePayment(role)&&(
              <div style={{position:"absolute",top:2,right:8,width:8,height:8,borderRadius:"50%",background:G.gold}} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
