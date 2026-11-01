(function () {
    const monthCodes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const today = new Date();

    const currencyCode = signal("DOLAR ESTADOUNIDENSE");
    const day = signal(today.getDate());
    const monthCode = signal(monthCodes[today.getMonth()]);
    const year = signal(today.getFullYear());
    const localAmount = Number($("LocalAmount").value);
    const rate = signal(null);

    let pendingRequest = null;

    const bindInput = (id, target, parse = (value) => value) => {
        const input = $(id);
        input.value = target.value;
        input.addEventListener("change", (event) => {
            target.value = parse(event.target.value);
        });
    };

    const loadRate = async (request) => {
        // Discard the previous request so an old response can't overwrite a newer one
        pendingRequest?.abort();
        pendingRequest = new AbortController();

        try {
            const response = await fetch("/Currency/GetCurrencyRate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
                signal: pendingRequest.signal
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const data = await response.json();
            if (!data.success) {
                rate.value = null;
                warning(data.errorMessage);
                return;
            }
            rate.value = data.currencyRate;
        } catch (err) {
            if (err.name === "AbortError") {
                return;
            }
            rate.value = null;
            danger("No se pudo obtener la tasa de cambio.");
        }
    };

    bindInput("CurrencyCode", currencyCode);
    bindInput("Day", day, Number);
    bindInput("MonthCode", monthCode);
    bindInput("Year", year, Number);

    effect(() => {
        loadRate({
            CurrencyCode: currencyCode.value,
            Day: day.value,
            MonthCode: monthCode.value,
            Year: year.value
        });
    });

    effect(() => {
        $("CurrencyRate").value = rate.value ?? "";
        $("ConvertedAmount").value = rate.value
            ? (localAmount / rate.value).toFixed(2)
            : "";
    });
})();
