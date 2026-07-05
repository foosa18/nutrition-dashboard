"use client";

import React, { useState, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* ============ shared constants ============ */
const CUP_CUIN = 14.4375;
const INK = "#1F1B16", PAPER = "#F7F3EC", TERRA = "#C75D34", TEAL = "#1E5F6B", MUSTARD = "#D9A441", LINE = "#D8CFC0", CARD = "#FCFAF5";
const uid = () => Math.random().toString(36).slice(2, 9);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const r1 = (n) => Math.round(n * 10) / 10;

const FOOD_DB = { "Roasted carrots": 95, "Roasted rainbow carrots": 95, "Chickpeas (cooked)": 269, "Hummus": 408,
  "Yogurt / labneh sauce": 200, "Greek yogurt": 230, "Rice (cooked)": 206, "Quinoa (cooked)": 222, "Mixed greens": 8,
  "Roasted potatoes": 230, "Grilled chicken": 230, "Salmon": 350, "Pasta (cooked)": 220 };

/* fridge / shopping data */
const CATS = ["Vegetable", "Fruit", "Dairy", "Meat/Protein", "Plant protein", "Grain", "Eggs", "Beverage", "Condiment", "Processed/Snack", "Frozen", "Other"];
const CAT_META = {
  "Vegetable":       { health: 9, produce: true,  base: { kcal: 120,  protein: 6,   fiber: 14, goodFat: 1 },  pack: { liters: 3,   price: 4 } },
  "Fruit":           { health: 8, produce: true,  base: { kcal: 300,  protein: 3,   fiber: 12, goodFat: 1 },  pack: { liters: 4,   price: 5 } },
  "Dairy":           { health: 6, produce: false, base: { kcal: 600,  protein: 40,  fiber: 0,  goodFat: 20 }, pack: { liters: 2,   price: 4 } },
  "Meat/Protein":    { health: 8, produce: false, base: { kcal: 900,  protein: 120, fiber: 0,  goodFat: 30 }, pack: { liters: 2.5, price: 12 } },
  "Plant protein":   { health: 9, produce: false, base: { kcal: 700,  protein: 50,  fiber: 30, goodFat: 20 }, pack: { liters: 2,   price: 5 } },
  "Grain":           { health: 6, produce: false, base: { kcal: 1600, protein: 40,  fiber: 30, goodFat: 8 },  pack: { liters: 3,   price: 4 } },
  "Eggs":            { health: 8, produce: false, base: { kcal: 840,  protein: 72,  fiber: 0,  goodFat: 50 }, pack: { liters: 1.5, price: 4 } },
  "Beverage":        { health: 3, produce: false, base: { kcal: 500,  protein: 2,   fiber: 0,  goodFat: 0 },  pack: { liters: 2,   price: 3 } },
  "Condiment":       { health: 3, produce: false, base: { kcal: 400,  protein: 2,   fiber: 1,  goodFat: 10 }, pack: { liters: 0.7, price: 4 } },
  "Processed/Snack": { health: 1, produce: false, base: { kcal: 1800, protein: 15,  fiber: 5,  goodFat: 20 }, pack: { liters: 4,   price: 6 } },
  "Frozen":          { health: 5, produce: false, base: { kcal: 900,  protein: 30,  fiber: 8,  goodFat: 15 }, pack: { liters: 3,   price: 7 } },
  "Other":           { health: 4, produce: false, base: { kcal: 500,  protein: 5,   fiber: 3,  goodFat: 5 },  pack: { liters: 2,   price: 5 } },
};
const STORES = { Costco: { vol: 2.4, price: 2.0 }, Walmart: { vol: 1.0, price: 1.0 }, Target: { vol: 0.8, price: 0.95 } };
const packFor = (cat, store) => {
  const m = CAT_META[cat] || CAT_META.Other, s = STORES[store];
  return { liters: r1(m.pack.liters * s.vol), price: r1(m.pack.price * s.price), kcal: Math.round(m.base.kcal * s.vol),
    protein: Math.round(m.base.protein * s.vol), fiber: Math.round(m.base.fiber * s.vol), goodFat: Math.round(m.base.goodFat * s.vol),
    produce: m.produce, health: m.health };
};
const SEED = [ ["Chicken breast", "Meat/Protein"], ["Greek yogurt", "Dairy"], ["Baby spinach", "Vegetable"], ["Mixed berries", "Fruit"],
  ["Chickpeas", "Plant protein"], ["Rolled oats", "Grain"], ["Potato chips", "Processed/Snack"], ["Soda 12-pack", "Beverage"] ];

/* ── Grocery Plan data (from 2-week Minneapolis plan) ── */
const GP_MAINT = 2775, GP_TARGET = 2065;
const DAY_TYPE = { low: { label: "Low day", color: TEAL }, bike: { label: "Bike day", color: MUSTARD }, std: { label: "Standard", color: TERRA } };
const M = (t, text, kcal) => ({ t, text, kcal });
const MEALPLAN = [
  { week: 1, days: [
    { day: "Sunday",    type: "low", meals: [M("B","2-egg veggie scramble (bell pepper, onion)",350),M("S","Fruit",100),M("L","Paneer-feta wrap: paneer, feta, lettuce, cucumber, Dressing A",480),M("S","Nuts",140),M("D","Big salad: mixed greens, tilapia, avocado, cucumber, Dressing C",430)] },
    { day: "Monday",    type: "std", meals: [M("B","Croissant sandwich: egg, avocado, spinach",550),M("S","Almonds + apple",200),M("L","Chicken-feta wrap: chicken, feta, lettuce, bell pepper, Dressing A",650),M("S","Cucumber/celery + walnuts",200),M("D","Tilapia salad: avocado, cucumber, Dressing B",700)] },
    { day: "Tuesday",   type: "std", meals: [M("B","Croissant sandwich: egg, mushroom, feta",550),M("S","Greek yogurt + cashews",200),M("L","Egg salad wrap: egg, lettuce, cucumber, Dressing C",550),M("S","Watermelon + pistachios",200),M("D","Grilled tilapia, quinoa, sautéed spinach & mushroom, side salad Dressing B",650)] },
    { day: "Wednesday", type: "bike", meals: [M("B","Croissant sandwich: egg, spinach, bell pepper",550),M("S","Apple + walnuts",200),M("L","Tilapia sandwich: tilapia, lettuce, avocado, Dressing A",700),M("S","Celery + bell pepper w/ Dressing B dip",200),M("D","Grilled lime-marinated chicken wings, roasted sweet potato, side salad + Dressing B",800)] },
    { day: "Thursday",  type: "low", meals: [M("B","Croissant sandwich (light): egg, feta",450),M("S","Small apple",80),M("L","Feta-veggie wrap: feta, cucumber, bell pepper, lettuce, Dressing A",500),M("S","Celery + nuts",140),M("D","Big salad: mixed greens, chicken, cucumber, feta, Dressing C",330)] },
    { day: "Friday",    type: "std", meals: [M("B","Greek yogurt bowl: pineapple, walnuts, honey",500),M("S","Nuts",200),M("L","Crisp & Green build-your-own bowl (eat out)",650),M("S","Watermelon + pistachios",200),M("D","Pressure-cooked yogurt chicken wings (onion, tomato), quinoa, sautéed spinach & mushroom",750)] },
    { day: "Saturday",  type: "std", meals: [M("B","Veggie omelette + avocado toast",600),M("S","Fruit + nuts",200),M("L","Brassa: ¼ chicken + salad (eat out)",700),M("S","Light snack",150),M("D","Big dinner salad: mixed greens, tilapia, feta, cucumber, bell pepper, Dressing B",550)] },
  ] },
  { week: 2, days: [
    { day: "Sunday",    type: "low", meals: [M("B","2-egg veggie scramble (bell pepper, onion)",350),M("S","Fruit",100),M("L","Paneer-feta wrap: paneer, feta, lettuce, cucumber, Dressing A",480),M("S","Nuts",140),M("D","Big salad: mixed greens, tilapia, avocado, cucumber, Dressing C",430)] },
    { day: "Monday",    type: "std", meals: [M("B","Croissant sandwich: egg, avocado, spinach",550),M("S","Almonds + apple",200),M("L","Chicken-feta wrap: chicken, feta, lettuce, bell pepper, Dressing A",650),M("S","Cucumber/celery + walnuts",200),M("D","Tilapia salad: avocado, cucumber, Dressing B",700)] },
    { day: "Tuesday",   type: "std", meals: [M("B","Croissant sandwich: egg, mushroom, feta",550),M("S","Greek yogurt + cashews",200),M("L","Egg salad wrap: egg, lettuce, cucumber, Dressing C",550),M("S","Watermelon + pistachios",200),M("D","Pressure-cooked yogurt chicken wings (onion, tomato), small rice, sautéed spinach",700)] },
    { day: "Wednesday", type: "bike", meals: [M("B","Croissant sandwich: egg, spinach, bell pepper",550),M("S","Apple + walnuts",200),M("L","Tilapia sandwich: tilapia, lettuce, avocado, Dressing A",700),M("S","Celery + bell pepper w/ Dressing B dip",200),M("D","Grilled lemon-marinated chicken wings, roasted sweet potato, side salad + Dressing B",800)] },
    { day: "Thursday",  type: "low", meals: [M("B","Croissant sandwich (light): egg, feta",450),M("S","Small apple",80),M("L","Feta-veggie wrap: feta, cucumber, bell pepper, lettuce, Dressing A",500),M("S","Celery + nuts",140),M("D","Big salad: mixed greens, tilapia, cucumber, avocado, Dressing C",330)] },
    { day: "Friday",    type: "std", meals: [M("B","Overnight oats: walnuts, pineapple, cinnamon",500),M("S","Nuts",200),M("L","Crisp & Green build-your-own bowl (eat out)",650),M("S","Watermelon + pistachios",200),M("D","Grilled chicken, quinoa, side salad feta + Dressing B",750)] },
    { day: "Saturday",  type: "std", meals: [M("B","Veggie omelette + avocado toast",600),M("S","Fruit + nuts",200),M("L","Brassa: ¼ chicken + salad (eat out)",700),M("S","Light snack",150),M("D","Big dinner salad: mixed greens, tilapia, feta, cucumber, bell pepper, Dressing C",550)] },
  ] },
];
const DRESSINGS = [
  { name: "A · Lemon-Yogurt", tag: "default wrap spread + salad", recipe: "½ cup Greek yogurt · juice of 1 lemon · 1 tbsp olive oil · 1 minced garlic clove · salt/pepper · splash water to thin" },
  { name: "B · Lime-Avocado Crema", tag: "dinner salads, bowls", recipe: "½ avocado · juice of 1-2 limes · 2-3 tbsp water or yogurt · pinch salt · cilantro if you have it" },
  { name: "C · Lime-Yogurt Mint", tag: "lighter salads, melon/pineapple", recipe: "½ cup Greek yogurt · juice of 1 lime · chopped mint · 1 tsp honey · pinch salt" },
];
const GROCERY_COSTCO = [
  ["Chicken breast, large pack","Freeze in 2-serving portions"],["Kirkland Signature chicken wings","Grill w/ lime-lemon marinade, or pressure-cook w/ yogurt, onion & tomato"],["Tilapia fillets, frozen","Individually wrapped"],
  ["Eggs, large pack (×2)","Daily — croissants + scrambles"],["Croissants","Freeze extras, thaw Mon-Thu"],
  ["Feta, Costco tub","Daily — wraps + salads"],["Kirkland Greek yogurt tub","Dressings + bowls + snacks"],
  ["Organic mixed greens, box","Daily salads"],["Avocados, bag","Dressings + toast + wraps"],
  ["Mixed nuts (almond/walnut/cashew/pistachio)","Portion into snack bags Sunday"],["Olive oil","Dressing A"],
  ["Quinoa",""],["Rice",""],["Sweet potatoes, bag",""],["Baby spinach, box",""],["Mini cucumbers, bag",""],
  ["Bell peppers, tricolor bag",""],["Pineapple, pre-cut",""],["Watermelon, pre-cut",""],
  ["Whole wheat wraps + bread","Freeze extra"],["Paneer (if carried)","Else Hyvee"],
];
const GROCERY_LOCAL = [
  ["Paneer, 2 small blocks","If not from Costco"],["Fresh lemons","~10-12, dressings use fast"],["Fresh limes","~10-12"],
  ["Fresh ginger","Small piece"],["Onions","Small bag"],["Mushrooms","2× 8oz, restock mid-wk 2"],["Celery","2 bunches"],
  ["Lettuce","2 heads"],["Potatoes","Small bag, Wed dish"],["Fresh mint/cilantro","Dressing C + garnish"],["Honey","Small bottle"],
];

async function callClaude(content) {
  const res = await fetch("/api/analyze", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500,
      messages: [{ role: "user", content }], tools: [{ type: "web_search_20250305", name: "web_search" }] }),
  });
  const data = await res.json();
  return (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("\n");
}
const grabJSON = (t) => { const s = t.indexOf("["), e = t.lastIndexOf("]"); if (s < 0 || e < 0) throw new Error("No JSON"); return JSON.parse(t.slice(s, e + 1)); };

/* ============ root with tabs ============ */
export default function App() {
  const [tab, setTab] = useState("plate");
  return (
    <div style={{ minHeight: "100vh", background: PAPER, color: INK, fontFamily: "Work Sans, system-ui, sans-serif",
      backgroundImage: "radial-gradient(circle at 1px 1px, rgba(31,27,22,.04) 1px, transparent 0)", backgroundSize: "22px 22px" }}>
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "30px 18px 90px" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: 2, color: TERRA, textTransform: "uppercase" }}>Nutrition workbench</div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 38, margin: "4px 0 16px", lineHeight: 1.05 }}>The Plate Lab</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          {[["plate", "🍽 Plate Lab"], ["fridge", "🧊 Fridge & Shop"], ["grocery", "🛒 Grocery Plan"]].map(([k, l]) => (
            <button key={k} className="btn" onClick={() => setTab(k)}
              style={{ background: tab === k ? INK : "transparent", color: tab === k ? PAPER : INK, border: `1px solid ${tab === k ? INK : LINE}` }}>{l}</button>
          ))}
        </div>
        {tab === "plate" ? <PlateLab /> : tab === "fridge" ? <FridgeShop /> : <GroceryPlan />}
      </div>
    </div>
  );
}

/* ============ TAB 1: plate ============ */
function PlateLab() {
  const [img, setImg]           = useState(null);
  const [mode, setMode]         = useState(null); // 'crop'|'ref'|'lasso'|'plate'
  const [refPts, setRefPts]     = useState([]);
  const [refVal, setRefVal]     = useState("");
  const [refUnit, setRefUnit]   = useState("in");
  const [platePts, setPlatePts] = useState([]);
  const [lasso, setLasso]       = useState([]);
  const [lassoDone, setLassoDone] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropRect, setCropRect]   = useState(null);
  const [manualDia, setManualDia] = useState("");
  const [manualUnit, setManualUnit] = useState("in");
  const [packing, setPacking]   = useState(0.6);
  const [foods, setFoods]       = useState([]);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");
  const overlayRef = useRef(null);
  const imgRef     = useRef(null);
  const drawing    = useRef(false);
  const lastPt     = useRef(null);

  // ── derived scale ──
  const toIn = (v, u) => u === "cm" ? +v / 2.54 : +v;
  const refLenIn   = refVal !== "" && +refVal > 0 ? toIn(refVal, refUnit) : null;
  const pxPerInch  = refPts.length === 2 && refLenIn ? dist(refPts[0], refPts[1]) / refLenIn : null;
  const lassoCircle = React.useMemo(() => {
    if (!lassoDone || lasso.length < 8) return null;
    const cx = lasso.reduce((s,p)=>s+p.x,0)/lasso.length;
    const cy = lasso.reduce((s,p)=>s+p.y,0)/lasso.length;
    const r  = lasso.reduce((s,p)=>s+dist(p,{x:cx,y:cy}),0)/lasso.length;
    return {cx, cy, r};
  }, [lassoDone, lasso]);
  const platePxDia  = lassoCircle ? lassoCircle.r * 2 : platePts.length === 2 ? dist(platePts[0], platePts[1]) : null;
  const plateDiaIn  = manualDia !== "" && +manualDia > 0
    ? toIn(manualDia, manualUnit)
    : pxPerInch && platePxDia ? platePxDia / pxPerInch : null;
  const plateAreaIn2 = plateDiaIn ? Math.PI * (plateDiaIn / 2) ** 2 : null;
  const scaleReady   = !!pxPerInch;
  const plateReady   = !!plateDiaIn;

  // ── file upload ──
  const onFile = (e) => { const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => {
      setImg({ src: rd.result, mime: f.type||"image/jpeg", b64: String(rd.result).split(",")[1] });
      setRefPts([]); setPlatePts([]); setLasso([]); setLassoDone(false);
      setCropRect(null); setFoods([]); setErr(""); };
    rd.readAsDataURL(f); };

  // ── mouse handlers ──
  const getPos = (e) => { const r = overlayRef.current.getBoundingClientRect(); return { x: e.clientX-r.left, y: e.clientY-r.top }; };
  const onMouseDown = (e) => {
    if (!mode) return; e.preventDefault();
    const p = getPos(e);
    if (mode === "crop")  { setCropStart(p); setCropRect({x:p.x,y:p.y,w:0,h:0}); drawing.current=true; }
    else if (mode==="lasso") { setLasso([p]); setLassoDone(false); lastPt.current=p; drawing.current=true; }
    else if (mode==="ref")   { setRefPts(prev => prev.length>=2 ? [p] : [...prev,p]); }
    else if (mode==="plate") { setPlatePts(prev => prev.length>=2 ? [p] : [...prev,p]); }
  };
  const onMouseMove = (e) => {
    if (!drawing.current) return; const p = getPos(e);
    if (mode==="crop" && cropStart) { setCropRect({x:Math.min(cropStart.x,p.x),y:Math.min(cropStart.y,p.y),w:Math.abs(p.x-cropStart.x),h:Math.abs(p.y-cropStart.y)}); }
    else if (mode==="lasso") { if (!lastPt.current || dist(lastPt.current,p)>4) { setLasso(prev=>[...prev,p]); lastPt.current=p; } }
  };
  const onMouseUp = () => { if (drawing.current && mode==="lasso") setLassoDone(true); drawing.current=false; };

  // ── crop apply ──
  const applyCrop = () => {
    if (!cropRect||!imgRef.current||cropRect.w<10||cropRect.h<10) return;
    const el=imgRef.current, sx=el.naturalWidth/el.clientWidth, sy=el.naturalHeight/el.clientHeight;
    const canvas=document.createElement("canvas"); canvas.width=Math.round(cropRect.w*sx); canvas.height=Math.round(cropRect.h*sy);
    canvas.getContext("2d").drawImage(el, cropRect.x*sx, cropRect.y*sy, cropRect.w*sx, cropRect.h*sy, 0, 0, canvas.width, canvas.height);
    const newSrc=canvas.toDataURL(img.mime);
    setImg({src:newSrc,mime:img.mime,b64:newSrc.split(",")[1]});
    setCropRect(null); setCropStart(null); setRefPts([]); setPlatePts([]); setLasso([]); setLassoDone(false); setMode(null);
  };

  // ── reset all measurements ──
  const resetMeasure = () => { setRefPts([]); setRefVal(""); setPlatePts([]); setLasso([]); setLassoDone(false); setCropRect(null); setManualDia(""); setMode(null); };

  // ── detect foods ──
  const detect = async () => { if (!img) return; setBusy(true); setErr("");
    try { const text = await callClaude([{type:"image",source:{type:"base64",media_type:img.mime,data:img.b64}},
      {type:"text",text:`Identify each distinct food on this plate/bowl. For each return name, coverage_pct (% of visible food, sum ~100), thickness_in (food layer thickness), kcal_per_cup (use web_search if unsure). Return ONLY JSON: [{"name":"","coverage_pct":0,"thickness_in":0,"kcal_per_cup":0}]`}]);
      setFoods(grabJSON(text).map((f)=>({id:uid(),name:f.name||"Food",coveragePct:Math.round(+f.coverage_pct||0),thicknessIn:+f.thickness_in||0.5,kcalPerCup:Math.round(+f.kcal_per_cup||FOOD_DB[f.name]||150)})));
    } catch(e2){setErr("Detection failed: "+e2.message+". Add manually below.");} finally{setBusy(false);}};

  const upd   = (id,k,v) => setFoods(p=>p.map(f=>f.id===id?{...f,[k]:v}:f));
  const calc  = (f) => { if(!plateAreaIn2) return {kcal:0}; const vol=plateAreaIn2*(f.coveragePct/100)*f.thicknessIn*packing; return {kcal:(vol/CUP_CUIN)*f.kcalPerCup}; };
  const total = foods.reduce((s,f)=>s+calc(f).kcal,0);
  const cov   = foods.reduce((s,f)=>s+(+f.coveragePct||0),0);
  const palette = [TERRA,TEAL,MUSTARD,"#7A8450","#9B5DE5","#8C6239"];
  const chart = foods.map(f=>({name:f.name,kcal:Math.round(calc(f).kcal)}));

  // ── tool hint text ──
  const hints = { crop:"Drag to select crop area, then Apply", ref:"Click two ends of a known-length object", lasso:"Draw around the plate rim — release to fit circle", plate:"Click two opposite rim points" };
  const TOOLS = [["crop","✂ Crop","#5C544A"],["ref","— Ref line",MUSTARD],["lasso","◯ Lasso",TEAL],["plate","↔ Diameter",TEAL]];

  return (
    <>
      <Card><Head n={1} done={!!img}>Upload a top-down photo</Head>
        <label className="btn" style={{background:INK,color:PAPER,display:"inline-block"}}>{img?"Replace photo":"Choose photo"}
          <input type="file" accept="image/*" onChange={onFile} style={{display:"none"}} /></label></Card>

      {img && <>
        <Card>
          <Head n={2} done={plateReady}>Set scale & trace plate</Head>

          {/* ── tool bar ── */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
            {TOOLS.map(([k,label,col])=>(
              <ToolBtn key={k} active={mode===k} onClick={()=>setMode(mode===k?null:k)} color={col}>{label}</ToolBtn>
            ))}
            <button className="btn" onClick={resetMeasure} style={{background:"transparent",color:"#9B9286",border:`1px solid ${LINE}`,padding:"7px 10px",fontSize:12}}>↺ Reset</button>
          </div>

          {/* hint */}
          {mode && <div style={{fontSize:12,color:"#8C8478",marginBottom:10,fontStyle:"italic"}}>{hints[mode]}</div>}

          {/* ── image + overlay ── */}
          <div ref={overlayRef}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            style={{position:"relative",display:"inline-block",maxWidth:"100%",cursor:mode?"crosshair":"default",borderRadius:10,overflow:"hidden",border:`1px solid ${LINE}`,userSelect:"none"}}>
            <img ref={imgRef} src={img.src} alt="plate" style={{display:"block",maxWidth:"100%",pointerEvents:"none"}} draggable={false} />
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
              {/* reference line */}
              <Measure pts={refPts} color={MUSTARD} />
              {/* 2-point diameter */}
              {!lassoCircle && <Measure pts={platePts} color={TEAL} circle />}
              {/* lasso path */}
              {lasso.length>1 && <polyline points={lasso.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray={lassoDone?"0":"4 3"} opacity="0.85"/>}
              {/* fitted circle */}
              {lassoCircle && (<>
                <circle cx={lassoCircle.cx} cy={lassoCircle.cy} r={lassoCircle.r} fill="rgba(30,95,107,.1)" stroke={TEAL} strokeWidth="2.5" strokeDasharray="6 5"/>
                <circle cx={lassoCircle.cx} cy={lassoCircle.cy} r="5" fill={TEAL} stroke="#fff" strokeWidth="2"/>
              </>)}
              {/* crop rect */}
              {cropRect && cropRect.w>4 && (
                <rect x={cropRect.x} y={cropRect.y} width={cropRect.w} height={cropRect.h} fill="rgba(217,164,65,.1)" stroke={MUSTARD} strokeWidth="2" strokeDasharray="6 4"/>
              )}
            </svg>
          </div>

          {/* ── crop apply ── */}
          {cropRect && cropRect.w>10 && (
            <div style={{marginTop:10,display:"flex",gap:10,alignItems:"center"}}>
              <button className="btn" onClick={applyCrop} style={{background:MUSTARD,color:INK}}>Apply crop</button>
              <button className="btn" onClick={()=>{setCropRect(null);setCropStart(null);}} style={{background:"transparent",color:"#9B9286",border:`1px solid ${LINE}`}}>Cancel</button>
              <span style={{fontSize:12,color:"#8C8478"}}>{Math.round(cropRect.w)}×{Math.round(cropRect.h)} px</span>
            </div>
          )}

          {/* ── reference length (shows after 2 ref clicks) ── */}
          {refPts.length===2 && (
            <div className="fade" style={{marginTop:14,display:"flex",gap:10,alignItems:"center",background:"rgba(217,164,65,.08)",border:`1px solid rgba(217,164,65,.3)`,borderRadius:9,padding:"10px 14px"}}>
              <span style={{fontSize:13,color:"#5C544A",whiteSpace:"nowrap"}}>📏 Line length:</span>
              <input className="cell num" type="number" step="0.1" placeholder="e.g. 3.37" value={refVal} onChange={e=>setRefVal(e.target.value)} style={{width:100}}/>
              <div style={{display:"flex",gap:4}}>
                {["in","cm"].map(u=><button key={u} className="btn" onClick={()=>setRefUnit(u)} style={{padding:"5px 10px",fontSize:12,background:refUnit===u?MUSTARD:"#fff",color:refUnit===u?INK:"#8C8478",border:`1px solid ${refUnit===u?MUSTARD:LINE}`}}>{u}</button>)}
              </div>
              {pxPerInch && <span className="num" style={{fontSize:12,color:TEAL}}>✓ {pxPerInch.toFixed(1)} px/in</span>}
            </div>
          )}

          {/* ── readouts + manual diameter ── */}
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end",marginTop:14}}>
            <Readout label="Scale"      value={pxPerInch   ? `${pxPerInch.toFixed(1)} px/in` : "—"} />
            <Readout label="Plate Ø"    value={plateDiaIn   ? `${plateDiaIn.toFixed(2)} in`   : "—"} />
            <Readout label="Plate area" value={plateAreaIn2 ? `${plateAreaIn2.toFixed(1)} in²` : "—"} />
            <div style={{display:"flex",gap:8,alignItems:"flex-end",marginLeft:"auto",borderLeft:`1px solid ${LINE}`,paddingLeft:16}}>
              <Field label="Or type diameter directly">
                <div style={{display:"flex",gap:6}}>
                  <input className="cell num" type="number" step="0.25" placeholder="e.g. 7.5" value={manualDia} onChange={e=>setManualDia(e.target.value)} style={{width:90}}/>
                  <div style={{display:"flex",gap:4}}>
                    {["in","cm"].map(u=><button key={u} className="btn" onClick={()=>setManualUnit(u)} style={{padding:"5px 9px",fontSize:12,background:manualUnit===u?TEAL:"#fff",color:manualUnit===u?"#fff":"#8C8478",border:`1px solid ${manualUnit===u?TEAL:LINE}`}}>{u}</button>)}
                  </div>
                </div>
              </Field>
            </div>
          </div>
        </Card>

        <Card><Head n={3} done={foods.length>0}>Identify foods</Head>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn" onClick={detect} disabled={busy} style={{background:TERRA,color:"#fff",opacity:busy?0.6:1}}>{busy?"Analyzing…":"✦ AI detect foods"}</button>
            <button className="btn" onClick={()=>setFoods(p=>[...p,{id:uid(),name:"New food",coveragePct:10,thicknessIn:0.5,kcalPerCup:150}])} style={{background:"#fff",color:INK,border:`1px solid ${LINE}`}}>+ Add manually</button>
            {cov>0 && <span className="num" style={{alignSelf:"center",color:Math.abs(cov-100)>15?TERRA:"#5C544A",fontSize:13}}>coverage {cov}%</span>}
          </div>
          {err && <div style={{color:TERRA,fontSize:13,marginTop:10}}>{err}</div>}
          {foods.map((f)=>(
            <div key={f.id} className="fade" style={{display:"grid",gridTemplateColumns:"1.6fr .7fr .8fr .9fr auto",gap:8,alignItems:"center",marginTop:10}}>
              <input className="cell" value={f.name} list="fdb" onChange={e=>{upd(f.id,"name",e.target.value);if(FOOD_DB[e.target.value])upd(f.id,"kcalPerCup",FOOD_DB[e.target.value]);}}/>
              <Lbl suffix="%" v={f.coveragePct} on={v=>upd(f.id,"coveragePct",v)}/>
              <Lbl suffix="in" step="0.1" v={f.thicknessIn} on={v=>upd(f.id,"thicknessIn",v)}/>
              <Lbl suffix="kcal/c" v={f.kcalPerCup} on={v=>upd(f.id,"kcalPerCup",v)}/>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span className="num" style={{fontSize:13,fontWeight:600,minWidth:50,textAlign:"right"}}>{Math.round(calc(f).kcal)}</span>
                <button onClick={()=>setFoods(p=>p.filter(x=>x.id!==f.id))} style={{border:"none",background:"none",cursor:"pointer",color:"#B0A697",fontSize:18}}>×</button>
              </div>
            </div>))}
          <datalist id="fdb">{Object.keys(FOOD_DB).map(k=><option key={k} value={k}/>)}</datalist>
          {foods.length>0 && <div style={{marginTop:16,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:13,color:"#5C544A"}}>Packing density</span>
            <input type="range" min="0.3" max="1" step="0.05" value={packing} onChange={e=>setPacking(+e.target.value)} style={{accentColor:TEAL,flex:1,maxWidth:220}}/>
            <span className="num" style={{fontSize:13}}>{packing.toFixed(2)}</span>
          </div>}
        </Card>

        {plateReady && foods.length>0 && (
          <Result title="Estimated total" big={`${Math.round(total).toLocaleString()}`} unit="kcal">
            <div style={{height:200,marginTop:18}}><ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{left:10,right:30}}>
                <XAxis type="number" stroke="#8C8478" tick={{fill:"#B9B0A2",fontSize:11}}/>
                <YAxis type="category" dataKey="name" width={130} stroke="#8C8478" tick={{fill:"#E8E1D6",fontSize:12}}/>
                <Tooltip cursor={{fill:"rgba(255,255,255,.06)"}} contentStyle={{background:"#2A251E",border:"none",borderRadius:8,color:PAPER}}/>
                <Bar dataKey="kcal" radius={[0,5,5,0]}>{chart.map((_,i)=><Cell key={i} fill={palette[i%palette.length]}/>)}</Bar>
              </BarChart></ResponsiveContainer></div>
            <p style={{fontSize:12,color:"#9B9286",margin:"8px 0 0"}}>Estimate only — depth is inferred. Tune thickness & packing to calibrate.</p>
          </Result>)}
      </>}
    </>
  );
}

/* ============ TAB 2: fridge & shop ============ */
function FridgeShop() {
  const [img, setImg] = useState(null);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const [inv, setInv] = useState([]);                 // detected fridge items
  const [store, setStore] = useState("Walmart");
  const [shop, setShop] = useState(() => SEED.map(([name, cat]) => ({ id: uid(), name, cat })));
  const [space, setSpace] = useState(120);            // liters of fridge space available
  const [budget, setBudget] = useState(80);           // $

  const onFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { setImg({ src: rd.result, mime: f.type || "image/jpeg", b64: String(rd.result).split(",")[1] }); setErr(""); }; rd.readAsDataURL(f); };

  const scan = async () => { if (!img) return; setBusy(true); setErr("");
    try { const text = await callClaude([{ type: "image", source: { type: "base64", media_type: img.mime, data: img.b64 } },
      { type: "text", text: `List every food item visible in this fridge photo. For each return: name, brand (if readable else ""), size (e.g. "1/2 gal","12 oz"), category (one of: ${CATS.join(", ")}), kcal (total for amount present), protein_g, fiber_g, good_fat_g. Use web_search to verify brand pack nutrition if unsure. Return ONLY JSON: [{"name":"","brand":"","size":"","category":"","kcal":0,"protein_g":0,"fiber_g":0,"good_fat_g":0}]` }]);
      setInv(grabJSON(text).map((x) => ({ id: uid(), name: x.name || "Item", brand: x.brand || "", size: x.size || "",
        cat: CATS.includes(x.category) ? x.category : "Other", kcal: Math.round(+x.kcal || 0),
        protein: Math.round(+x.protein_g || 0), fiber: Math.round(+x.fiber_g || 0), goodFat: Math.round(+x.good_fat_g || 0) })));
    } catch (e2) { setErr("Scan failed: " + e2.message + ". Add items manually."); } finally { setBusy(false); } };

  const updInv = (id, k, v) => setInv((p) => p.map((i) => (i.id === id ? { ...i, [k]: v } : i)));
  const invKcal = inv.reduce((s, i) => s + (+i.kcal || 0), 0);
  const catKcal = CATS.map((c) => ({ name: c, kcal: inv.filter((i) => i.cat === c).reduce((s, i) => s + (+i.kcal || 0), 0) })).filter((x) => x.kcal > 0);

  // ---- optimizer ----
  const items = shop.map((it) => ({ ...it, ...packFor(it.cat, store) }));
  const tot = (arr) => arr.reduce((a, i) => ({ price: a.price + i.price, liters: a.liters + i.liters }), { price: 0, liters: 0 });
  const maxVal = Math.max(...items.map((i) => i.health / i.price), 0.001);
  const util = (i) => 0.5 * (i.health / 10) + 0.5 * ((i.health / i.price) / maxVal);
  const medLit = [...items].map((i) => i.liters).sort((a, b) => a - b)[Math.floor(items.length / 2)] || 0;

  let kept = [...items], dropped = [];
  const overBudget = () => tot(kept).price > budget, overSpace = () => tot(kept).liters > space;
  let guard = 0;
  while ((overBudget() || overSpace()) && kept.length && guard++ < 100) {
    let worst = null, worstDP = Infinity;
    for (const i of kept) { const pressure = i.price / budget + i.liters / space; const dp = util(i) / (pressure || 0.001);
      if (dp < worstDP) { worstDP = dp; worst = i; } }
    const reasons = []; if (worst.health < 5) reasons.push("low health value"); if (worst.health / worst.price < maxVal * 0.5) reasons.push("weak nutrition-per-$"); if (worst.liters > medLit) reasons.push("bulky");
    dropped.push({ ...worst, reason: reasons.length ? reasons.join(" · ") : "lowest priority to fit" });
    kept = kept.filter((x) => x.id !== worst.id);
  }
  const keptTot = tot(kept), allTot = tot(items);
  const fits = !dropped.length;
  const sum = (arr, k) => arr.reduce((s, i) => s + (i[k] || 0), 0);
  const balance = [ { label: "Protein", val: sum(kept, "protein"), target: 500, color: TERRA },
    { label: "Fiber", val: sum(kept, "fiber"), target: 150, color: "#7A8450" },
    { label: "Good fat", val: sum(kept, "goodFat"), target: 250, color: MUSTARD },
    { label: "Produce items", val: kept.filter((i) => i.produce).length, target: 6, color: TEAL } ];
  const keptKcal = sum(kept, "kcal");

  return (
    <>
      <Card><Head n={1} done={inv.length > 0}>Scan your fridge</Head>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label className="btn" style={{ background: INK, color: PAPER, display: "inline-block" }}>{img ? "Replace photo" : "Choose fridge photo"}
            <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} /></label>
          {img && <button className="btn" onClick={scan} disabled={busy} style={{ background: TERRA, color: "#fff", opacity: busy ? 0.6 : 1 }}>{busy ? "Reading shelves…" : "✦ Detect items"}</button>}
        </div>
        {img && <img src={img.src} alt="fridge" style={{ marginTop: 12, maxWidth: "100%", maxHeight: 240, borderRadius: 10, border: `1px solid ${LINE}` }} />}
        {err && <div style={{ color: TERRA, fontSize: 13, marginTop: 10 }}>{err}</div>}

        {inv.length > 0 && <>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr .7fr 1fr .8fr auto", gap: 7, marginTop: 14, fontSize: 11, color: "#8C8478" }}>
            <span>Item</span><span>Brand</span><span>Size</span><span>Category</span><span>kcal</span><span /></div>
          {inv.map((i) => (
            <div key={i.id} style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr .7fr 1fr .8fr auto", gap: 7, alignItems: "center", marginTop: 7 }}>
              <input className="cell" value={i.name} onChange={(e) => updInv(i.id, "name", e.target.value)} />
              <input className="cell" value={i.brand} onChange={(e) => updInv(i.id, "brand", e.target.value)} />
              <input className="cell" value={i.size} onChange={(e) => updInv(i.id, "size", e.target.value)} />
              <select className="cell" value={i.cat} onChange={(e) => updInv(i.id, "cat", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <input className="cell num" type="number" value={i.kcal} onChange={(e) => updInv(i.id, "kcal", +e.target.value)} />
              <button onClick={() => setInv((p) => p.filter((x) => x.id !== i.id))} style={{ border: "none", background: "none", cursor: "pointer", color: "#B0A697", fontSize: 18 }}>×</button>
            </div>))}
          <button className="btn" onClick={() => setInv((p) => [...p, { id: uid(), name: "New item", brand: "", size: "", cat: "Other", kcal: 0, protein: 0, fiber: 0, goodFat: 0 }])} style={{ background: "#fff", color: INK, border: `1px solid ${LINE}`, marginTop: 10 }}>+ Add item</button>
          <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Readout label="Items on hand" value={inv.length} /><Readout label="Stored calories" value={`${invKcal.toLocaleString()} kcal`} />
            {catKcal.length > 0 && <div style={{ flex: 1, minWidth: 240, height: 90 }}><ResponsiveContainer width="100%" height="100%">
              <BarChart data={catKcal} margin={{ top: 4, bottom: 0 }}><XAxis dataKey="name" hide /><YAxis hide />
                <Tooltip contentStyle={{ background: "#2A251E", border: "none", borderRadius: 8, color: PAPER, fontSize: 12 }} />
                <Bar dataKey="kcal" radius={[4, 4, 0, 0]}>{catKcal.map((c, i) => <Cell key={i} fill={CAT_META[c.name]?.health >= 6 ? TEAL : TERRA} />)}</Bar>
              </BarChart></ResponsiveContainer></div>}
          </div></>}
      </Card>

      <Card><Head n={2} done>Shopping list & store</Head>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: "#5C544A" }}>Store size:</span>
          {Object.keys(STORES).map((s) => <button key={s} className="btn" onClick={() => setStore(s)} style={{ background: store === s ? TEAL : "#fff", color: store === s ? "#fff" : INK, border: `1px solid ${store === s ? TEAL : LINE}` }}>{s}</button>)}
          <span style={{ fontSize: 12, color: "#9B9286" }}>{store === "Costco" ? "bulk packs · cheapest per unit · bulkiest" : store === "Target" ? "smaller packs · pricier per unit" : "standard packs"}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr .7fr .7fr auto", gap: 7, fontSize: 11, color: "#8C8478" }}>
          <span>Need to buy</span><span>Category</span><span>Size (L)</span><span>Price</span><span /></div>
        {items.map((it) => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr .7fr .7fr auto", gap: 7, alignItems: "center", marginTop: 7 }}>
            <input className="cell" value={it.name} onChange={(e) => setShop((p) => p.map((x) => x.id === it.id ? { ...x, name: e.target.value } : x))} />
            <select className="cell" value={it.cat} onChange={(e) => setShop((p) => p.map((x) => x.id === it.id ? { ...x, cat: e.target.value } : x))}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <span className="num" style={{ fontSize: 13, color: "#5C544A" }}>{it.liters}</span>
            <span className="num" style={{ fontSize: 13, color: "#5C544A" }}>${it.price}</span>
            <button onClick={() => setShop((p) => p.filter((x) => x.id !== it.id))} style={{ border: "none", background: "none", cursor: "pointer", color: "#B0A697", fontSize: 18 }}>×</button>
          </div>))}
        <button className="btn" onClick={() => setShop((p) => [...p, { id: uid(), name: "New item", cat: "Vegetable" }])} style={{ background: "#fff", color: INK, border: `1px solid ${LINE}`, marginTop: 10 }}>+ Add need</button>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16 }}>
          <Field label="Fridge space (L)"><input className="cell num" type="number" value={space} onChange={(e) => setSpace(+e.target.value)} style={{ width: 110 }} /></Field>
          <Field label="Budget ($)"><input className="cell num" type="number" value={budget} onChange={(e) => setBudget(+e.target.value)} style={{ width: 110 }} /></Field>
          <Readout label={`All at ${store}`} value={`$${allTot.price.toFixed(0)} · ${allTot.liters.toFixed(0)} L`} />
        </div>
      </Card>

      <Result title={fits ? "Everything fits ✓" : `Drop ${dropped.length} to fit`} big={`${keptTot.price.toFixed(0)}`} unit={`$ of $${budget} · ${keptTot.liters.toFixed(0)}/${space} L · ${keptKcal.toLocaleString()} kcal`}>
        {!fits && <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: MUSTARD, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Suggested to drop</div>
          {dropped.map((d) => <div key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ color: PAPER }}>{d.name} <span style={{ color: "#9B9286", fontSize: 12 }}>· {d.cat}</span></span>
            <span style={{ color: "#C9907F", fontSize: 12, textAlign: "right" }}>{d.reason}</span></div>)}
        </div>}
        <div style={{ fontSize: 12, color: MUSTARD, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: 1, margin: "18px 0 10px" }}>Basket balance (kept)</div>
        {balance.map((b) => { const pct = Math.min(100, (b.val / b.target) * 100); return (
          <div key={b.label} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#D8CFC0", marginBottom: 3 }}><span>{b.label}</span><span className="num">{b.val}{b.label.includes("item") ? "" : "g"}</span></div>
            <div style={{ height: 7, background: "rgba(255,255,255,.1)", borderRadius: 4 }}><div style={{ width: `${pct}%`, height: "100%", background: b.color, borderRadius: 4, transition: "width .4s" }} /></div>
          </div>); })}
        <p style={{ fontSize: 12, color: "#9B9286", margin: "12px 0 0" }}>Drops chosen by lowest (health + value-per-$) per unit of space & budget used. Switch stores above to compare pack sizes.</p>
      </Result>
    </>
  );
}

/* ============ TAB 3: grocery plan ============ */
function GroceryPlan() {
  const [weeks, setWeeks] = useState(2);         // 1-4 week planning
  const [week, setWeek] = useState(1);           // selected week
  const [open, setOpen] = useState(null);        // "w-i" expanded day
  const [checked, setChecked] = useState({});    // grocery checkboxes
  const [city, setCity] = useState("Minneapolis");
  const [cityInput, setCityInput] = useState("Minneapolis");
  const [cityStatus, setCityStatus] = useState("idle"); // idle|checking|error
  const [weightLbs, setWeightLbs] = useState(207);
  const [pace, setPace] = useState(1.5);         // lbs to lose per week

  const days = MEALPLAN[(week - 1) % 2].days;
  const dayTotal = (d) => d.meals.reduce((s, m) => s + m.kcal, 0);
  const weekAvg = Math.round(days.reduce((s, d) => s + dayTotal(d), 0) / days.length);
  const toggle = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }));
  const legend = { B: ["🅑", "Breakfast"], S: ["🅢", "Snack"], L: ["🅛", "Lunch"], D: ["🅓", "Dinner"] };

  // ── nutrition math ──
  const kg = (+weightLbs || 0) / 2.20462;
  const maintenance = Math.round(kg * 30);
  const dailyDeficit = Math.round((+pace || 0) * 500);   // 1 lb ≈ 3500 kcal ÷ 7 = 500/day
  const targetAvg = Math.max(1200, Math.round(maintenance - dailyDeficit));

  // ── city validation against real map cities (falls back to Minneapolis) ──
  const validateCity = async () => {
    const q = cityInput.trim();
    if (!q || q.toLowerCase() === city.toLowerCase()) { setCityStatus("idle"); return; }
    setCityStatus("checking");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 80,
          messages: [{ role: "user", content: `Is "${q}" a real city findable on Google Maps? Reply ONLY compact JSON: {"valid":true|false,"city":"Canonical City, Region/Country"}` }] }),
      });
      const data = await res.json();
      const text = (data.content || []).map((c) => c.type === "text" ? c.text : "").join("");
      const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      if (parsed.valid && parsed.city) { setCity(parsed.city); setCityInput(parsed.city); setCityStatus("ok"); }
      else { setCity("Minneapolis"); setCityInput("Minneapolis"); setCityStatus("error"); }
    } catch { setCity("Minneapolis"); setCityInput("Minneapolis"); setCityStatus("error"); }
  };

  const onWeeks = (v) => { setWeeks(v); if (week > v) setWeek(1); setOpen(null); };
  const darkInput = { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 8, color: PAPER, padding: "8px 10px", fontSize: 15, width: "100%", boxSizing: "border-box" };
  const capLabel = { fontSize: 11, color: "#9B9286", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 };

  return (
    <>
      {/* header — inputs on top, computed stats pushed down */}
      <div className="fade" style={{ background: INK, color: PAPER, borderRadius: 16, padding: "28px 26px", marginTop: 14 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: 2, color: MUSTARD, textTransform: "uppercase" }}>{weeks}-week plan · {city}</div>

        {/* input row (one-word labels) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14, marginTop: 18 }}>
          <div>
            <div style={capLabel}>Weeks</div>
            <select value={weeks} onChange={(e) => onWeeks(+e.target.value)} style={{ ...darkInput, cursor: "pointer" }}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n} style={{ color: INK }}>{n}</option>)}
            </select>
          </div>
          <div>
            <div style={capLabel}>City</div>
            <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} onBlur={validateCity}
              onKeyDown={(e) => { if (e.key === "Enter") validateCity(); }}
              placeholder="Enter a city" style={darkInput} />
            <div style={{ fontSize: 10.5, marginTop: 4, height: 12, color: cityStatus === "error" ? "#E8A88F" : cityStatus === "checking" ? MUSTARD : "#7C756B" }}>
              {cityStatus === "checking" ? "checking…" : cityStatus === "error" ? "not found — using Minneapolis" : cityStatus === "ok" ? "✓ matched" : ""}
            </div>
          </div>
          <div>
            <div style={capLabel}>Weight</div>
            <div style={{ position: "relative" }}>
              <input type="number" value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} style={{ ...darkInput, paddingRight: 34 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#9B9286" }}>lbs</span>
            </div>
          </div>
          <div>
            <div style={capLabel}>Pace</div>
            <div style={{ position: "relative" }}>
              <input type="number" step="0.25" value={pace} onChange={(e) => setPace(e.target.value)} style={{ ...darkInput, paddingRight: 46 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#9B9286" }}>lb/wk</span>
            </div>
          </div>
        </div>

        {/* computed stats (pushed down) */}
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 24, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.12)" }}>
          {[["Maintenance", `${maintenance.toLocaleString()} kcal`], ["Target avg", `${targetAvg.toLocaleString()} kcal`], ["Deficit", `~${dailyDeficit}/day`], ["Est. loss", `${pace} lb/wk`], ["Week avg", `${weekAvg} kcal`]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 11, color: "#9B9286" }}>{l}</div><div className="num" style={{ fontSize: 24, fontWeight: 600, fontFamily: "Fraunces, serif" }}>{v}</div></div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#9B9286", margin: "16px 0 0" }}>Maintenance = weight(kg) × 30. Target = maintenance − pace × 500/day (1 lb ≈ 3500 kcal). Per week: 2 low days · 1 bike day · rest standard.</p>
      </div>

      {/* meal chart */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>Daily meal chart</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => <button key={w} className="btn" onClick={() => { setWeek(w); setOpen(null); }} style={{ background: week === w ? TEAL : "#fff", color: week === w ? "#fff" : INK, border: `1px solid ${week === w ? TEAL : LINE}` }}>Week {w}</button>)}
          </div>
        </div>
        {days.map((d, i) => {
          const key = `${week}-${i}`, total = dayTotal(d), isOpen = open === key, dt = DAY_TYPE[d.type];
          return (
            <div key={key} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 10, marginTop: 10 }}>
              <div onClick={() => setOpen(isOpen ? null : key)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600, width: 100 }}>{d.day}</span>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#fff", background: dt.color, borderRadius: 5, padding: "2px 7px" }}>{dt.label}</span>
                <div style={{ flex: 1, height: 7, background: "#EDE6DA", borderRadius: 4, position: "relative", minWidth: 60 }}>
                  <div style={{ width: `${Math.min(100, (total / maintenance) * 100)}%`, height: "100%", background: dt.color, borderRadius: 4 }} />
                  <div style={{ position: "absolute", left: `${Math.min(100, (targetAvg / maintenance) * 100)}%`, top: -2, height: 11, width: 2, background: INK, opacity: 0.4 }} title="target" />
                </div>
                <span className="num" style={{ fontSize: 14, fontWeight: 600, width: 74, textAlign: "right" }}>{total} kcal</span>
                <span style={{ color: "#B0A697", fontSize: 12, width: 14 }}>{isOpen ? "▾" : "▸"}</span>
              </div>
              {isOpen && (
                <div className="fade" style={{ padding: "8px 0 4px 110px" }}>
                  {d.meals.map((m, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "4px 0" }}>
                      <span style={{ fontSize: 13 }}>{legend[m.t][0]}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "#4A4239" }}>{m.text}</span>
                      <span className="num" style={{ fontSize: 12, color: "#8C8478" }}>{m.kcal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14, fontSize: 11, color: "#8C8478" }}>
          {Object.values(legend).map(([e, l]) => <span key={l}>{e} {l}</span>)}
          <span>│ target marker = {targetAvg.toLocaleString()} kcal</span>
        </div>
      </Card>

      {/* dressings */}
      <Card>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600, marginBottom: 12 }}>🥣 Batch dressings <span style={{ fontSize: 13, fontWeight: 400, color: "#8C8478" }}>— make Sunday, keeps 5–6 days</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {DRESSINGS.map((dr) => (
            <div key={dr.name} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", background: "#fff" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: TEAL }}>{dr.name}</div>
              <div style={{ fontSize: 11, color: MUSTARD, textTransform: "uppercase", letterSpacing: 1, margin: "3px 0 8px" }}>{dr.tag}</div>
              <div style={{ fontSize: 12.5, color: "#4A4239", lineHeight: 1.5 }}>{dr.recipe}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* grocery lists */}
      <Card>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600, marginBottom: 4 }}>🛒 Grocery lists <span style={{ fontSize: 13, fontWeight: 400, color: "#8C8478" }}>— 2-week bulk, tap to check off</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 12 }}>
          {[["Costco (bulk)", GROCERY_COSTCO], ["Target / Hyvee / Cubs (perishables)", GROCERY_LOCAL]].map(([title, list]) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, textTransform: "uppercase", color: TERRA, marginBottom: 8 }}>{title}</div>
              {list.map(([item, note]) => {
                const key = title + item, on = !!checked[key];
                return (
                  <div key={key} onClick={() => toggle(key)} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "5px 0", cursor: "pointer", opacity: on ? 0.45 : 1 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? TEAL : LINE}`, background: on ? TEAL : "#fff", color: "#fff", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{on ? "✓" : ""}</span>
                    <span style={{ flex: 1, fontSize: 13, textDecoration: on ? "line-through" : "none", color: "#3A342C" }}>{item}{note && <span style={{ color: "#9B9286", fontSize: 11.5 }}> — {note}</span>}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 12, color: "#9B9286", margin: "14px 4px 0" }}>Structured as {"{ day, mealType, items[], kcal }"} across 14 days — same shape the Plate Lab uses, so days here can feed the calorie log once we wire import/export.</p>
    </>
  );
}

/* ============ shared UI ============ */
function Card({ children }) { return <div className="fade" style={{ background: CARD, border: "1px solid #E6DDCE", borderRadius: 14, padding: "20px 22px", marginTop: 14 }}>{children}</div>; }
function Head({ n, done, children }) { return <div style={{ display: "flex", alignItems: "center", fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600, marginBottom: 14 }}>
  <span style={{ display: "inline-flex", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", background: done ? TEAL : "transparent", color: done ? PAPER : INK, border: `1.5px solid ${done ? TEAL : LINE}`, fontFamily: "JetBrains Mono, monospace", fontSize: 12, marginRight: 10 }}>{done ? "✓" : n}</span>{children}</div>; }
function ToolBtn({ active, onClick, color, children }) { return <button className="btn" onClick={onClick} style={{ background: active ? color : "#fff", color: active ? "#fff" : INK, border: `1px solid ${active ? color : LINE}` }}>{children}</button>; }
function Field({ label, children }) { return <div><div style={{ fontSize: 11, color: "#8C8478", marginBottom: 4 }}>{label}</div>{children}</div>; }
function Readout({ label, value }) { return <div><div style={{ fontSize: 11, color: "#8C8478", marginBottom: 4 }}>{label}</div><div className="num" style={{ fontSize: 14, fontWeight: 600 }}>{value}</div></div>; }
function Lbl({ v, on, suffix, step = "1" }) { return <div style={{ position: "relative" }}><input className="cell num" type="number" step={step} value={v} onChange={(e) => on(+e.target.value)} style={{ paddingRight: 34 }} /><span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#A89E8F" }}>{suffix}</span></div>; }
function Measure({ pts, color, circle }) { if (!pts.length) return null; return (<>{pts.length === 2 && (circle
  ? <circle cx={(pts[0].x + pts[1].x) / 2} cy={(pts[0].y + pts[1].y) / 2} r={dist(pts[0], pts[1]) / 2} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6 5" />
  : <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke={color} strokeWidth="3" />)}
  {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill={color} stroke="#fff" strokeWidth="2" />)}</>); }
function Result({ title, big, unit, children }) { return <div className="fade" style={{ background: INK, color: PAPER, borderRadius: 14, padding: "24px 22px", marginTop: 16 }}>
  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: 2, color: MUSTARD, textTransform: "uppercase" }}>{title}</div>
  <div style={{ fontFamily: "Fraunces, serif", fontSize: 50, fontWeight: 600, lineHeight: 1 }}>{big} <span style={{ fontSize: 18, color: "#B9B0A2" }}>{unit}</span></div>
  {children}</div>; }
