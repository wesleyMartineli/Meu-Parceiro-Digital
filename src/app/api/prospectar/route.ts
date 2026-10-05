import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const RENDER_URL =
      process.env.PROSPECTA_API_URL ||
      process.env.NEXT_PUBLIC_PROSPECTA_API_URL ||
      'https://prospect-main.onrender.com/api/scrape';

    const res = await fetch(RENDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Erro no servidor de prospecção (${res.status}): ${errText}`, leads: [] },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro no proxy de prospecção:', error);
    return NextResponse.json(
      { error: error.message || 'Erro de comunicação com o servidor de prospecção', leads: [] },
      { status: 500 }
    );
  }
}
