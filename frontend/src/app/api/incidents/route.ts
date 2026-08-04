import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), '..', 'data', 'synthetic_traffic_accidents.json');
    if (fs.existsSync(dataPath)) {
      const fileContents = fs.readFileSync(dataPath, 'utf8');
      const incidents = JSON.parse(fileContents);
      return NextResponse.json(incidents);
    }
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load dataset' }, { status: 500 });
  }
}
