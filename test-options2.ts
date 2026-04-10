import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function test() {
  try {
    const result = await yahooFinance.options('AAPL', { date: '2026-04-17' });
    console.log(result.options[0].calls.length);
  } catch (e) {
    console.error(e);
  }
}
test();
