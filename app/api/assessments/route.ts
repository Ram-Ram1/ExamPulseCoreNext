import { NextResponse } from 'next/server';
import { mockAssessments } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ assessments: mockAssessments });
}
