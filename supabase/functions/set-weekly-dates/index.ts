import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WeekDatesRequest {
  selectionId: string;
  referenceDate?: string;
}

function getWeekDates(referenceDate: Date): { weekStart: string; weekEnd: string } {
  const day = referenceDate.getDay();
  const tuesday = 2;
  
  let daysToSubtract = day - tuesday;
  if (daysToSubtract < 0) {
    daysToSubtract += 7;
  }
  
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { selectionId, referenceDate }: WeekDatesRequest = await req.json();

    if (!selectionId) {
      throw new Error('Selection ID is required');
    }

    const refDate = referenceDate ? new Date(referenceDate) : new Date();
    const { weekStart, weekEnd } = getWeekDates(refDate);

    const { data: selection, error: updateError } = await supabase
      .from('weekly_eleven_selections')
      .update({
        week_start_date: weekStart,
        week_end_date: weekEnd,
      })
      .eq('id', selectionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const { data: calcResult, error: calcError } = await supabase.rpc(
      'calculate_weekly_eleven_points',
      { selection_id: selectionId }
    );

    if (calcError) {
      console.error('Error calculating points:', calcError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        weekStart,
        weekEnd,
        calculatedPoints: calcResult || 0,
        selection,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});