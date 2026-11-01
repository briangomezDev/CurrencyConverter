using CurrencyConverter.Models;
using CurrencyConverter.Source;
using ErrorOr;
using FluentValidation;

namespace CurrencyConverter.Service;

sealed class CurrencyService : ICurrencyService
{
    private readonly ICurrencySource _currencySource;
    private readonly IValidator<CurrencyRequest> _validator;
    public CurrencyService(ICurrencySource currencySource, IValidator<CurrencyRequest> validator)
    {
        _currencySource = currencySource ?? throw new ArgumentNullException(nameof(currencySource));
        _validator = validator ?? throw new ArgumentNullException(nameof(validator));
    }   

    public async Task<ErrorOr<decimal>> GetCurrencyRateAsync(CurrencyRequest request)
    {
        if (request is null)
            throw new ArgumentNullException(nameof(request));

        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return validationResult.Errors
                .Select(e => Error.Validation(e.PropertyName, e.ErrorMessage))
                .ToList();
        }
        
        var currencies = await _currencySource.GetCurrencyRatesAsync();

        var currency = currencies.FirstOrDefault(c => c.CurrencyCode == request.CurrencyCode && c.Year == request.Year && c.MonthCode == request.MonthCode && c.Day == request.Day);
        if (currency == null)
        {
            return Error.NotFound("Currency.NotFound", "Currency not found");
        }

        return currency.CurrencyRate;
    }
}
