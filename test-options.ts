import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function test() {
  try {
    const result = await yahooFinance.options('AAPL');
    console.log(Object.keys(result));
    if (result.options && result.options.length > 0) {
      console.log(result.options[0].calls[0]);
    }
    console.log("Expirations:", result.expirationDates);
  } catch (e) {
    console.error(e);
  }
}
test();
