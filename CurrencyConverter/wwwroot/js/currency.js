(function () {
    const monthCodes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const moneyFormat = new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const smallMoneyFormat = new Intl.NumberFormat("es-DO", { minimumSignificantDigits: 3, maximumSignificantDigits: 3 });
    const localAmountFormat = new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    const rateFormat = new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 6 });

    // Two decimals would round 1 DOP to 0.02 USD, so amounts below 1 keep their significant digits
    const formatConverted = (value) => value > 0 && value < 1
        ? smallMoneyFormat.format(value)
        : moneyFormat.format(value);

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
    const localAmount = signal(1);
    const rate = signal(null);
    const loading = signal(false);

    let pendingRequest = null;

    const bindInput = (id, target, read = (input) => input.value, eventName = "change") => {
        const input = $(id);
        input.value = target.value;
        input.addEventListener(eventName, () => {
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
    // Only recalculates on the client, so it can follow every keystroke
    bindInput("LocalAmount", localAmount, (input) => input.value && input.validity.valid ? Number(input.value) : null, "input");

    // Results update on their own, so pressing Enter must not reload the page
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
            $("ConvertedAmount").textContent = getEmptyMessage();
            $("ForeignRate").textContent = "";
            $("RateInfo").textContent = "";
            return;
        }

        const label = getCurrencyLabel();
        const amount = localAmount.value;
        const { year, monthCode, day } = parseDate(rateDate.value);

        $("ConvertedAmount").textContent = amount === null
            ? "Ingresa un monto válido."
            : `${localAmountFormat.format(amount)} DOP = ${formatConverted(amount / rate.value)} ${label}`;
        $("ForeignRate").textContent = `1 ${label} = ${rateFormat.format(rate.value)} DOP`;
        $("RateInfo").textContent = `Tasa del ${day} ${monthCode.toLowerCase()} ${year}`;
    });
})();
