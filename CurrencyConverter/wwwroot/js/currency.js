(function () {
    const monthCodes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const toDateInputValue = (date) => {
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${date.getFullYear()}-${month}-${day}`;
    };

    const parseDate = (dateValue) => {
        const [year, month, day] = dateValue.split("-").map(Number);
        return { year, monthCode: monthCodes[month - 1], day };
    };

    const currencyCode = signal("DOLAR ESTADOUNIDENSE");
    const rateDate = signal(toDateInputValue(new Date()));
    const rate = signal(null);
    const loading = signal(false);

    let pendingRequest = null;

    const bindInput = (id, target, read = (input) => input.value) => {
        const input = $(id);
        input.value = target.value;
        input.addEventListener("change", () => {
            target.value = read(input);
        });
    };

    const loadRate = async (request) => {
        // Discard the previous request so an old response can't overwrite a newer one
        pendingRequest?.abort();
        pendingRequest = new AbortController();

        rate.value = null;
        loading.value = true;

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
            if (data.success) {
                rate.value = data.currencyRate;
            } else {
                warning(data.errorMessage);
            }
            loading.value = false;
        } catch (err) {
            if (err.name === "AbortError") {
                return;
            }
            loading.value = false;
            danger("No se pudo obtener la tasa de cambio.");
        }
    };

    const getCurrencyLabel = () => {
        const option = $("CurrencyCode").selectedOptions[0];
        return option.dataset.code ?? option.text;
    };

    const getEmptyMessage = () => {
        if (!rateDate.value) {
            return "Elige una fecha entre 2004 y hoy.";
        }
        return loading.value ? "Consultando la tasa..." : "—";
    };

    bindInput("CurrencyCode", currencyCode);
    // Out of range dates count as empty, so typing a year doesn't query or notify halfway through
    bindInput("RateDate", rateDate, (input) => input.validity.valid ? input.value : "");

    // Without a submit button, pressing Enter on the date would still reload the page
    $("RateForm").addEventListener("submit", (event) => event.preventDefault());

    effect(() => {
        const code = currencyCode.value;
        const dateValue = rateDate.value;

        if (!dateValue) {
            pendingRequest?.abort();
            rate.value = null;
            loading.value = false;
            return;
        }

        const { year, monthCode, day } = parseDate(dateValue);
        loadRate({ CurrencyCode: code, Day: day, MonthCode: monthCode, Year: year });
    });

    effect(() => {
        $("CurrencySelect").classList.toggle("is-loading", loading.value);

        if (!rate.value) {
            $("ForeignRate").textContent = getEmptyMessage();
            $("LocalRate").textContent = "";
            $("RateInfo").textContent = "";
            return;
        }

        const label = getCurrencyLabel();
        const { year, monthCode, day } = parseDate(rateDate.value);

        $("ForeignRate").textContent = `1 ${label} = ${rate.value} DOP`;
        $("LocalRate").textContent = `1 DOP = ${(1 / rate.value).toFixed(4)} ${label}`;
        $("RateInfo").textContent = `Tasa del ${day} ${monthCode.toLowerCase()} ${year}`;
    });
})();
