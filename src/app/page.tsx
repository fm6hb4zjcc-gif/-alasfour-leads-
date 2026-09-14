"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");

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
        onClick={() => alert("تم استلام الرابط: " + url)}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        تحليل الإعلان
      </button>
    </main>
  );
}
