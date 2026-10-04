import { NextResponse } from 'next/server';
import { FinancingRateSyncService } from '@/lib/financing/FinancingRateSyncService';

export const dynamic = 'force-dynamic'; // Não usar cache estático

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Simples proteção de rota, idealmente usar secret do env
    // if (authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    const result = await FinancingRateSyncService.syncVehicleRates();

    if (!result.success) {
      return NextResponse.json({ error: result.message || 'Falha na sincronização' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Sincronização realizada com sucesso!',
      count: result.count
    });

  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
