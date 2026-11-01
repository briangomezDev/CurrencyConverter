using CurrencyConverter.Models;
using CurrencyConverter.Service;
using CurrencyConverter.Source;
using CurrencyConverter.Validations;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddScoped<IValidator<CurrencyRequest>, CurrencyRequestValidator>();    
builder.Services.AddScoped<ICurrencySource, FileCurrencySource>();
builder.Services.AddScoped<ICurrencyService, CurrencyService>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Currency}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
