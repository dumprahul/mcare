import { NextResponse } from 'next/server';

export async function GET() {
  const url = "https://wghhrmgntnzudopyvshe.supabase.co/rest/v1/vitals";
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaGhybWdudG56dWRvcHl2c2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0Nzc0ODAsImV4cCI6MjA2MzA1MzQ4MH0.n2k0oaI4xD1bIRs4Yu9zkTIQ9uMdeyrizkVodjJlxk8";
  const headers = {
    apikey,
    Authorization: `Bearer ${apikey}`,
  };

  const res = await fetch(url, { headers });
  const data = await res.json();
  return NextResponse.json(data);
}
