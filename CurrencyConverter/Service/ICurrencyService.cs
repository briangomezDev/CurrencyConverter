using CurrencyConverter.Models;
using ErrorOr;

namespace CurrencyConverter.Service;

public interface ICurrencyService
{
    Task<ErrorOr<decimal>> GetCurrencyRateAsync(CurrencyRequest request);
}
