import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function test() {
  try {
    const result = await yahooFinance.quoteSummary('AAPL', { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] });
    console.log("Price:", result.financialData?.currentPrice);
    console.log("Operating Cashflow:", result.financialData?.operatingCashflow);
    console.log("Shares Outstanding:", result.defaultKeyStatistics?.sharesOutstanding);
    console.log("Trailing EPS:", result.defaultKeyStatistics?.trailingEps);
    console.log("Book Value:", result.defaultKeyStatistics?.bookValue);
    console.log("Trailing PE:", result.summaryDetail?.trailingPE);
    console.log("Revenue Growth:", result.financialData?.revenueGrowth);
  } catch (e) {
    console.error(e);
  }
}
test();
