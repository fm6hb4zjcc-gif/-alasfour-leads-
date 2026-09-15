import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url;

    if (!url) {
      return NextResponse.json(
        { error: "رابط الإعلان مطلوب" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      message: "تم إرسال الإعلان للتحليل",
    });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحليل الإعلان" },
      { status: 500 }
    );
  }
}
