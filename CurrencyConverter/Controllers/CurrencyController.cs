using CurrencyConverter.Models;
using CurrencyConverter.Service;
using Microsoft.AspNetCore.Mvc;

namespace CurrencyConverter.Controllers;

public class CurrencyController : Controller
{
    private readonly ILogger<CurrencyController> _logger;
    private readonly ICurrencyService _currencyService;
    public CurrencyController(ILogger<CurrencyController> logger, ICurrencyService currencyService)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _currencyService = currencyService ?? throw new ArgumentNullException(nameof(currencyService));
    }
    public IActionResult Index()
    {
        return View();
    }
    [HttpPost]
    public async Task<JsonResult> GetCurrencyRate([FromBody] CurrencyRequest request)
    {
        var result = await _currencyService.GetCurrencyRateAsync(request);

        if (result.IsError)
        {
            return Json(new { success = false, errorMessage = result.FirstError.Description });
        }

        return Json(new { success = true, currencyRate = result.Value });
    }
}
