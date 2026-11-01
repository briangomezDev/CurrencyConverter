using CurrencyConverter.Models;

namespace CurrencyConverter.Source;

public interface ICurrencySource
{
    Task<IEnumerable<Currency>> GetCurrencyRatesAsync();
}
