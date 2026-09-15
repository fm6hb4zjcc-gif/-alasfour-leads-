"use client";

import { useState } from "react";

type Analysis = {
  classification?: "owner" | "office_company" | "unclear";
  owner_score?: number;
  confidence?: "low" | "medium" | "high";
  property_type?: string;
  location?: string;
  price?: string;
  advertiser?: string;
  phone?: string;
  reasons?: string[];
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeAd() {
    if (!url.trim()) {
      setMessage("حط رابط الإعلان أولاً");
      setAnalysis(null);
      return;
    }

    setLoading(true);
    setMessage("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "حدث خطأ أثناء التحليل");
        return;
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setMessage(data.message || "تم التحليل ولكن لم ترجع نتيجة");
      }
    } catch {
      setMessage("تعذر الاتصال بنظام التحليل");
    } finally {
      setLoading(false);
    }
  }

  function classificationLabel(value?: string) {
    if (value === "owner") return "مالك محتمل";
    if (value === "office_company") return "مكتب / شركة عقارية";
    return "غير واضح";
  }

  return (
    <main
      dir="rtl"
      style={{
        maxWidth: "700px",
        margin: "50px auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1>🏠 ALASFOUR LEADS</h1>

      <p>نظام فرز إعلانات العقارات واكتشاف الملاك المحتملين</p>

      <hr />

      <h2>إضافة إعلان عقاري</h2>

      <p>حط رابط الإعلان:</p>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "16px",
          marginBottom: "15px",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={analyzeAd}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        {loading ? "جاري التحليل..." : "تحليل الإعلان"}
      </button>

      {message && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
          }}
        >
          {message}
        </div>
      )}

      {analysis && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
          }}
        >
          <h2>{classificationLabel(analysis.classification)}</h2>

          <p>
            <strong>نسبة احتمال المالك:</strong>{" "}
            {analysis.owner_score ?? 0}%
          </p>

          <p>
            <strong>الثقة:</strong> {analysis.confidence || "غير محدد"}
          </p>

          <p>
            <strong>نوع العقار:</strong>{" "}
            {analysis.property_type || "غير مذكور"}
          </p>

          <p>
            <strong>المنطقة:</strong>{" "}
            {analysis.location || "غير مذكورة"}
          </p>

          <p>
            <strong>السعر:</strong> {analysis.price || "غير مذكور"}
          </p>

          <p>
            <strong>المعلن:</strong>{" "}
            {analysis.advertiser || "غير مذكور"}
          </p>

          <p>
            <strong>الهاتف:</strong> {analysis.phone || "غير مذكور"}
          </p>

          {analysis.reasons && analysis.reasons.length > 0 && (
            <>
              <strong>أسباب التصنيف:</strong>
              <ul>
                {analysis.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </main>
  );
}
