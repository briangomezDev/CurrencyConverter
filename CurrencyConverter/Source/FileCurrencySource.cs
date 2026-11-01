using ClosedXML.Excel;
using CurrencyConverter.Models;

namespace CurrencyConverter.Source;

sealed class FileCurrencySource : ICurrencySource
{
    private const int HeaderRow = 3;
    private const int FirstCurrencyColumn = 4;

    public Task<IEnumerable<Currency>> GetCurrencyRatesAsync()
    {
        try
        {
            var filePath = Path.Combine("wwwroot", "resource", "TASAS_CONVERTIBLES_OTRAS_MONEDAS.xlsx");
            if(Path.Exists(filePath))
            {
                var currencyRates = new List<Currency>();

                using (var workbook = new XLWorkbook(filePath))
                {
                    var worksheet = workbook.Worksheet("Diario");

                    // Each currency has its own column, starting after Año, Mes and Día
                    var currencyColumns = worksheet.Row(HeaderRow).CellsUsed()
                        .Where(cell => cell.Address.ColumnNumber >= FirstCurrencyColumn)
                        .Select(cell => (Column: cell.Address.ColumnNumber, Code: cell.GetString().TrimStart('*').Trim()))
                        .ToList();

                    foreach (var row in worksheet.RowsUsed(row => row.RowNumber() > HeaderRow))
                    {
                        // Rows without a numeric year are footnotes
                        if (!row.Cell(1).Value.IsNumber)
                        {
                            continue;
                        }

                        var year = row.Cell(1).GetValue<int>();
                        var monthCode = row.Cell(2).GetString().Trim();
                        var day = row.Cell(3).GetValue<int>();

                        foreach (var (column, currencyCode) in currencyColumns)
                        {
                            // Not every currency has a rate for every date
                            var rateCell = row.Cell(column);
                            if (!rateCell.Value.IsNumber)
                            {
                                continue;
                            }

                            currencyRates.Add(new Currency
                            {
                                Year = year,
                                MonthCode = monthCode,
                                Day = day,
                                CurrencyCode = currencyCode,
                                CurrencyRate = rateCell.GetValue<decimal>()
                            });
                        }
                    }
                }

                return Task.FromResult<IEnumerable<Currency>>(currencyRates);
            }
            else
            {
                throw new FileNotFoundException("Currency rates file not found.");
            }   
        }
        catch (System.Exception)
        {
            throw;
        }
    }
}
