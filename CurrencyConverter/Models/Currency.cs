namespace CurrencyConverter.Models;

public class Currency
{
    public int Year { get; set; }
    public string? MonthCode { get; set; }
    public int Day { get; set; }
    //Country name
    public string? CurrencyCode { get; set; }
    public decimal CurrencyRate { get; set; }
}
