using CurrencyConverter.Models;
using FluentValidation;

namespace CurrencyConverter.Validations;

public class CurrencyRequestValidator : AbstractValidator<CurrencyRequest>
{
    // First year with rates in the source file
    private const int MinYear = 2004;

    // Month codes as they appear in the source file
    private static readonly string[] MonthCodes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    public CurrencyRequestValidator()
    {
        RuleFor(request => request.CurrencyCode)
            .NotEmpty().WithMessage("Currency code is required.");

        RuleFor(request => request.Year)
            .InclusiveBetween(MinYear, DateTime.Now.Year).WithMessage($"Year must be between {MinYear} and {DateTime.Now.Year}.");

        RuleFor(request => request.MonthCode)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Month code is required.")
            .Must(BeAValidMonthCode).WithMessage("Month code must be a valid month abbreviation (e.g., Ene, Feb, Mar, etc.).");

        RuleFor(request => request.Day)
            .Cascade(CascadeMode.Stop)
            .InclusiveBetween(1, 31).WithMessage("Day must be between 1 and 31.")
            .Must(ExistInMonth).WithMessage("Day does not exist in the given month.");
    }

    private static bool BeAValidMonthCode(string monthCode)
    {
        return MonthCodes.Contains(monthCode);
    }

    private static bool ExistInMonth(CurrencyRequest request, int day)
    {
        var monthIndex = Array.IndexOf(MonthCodes, request.MonthCode);

        // An invalid year or month is already reported by its own rule
        if (monthIndex < 0 || request.Year < MinYear || request.Year > DateTime.Now.Year)
        {
            return true;
        }

        return day <= DateTime.DaysInMonth(request.Year, monthIndex + 1);
    }
}
