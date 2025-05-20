import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://c863-2401-4900-632f-c407-134-64ab-3cbf-92d.ngrok-free.app/data');
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from external API');
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch LiFi data' },
      { status: 500 }
    );
  }
} 