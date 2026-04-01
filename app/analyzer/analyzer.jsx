"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/* ── Product Data ── */
const PRODUCTS = {
  professional: {
    id: "professional", name: "AngelLift® Professional DermaStrips", subtitle: "Professional",
    price: "$159.99", liftForce: "0.52N", slug: "angellift-essentials-kit", variantId: "44118992270",
    image: "https://angellift.com/cdn/shop/files/Untitled_design_1_300x300.png?v=1774594385",
    tagline: "Maximum correction for deeper lines",
    features: ["30% stronger lift than Original", "Professional-grade correction", "Targets deep wrinkles & folds", "Reusable — lasts 4–6 months"],
  },
  vermilion: {
    id: "vermilion", name: "AngelLift® Vermilion DermaStrips", subtitle: "Vermilion",
    price: "$129.99", liftForce: "0.39N", slug: "vermilion-vital-kit", variantId: "15920234004574",
    image: "https://angellift.com/cdn/shop/files/Untitled_design_3_119b50d8-2327-47c6-bdb9-a1ea19fe3d04_300x300.png?v=1774594385",
    tagline: "Targeted lip volume & vertical lift",
    features: ["Vertical lip lift technology", "Restores lip volume & definition", "Plumps thinning lips naturally", "Includes reshaping storage case"],
  },
  collagen: {
    id: "collagen", name: "AngelLift® Collagen DermaStrips", subtitle: "Collagen",
    price: "$99.00", liftForce: "0.024N", slug: "angellift-basic-collection", variantId: "31528996962398",
    image: "https://angellift.com/cdn/shop/files/Untitled_design_2_300x300.png?v=1774594385",
    tagline: "Enhanced collagen regeneration formula",
    features: ["Promotes active collagen regeneration", "Smooths lip lines & nasolabial folds", "Medical-grade hydrogel", "Reusable — lasts 4–6 months"],
  },
  original: {
    id: "original", name: "AngelLift® Original DermaStrips", subtitle: "Original",
    price: "$79.99", liftForce: "0.024N", slug: "starter", variantId: "23239667587",
    image: "https://angellift.com/cdn/shop/files/DermaStrips-Original-300x300_300x300.png?v=1774594385",
    tagline: "Gentle start to anti-aging care",
    features: ["Gentle lift for sensitive gums", "Ideal for fine lines & prevention", "Surgical-grade hydrogel", "Reusable — lasts 4–6 months"],
  },
};

/* ── Deterministic recommendation engine (matches quiz + area selector) ── */
const RECOMMENDATIONS = {
  lip:        { primary: "vermilion",    secondary: "professional" },
  marionette: { primary: "professional", secondary: "collagen" },
  nasolabial: { primary: "professional", secondary: "collagen" },
  perioral:   { primary: "collagen",     secondary: "professional" },
};

const REASONS = {
  professional: {
    lip: "Our analysis detected moderate depth lines around your lip area. The Professional DermaStrips deliver 0.52N of lift — the strongest in our lineup — for maximum correction.",
    marionette: "Your marionette line area shows depth that responds best to our strongest lift. The Professional DermaStrips target exactly this zone with professional-grade pressure.",
    nasolabial: "Nasolabial folds at this depth require sustained, strong pressure. Our Professional DermaStrips deliver the correction dermatologists recommend.",
    perioral: "The fine lines detected around your mouth area will respond dramatically to our Professional DermaStrips' sub-dermal pressure technology.",
  },
  vermilion: {
    lip: "Our analysis shows your lip area would benefit most from targeted vertical lift technology. The Vermilion DermaStrips are specifically designed to restore volume and definition.",
    marionette: "Based on your scan, our Vermilion DermaStrips will provide the ideal combination of lip enhancement and line reduction for your profile.",
    nasolabial: "Your scan indicates the Vermilion DermaStrips' targeted lift technology is your best match for both lip volume and surrounding line correction.",
    perioral: "The Vermilion DermaStrips' precision lift technology is ideal for the fine peri-oral patterns detected in your scan.",
  },
  collagen: {
    lip: "Your scan shows early-stage lines that respond exceptionally well to collagen stimulation. Our Collagen DermaStrips promote active regeneration for lasting results.",
    marionette: "The line depth detected suggests collagen stimulation will deliver the best long-term results. Our Collagen DermaStrips work beneath the surface to rebuild.",
    nasolabial: "Your nasolabial area shows the pattern that responds best to active collagen regeneration. The Collagen DermaStrips target this with medical-grade precision.",
    perioral: "Fine peri-oral lines like yours are a perfect candidate for collagen regeneration therapy. Our Collagen DermaStrips promote lasting skin renewal.",
  },
  original: {
    lip: "Your scan shows early signs that are perfect for preventive care. Our Original DermaStrips provide gentle, consistent lift that stops lines before they deepen.",
    marionette: "The patterns we detected are in early stages — ideal for our Original DermaStrips' gentle but effective approach to prevention.",
    nasolabial: "Early-stage lines like yours respond beautifully to our Original DermaStrips. Gentle, consistent pressure for visible prevention.",
    perioral: "Your fine lines are at the perfect stage for our Original DermaStrips — gentle care that prevents deepening while smoothing what's there.",
  },
};

function pickProduct(concern) {
  const rec = RECOMMENDATIONS[concern] || RECOMMENDATIONS.marionette;
  return PRODUCTS[rec.primary];
}

/* ── Analysis steps ── */
const ANALYSIS_STEPS = [
  "Mapping skin texture...",
  "Measuring line depth...",
  "Calculating elasticity...",
  "Determining optimal lift...",
];

/* ── Concerns ── */
const CONCERNS = [
  { id: "lip", label: "Lip enhancement", desc: "Volume & definition", icon: "👄" },
  { id: "marionette", label: "Marionette lines", desc: "Mouth to jawline", icon: "📐" },
  { id: "nasolabial", label: "Nasolabial folds", desc: "Nose to mouth", icon: "〰️" },
  { id: "perioral", label: "Peri-oral lines", desc: "Fine lines around lips", icon: "✨" },
];

/* ── Pixel helper ── */
function fireEvent(type, event, data) {
  try {
    if (window.parent !== window) {
      window.parent.postMessage({ type, event, data: data || {} }, "*");
    }
  } catch (e) {}
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function SkinAnalyzer() {
  const [phase, setPhase] = useState("ready"); // ready | camera | captured | analyzing | choosing | result
  const [concern, setConcern] = useState(null);
  const [product, setProduct] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [fakeMetrics, setFakeMetrics] = useState({});
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [copying, setCopying] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  /* ── Camera controls ── */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const videoCallbackRef = useCallback((node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, [phase]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      setPhase("camera");
      fireEvent("klaviyo_track", "Quiz Photo Taken", { photo_used: true, source: "analyzer" });
      fireEvent("meta_pixel", "ViewContent", { content_name: "DermaStrip Quiz", content_category: "quiz" });
    } catch (err) {
      alert("Could not access camera. Please check your browser permissions.");
    }
  };

  /* ── Basic skin detection (checks for skin-tone pixels) ── */
  const hasSkinTones = (canvas) => {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const centerX = Math.floor(w * 0.3);
    const centerY = Math.floor(h * 0.3);
    const sampleW = Math.floor(w * 0.4);
    const sampleH = Math.floor(h * 0.4);
    const data = ctx.getImageData(centerX, centerY, sampleW, sampleH).data;
    let skinPixels = 0;
    let totalPixels = 0;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i], g = data[i+1], b = data[i+2];
      totalPixels++;
      // Broad skin tone detection across all ethnicities
      if (r > 60 && g > 40 && b > 20 &&
          r > g && r > b &&
          Math.abs(r - g) > 10 &&
          r - b > 15 &&
          !(r > 220 && g > 220 && b > 220) && // not pure white
          !(r < 80 && g < 80 && b < 80)) { // not pure black/dark
        skinPixels++;
      }
    }
    return (skinPixels / totalPixels) > 0.15; // at least 15% skin-like pixels
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const isSkin = hasSkinTones(canvas);
    setCaptured(canvas.toDataURL("image/jpeg", 0.7));
    stopCamera();

    if (!isSkin) {
      setPhase("bad_photo");
    } else {
      setPhase("captured");
    }
  };

  const confirmPhoto = () => {
    setPhase("analyzing");
    setAnalysisStep(0);

    // Fake metrics appear over time
    setTimeout(() => setFakeMetrics(m => ({ ...m, depth: "moderate" })), 800);
    setTimeout(() => setFakeMetrics(m => ({ ...m, elasticity: "fair" })), 1600);
    setTimeout(() => {
      setAnalysisStep(1);
    }, 1200);
    setTimeout(() => {
      setAnalysisStep(2);
      setPhase("choosing");
    }, 2400);
  };

  const retakePhoto = () => {
    setCaptured(null);
    startCamera();
  };

  const selectConcern = (id) => {
    setConcern(id);
    setAnalysisStep(3);

    // Finish analysis after short delay
    setTimeout(() => {
      const rec = pickProduct(id);
      setProduct(rec);
      setFakeMetrics(m => ({ ...m, lift: rec.liftForce, confidence: "98%" }));

      fireEvent("klaviyo_track", "Quiz Results Viewed", {
        areas: [id],
        current_solution: "",
        had_braces: "",
        source: "analyzer",
        concern: id,
        recommended_product: rec.name,
        recommended_product_price: rec.price,
        recommended_product_variant: rec.variantId,
      });
      fireEvent("meta_pixel", "ViewContent", {
        content_name: "Quiz Results",
        content_category: "quiz",
        content_ids: [rec.variantId],
        value: parseFloat(rec.price.replace("$", "")),
        currency: "USD",
      });

      setPhase("result");
    }, 1200);
  };

  const handleBuyNow = () => {
    if (!product) return;
    fireEvent("meta_pixel", "AddToCart", {
      content_name: product.name,
      content_ids: [product.variantId],
      value: parseFloat(product.price.replace("$", "")),
      currency: "USD",
    });
    fireEvent("gtag_event", "add_to_cart", {
      currency: "USD",
      value: parseFloat(product.price.replace("$", "")),
    });
    fireEvent("klaviyo_track", "Quiz Product Clicked", {
      product: product.name,
      variant: product.variantId,
      price: product.price,
      isPrimary: true,
      source: "analyzer",
      concern: concern,
    });
  };

  const handleEmailSubmit = () => {
    if (!email || !email.includes("@")) return;
    setEmailSubmitted(true);
    try {
      const rec = RECOMMENDATIONS[concern] || RECOMMENDATIONS.marionette;
      const secondaryProduct = PRODUCTS[rec.secondary];
      const profileData = {
        "$email": email,
        "Quiz - Areas of Concern": concern || "",
        "Quiz - Current Solution": "",
        "Quiz - Had Braces": "",
        "Quiz - Recommended Product": product ? product.name : "",
        "Quiz - Secondary Product": secondaryProduct ? secondaryProduct.name : "",
        "Quiz - Completed": "Yes",
        "Quiz - Used Camera": "Yes",
        "Quiz - Discount Code": "START10",
      };
      if (window.parent !== window) {
        window.parent.postMessage({ type: "klaviyo_identify", data: profileData }, "*");
        window.parent.postMessage({ type: "klaviyo_track", event: "Quiz Completed", data: {
          areas: [concern],
          current_solution: "",
          had_braces: "",
          recommended_product: product ? product.name : "",
          recommended_product_price: product ? product.price : "",
          recommended_product_variant: product ? product.variantId : "",
          secondary_product: secondaryProduct ? secondaryProduct.name : "",
          photo_used: true,
          discount_code: "START10",
          email: email,
          source: "analyzer",
        }}, "*");
        window.parent.postMessage({ type: "meta_pixel", event: "Lead", data: { content_name: "Quiz Discount Capture", content_category: concern || "" }}, "*");
        window.parent.postMessage({ type: "gtag_event", event: "generate_lead", data: { currency: "USD", value: 0 }}, "*");
      }
    } catch (e) {}
  };

  const reset = () => {
    setPhase("ready");
    setConcern(null);
    setProduct(null);
    setCaptured(null);
    setAnalysisStep(0);
    setFakeMetrics({});
    setEmail("");
    setEmailSubmitted(false);
    setCopying(false);
  };

  /* ── Auto-resize iframe ── */
  useEffect(() => {
    const sendHeight = () => {
      try {
        if (window.parent !== window) {
          const height = document.documentElement.scrollHeight;
          window.parent.postMessage({ type: "resize_frame", height }, "*");
        }
      } catch (e) {}
    };
    sendHeight();
    const interval = setInterval(sendHeight, 500);
    return () => clearInterval(interval);
  }, [phase, product]);

  /* ── Render ── */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .az-container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: transparent; max-width: 780px; margin: 0 auto; padding: 0 16px; }
        .az-widget { display: flex; gap: 20px; min-height: 340px; }
        .az-left { flex: 1; background: #1A1612; border-radius: 16px; overflow: hidden; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 340px; }
        .az-right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        @media (max-width: 640px) {
          .az-widget { flex-direction: column; gap: 16px; }
          .az-left { min-height: 280px; }
        }
      `}</style>

      <div className="az-container">
        <div className="az-widget">
          {/* ── LEFT SIDE: Camera / Photo / Analysis ── */}
          <div className="az-left">
            {phase === "ready" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, textAlign: "center" }}>
                <div style={{ width: 130, height: 105, border: "2px dashed rgba(255,255,255,0.3)", borderRadius: "50%" }} />
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Align your mouth area here</div>
                <button onClick={startCamera} style={{
                  padding: "16px 36px", background: "#6B5D4F", color: "#F5F0EB", border: "none",
                  borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "0.5px",
                }}>Open Camera</button>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>No photo stored</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>100% private</span>
                </div>
              </div>
            )}

            {phase === "camera" && (
              <>
                <video ref={videoCallbackRef} autoPlay playsInline muted style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)",
                }} />
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 300 300">
                  <defs><mask id="gm"><rect width="300" height="300" fill="white"/><ellipse cx="150" cy="150" rx="90" ry="72" fill="black"/></mask></defs>
                  <rect width="300" height="300" fill="rgba(0,0,0,0.35)" mask="url(#gm)"/>
                  <ellipse cx="150" cy="150" rx="90" ry="72" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="8 4"/>
                  <text x="150" y="248" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12" fontFamily="sans-serif">Align your mouth area</text>
                </svg>
                <button onClick={takePhoto} style={{
                  position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10,
                  width: 64, height: 64, borderRadius: "50%", border: "4px solid #C4A882", background: "white",
                  cursor: "pointer", padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "white" }} />
                </button>
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </>
            )}

            {(phase === "captured" || phase === "bad_photo" || phase === "analyzing" || phase === "choosing" || phase === "result") && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20, textAlign: "center", width: "100%" }}>
                {/* Scanning circle */}
                <div style={{ width: 120, height: 96, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(phase === "analyzing" || phase === "choosing") && (
                    <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#C4A882", animation: "spin 0.8s linear infinite" }} />
                  )}
                  <div style={{
                    width: 120, height: 96, borderRadius: "50%", overflow: "hidden",
                    border: phase === "result" ? "2px solid #C4A882" : phase === "bad_photo" ? "2px solid #E24B4A" : "2px solid rgba(196,168,130,0.4)",
                  }}>
                    {captured && <img src={captured} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: phase === "captured" ? 1 : 0.6 }} />}
                  </div>
                  {phase === "result" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" fill="rgba(0,0,0,0.4)"/>
                        <path d="M10 16l4 4 8-8" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {phase === "bad_photo" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" fill="rgba(0,0,0,0.4)"/>
                        <path d="M11 11l10 10M21 11l-10 10" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Status text */}
                {phase === "captured" && (
                  <div style={{ color: "#C4A882", fontSize: 14, fontWeight: 500 }}>Photo captured</div>
                )}
                {phase === "bad_photo" && (
                  <div style={{ color: "#E24B4A", fontSize: 13, fontWeight: 500, textAlign: "center", lineHeight: 1.4 }}>
                    We couldn't detect a face.<br/>Please try again.
                  </div>
                )}
                {(phase === "analyzing" || phase === "choosing") && (
                  <>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, animation: "pulse 1.2s ease infinite" }}>
                      {ANALYSIS_STEPS[Math.min(analysisStep, 3)]}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0,1,2,3].map(i => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: i < analysisStep ? "#C4A882" : i === analysisStep ? "#C4A882" : "rgba(255,255,255,0.15)",
                          animation: i === analysisStep ? "pulse 0.8s ease infinite" : "none",
                        }} />
                      ))}
                    </div>
                  </>
                )}
                {phase === "result" && (
                  <>
                    <div style={{ color: "#C4A882", fontSize: 14, fontWeight: 600 }}>Analysis complete</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                      {Object.entries(fakeMetrics).map(([k, v]) => (
                        <div key={k} style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>
                          {k}: {v}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT SIDE ── */}
          <div className="az-right">
            {/* Ready state: explainer */}
            {phase === "ready" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 24, textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(139,115,85,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
                <div style={{ fontSize: 20, color: "#3D3428", fontWeight: 500, fontFamily: "Georgia, serif" }}>3-second skin scan</div>
                <div style={{ fontSize: 14, color: "#6B5D4F", lineHeight: 1.6, maxWidth: 240 }}>
                  Snap a quick photo of your mouth area. Our AI will analyze your skin and recommend the perfect DermaStrip.
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12, color: "#9A8E82" }}>
                  <span>✅ Clinically proven</span>
                  <span>🦈 Shark Tank Winner</span>
                </div>
              </div>
            )}

            {/* Camera active: guidance */}
            {phase === "camera" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 18, color: "#3D3428", fontWeight: 500, fontFamily: "Georgia, serif" }}>Almost there...</div>
                <div style={{ fontSize: 14, color: "#6B5D4F", lineHeight: 1.6, maxWidth: 220 }}>
                  Position your mouth area inside the oval guide and tap the shutter button.
                </div>
                <div style={{ fontSize: 13, color: "#9A8E82", marginTop: 4 }}>Just the lower half of your face — nose to chin</div>
              </div>
            )}

            {/* Photo captured: confirm or retake */}
            {phase === "captured" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 24, textAlign: "center", animation: "fadeIn 0.4s ease" }}>
                <div style={{ fontSize: 20, color: "#3D3428", fontWeight: 500, fontFamily: "Georgia, serif" }}>Looking great!</div>
                <div style={{ fontSize: 14, color: "#6B5D4F", lineHeight: 1.6, maxWidth: 240 }}>
                  Make sure your mouth area is clearly visible. Ready to analyze?
                </div>
                <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 280 }}>
                  <button onClick={retakePhoto} style={{
                    flex: 1, padding: "14px 16px", border: "2px solid #6B5D4F", borderRadius: 50,
                    background: "transparent", color: "#3D3428", fontSize: 14, fontWeight: 600,
                    cursor: "pointer",
                  }}>Retake</button>
                  <button onClick={confirmPhoto} style={{
                    flex: 2, padding: "14px 16px", border: "none", borderRadius: 50,
                    background: "#6B5D4F", color: "#F5F0EB", fontSize: 14, fontWeight: 600,
                    letterSpacing: "0.5px", cursor: "pointer",
                  }}>Analyze My Skin</button>
                </div>
              </div>
            )}

            {/* Bad photo: couldn't detect face */}
            {phase === "bad_photo" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 24, textAlign: "center", animation: "fadeIn 0.4s ease" }}>
                <div style={{ fontSize: 20, color: "#3D3428", fontWeight: 500, fontFamily: "Georgia, serif" }}>Let's try that again</div>
                <div style={{ fontSize: 14, color: "#6B5D4F", lineHeight: 1.6, maxWidth: 240 }}>
                  We couldn't detect skin in the photo. Make sure to capture just the lower half of your face — nose to chin.
                </div>
                <button onClick={retakePhoto} style={{
                  padding: "14px 32px", border: "none", borderRadius: 50,
                  background: "#6B5D4F", color: "#F5F0EB", fontSize: 14, fontWeight: 600,
                  letterSpacing: "0.5px", cursor: "pointer", width: "100%", maxWidth: 280,
                }}>Try Again</button>
              </div>
            )}

            {/* Analyzing (early): fake metrics appearing */}
            {phase === "analyzing" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 24, textAlign: "center", animation: "fadeIn 0.5s ease" }}>
                <div style={{ fontSize: 16, color: "#3D3428", fontWeight: 500 }}>Analyzing your photo...</div>
                <div style={{ fontSize: 13, color: "#6B5D4F", lineHeight: 1.6, maxWidth: 240 }}>
                  Our AI is examining skin depth, elasticity, and line patterns to find your ideal lift strength.
                </div>
                {Object.keys(fakeMetrics).length > 0 && (
                  <div style={{ marginTop: 8, padding: "12px 16px", background: "rgba(139,115,85,0.06)", borderRadius: 12, width: "100%", maxWidth: 240 }}>
                    <div style={{ fontSize: 11, color: "#9A8E82", marginBottom: 4, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Detected so far:</div>
                    {Object.entries(fakeMetrics).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 14, color: "#3D3428", padding: "2px 0", textTransform: "capitalize" }}>{k}: {v}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Choosing: concern selector */}
            {phase === "choosing" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 20px", width: "100%", animation: "fadeIn 0.5s ease" }}>
                <div style={{ fontSize: 14, color: "#8B7355", fontWeight: 600 }}>One quick question to refine your results:</div>
                <div style={{ fontSize: 17, color: "#1A1612", fontWeight: 500, marginBottom: 4 }}>What's your primary concern?</div>
                {CONCERNS.map(c => (
                  <button key={c.id} onClick={() => selectConcern(c.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    background: concern === c.id ? "rgba(139,115,85,0.08)" : "#FAFAF7",
                    border: concern === c.id ? "2px solid #C4A882" : "2px solid #EDEAE5",
                    borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "all 0.2s ease",
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: concern === c.id ? "rgba(139,115,85,0.12)" : "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1612" }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: "#6B5D4F" }}>{c.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Result: product card */}
            {phase === "result" && product && (
              <div style={{ width: "100%", animation: "fadeIn 0.6s ease" }}>
                <div style={{ border: "2px solid #C4A882", borderRadius: 16, overflow: "hidden", background: "#FAFAF7" }}>
                  {/* Badge */}
                  <div style={{ background: "linear-gradient(135deg, #6B5D4F, #8B7355)", padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#F5F0EB" }}>
                    ⭐ Your perfect match
                  </div>

                  <div style={{ padding: "20px 18px" }}>
                    {/* Product image + name */}
                    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", background: "#F5EDE4", flexShrink: 0 }}>
                        <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 600, color: "#1A1612", lineHeight: 1.25, fontFamily: "Georgia, serif" }}>{product.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 12, color: "#D4A017", letterSpacing: "1px" }}>★★★★★</span>
                          <span style={{ fontSize: 12, color: "#3D3428", fontWeight: 600 }}>4.8</span>
                          <span style={{ fontSize: 11, color: "#6B5D4F" }}>· Shark Tank Winner</span>
                        </div>
                      </div>
                    </div>

                    {/* Why this product */}
                    <div style={{ fontSize: 13, color: "#4A4340", lineHeight: 1.6, marginBottom: 14, padding: "10px 12px", background: "rgba(139,115,85,0.04)", borderRadius: 10 }}>
                      {REASONS[product.id]?.[concern] || product.tagline}
                    </div>

                    {/* Features */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                      {product.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3D3428" }}>
                          <span style={{ color: "#4CAF50", fontWeight: 700, fontSize: 14 }}>✓</span> {f}
                        </div>
                      ))}
                    </div>

                    {/* Price */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: "#1A1612" }}>{product.price}</span>
                      <span style={{ fontSize: 11, color: "#8B7355", padding: "4px 8px", background: "rgba(139,115,85,0.08)", borderRadius: 6 }}>Lift: {product.liftForce}</span>
                    </div>

                    {/* Buy Now */}
                    <a href={`https://angellift.com/cart/${product.variantId}:1`} target="_blank" rel="noopener noreferrer"
                      onClick={handleBuyNow}
                      style={{
                        display: "block", width: "100%", padding: "16px 24px", textAlign: "center", textDecoration: "none",
                        background: "linear-gradient(135deg, #6B5D4F, #8B7355)", color: "#F5F0EB",
                        fontSize: 15, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                        borderRadius: 50, boxShadow: "0 4px 20px rgba(107, 93, 79, 0.25)", boxSizing: "border-box",
                      }}>Buy Now →</a>

                    {/* Discount email capture */}
                    {!emailSubmitted ? (
                      <div style={{ marginTop: 16, padding: "16px", background: "linear-gradient(135deg, #FBF7F2, #F5EDE4)", borderRadius: 14, border: "1.5px solid #EDEAE5" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 18 }}>🎁</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1612" }}>First time? Get 10% off</div>
                            <div style={{ fontSize: 12, color: "#6B5D4F" }}>Enter your email for code <span style={{ color: "#C0392B", fontWeight: 600 }}>· expires tonight</span></div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                            onKeyDown={e => { if (e.key === "Enter") handleEmailSubmit(); }}
                            style={{
                              flex: 1, padding: "12px 14px", border: "1.5px solid #EDEAE5", borderRadius: 12,
                              fontSize: 15, color: "#1A1612", background: "white", outline: "none",
                              boxSizing: "border-box", minWidth: 0, fontFamily: "inherit",
                            }}
                            onFocus={e => e.target.style.borderColor = "#C4A882"}
                            onBlur={e => e.target.style.borderColor = "#EDEAE5"}
                          />
                          <button onClick={handleEmailSubmit} style={{
                            padding: "12px 16px", border: "none", borderRadius: 12, cursor: "pointer",
                            background: "#6B5D4F", color: "#F5F0EB", fontSize: 14, fontWeight: 700,
                            whiteSpace: "nowrap", flexShrink: 0,
                          }}>Get Code</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 16, padding: "16px", background: "linear-gradient(135deg, #F0EBE3, #E8DFD3)", borderRadius: 14, textAlign: "center", border: "2px solid #C4A882" }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1612", marginBottom: 8 }}>Your 10% discount code:</div>
                        <div style={{
                          fontSize: 24, fontWeight: 700, color: "#6B5D4F", background: "white",
                          padding: "10px 20px", borderRadius: 10, letterSpacing: "0.15em",
                          border: "2px dashed #C4A882", display: "inline-block", cursor: "pointer",
                          userSelect: "all", WebkitUserSelect: "all",
                        }}
                        onClick={() => {
                          try { navigator.clipboard.writeText("START10"); } catch(e) {
                            const ta = document.createElement("textarea"); ta.value = "START10"; ta.style.position = "fixed"; ta.style.left = "-9999px";
                            document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                          }
                          setCopying(true); setTimeout(() => setCopying(false), 2000);
                        }}>
                          {copying ? "✅ Copied!" : "START10"}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B5D4F", marginTop: 8 }}>Tap to copy · Apply at checkout</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Take full quiz link */}
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <a href="https://angellift.com/pages/product-quiz" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#8B7355", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Want more detail? Take our full 60-second quiz →
                  </a>
                </div>

                {/* Retake */}
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9A8E82", textDecoration: "underline", textUnderlineOffset: 3, padding: "8px 16px" }}>
                    Scan again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
