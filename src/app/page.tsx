"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeAd() {
    if (!url.trim()) {
      setResult("حط رابط الإعلان أولاً");
      return;
    }

    setLoading(true);
    setResult("");

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
        setResult(data.error || "حدث خطأ");
        return;
      }

      setResult(data.message);
    } catch {
      setResult("تعذر الاتصال بنظام التحليل");
    } finally {
      setLoading(false);
    }
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

      {result && (
        <p
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
          }}
        >
          {result}
        </p>
      )}
    </main>
  );
}
