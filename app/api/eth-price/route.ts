/**
 * API route to fetch ETH price
 * This avoids CORS issues by fetching from the server side
 */

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr',
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Return price or default to 0
    const ethPrice = data.ethereum?.inr || 0;

    return Response.json({
      success: true,
      ethPrice: ethPrice,
    });
  } catch (error: any) {
    console.error('Error fetching ETH price:', error);

    // Return default price on error
    return Response.json(
      {
        success: false,
        ethPrice: 0,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
