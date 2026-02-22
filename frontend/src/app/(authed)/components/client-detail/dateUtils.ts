export function formatRelativeDate(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absDeltaSeconds = Math.abs(deltaSeconds);

    let value = deltaSeconds;
    let unit: Intl.RelativeTimeFormatUnit = "second";

    if (absDeltaSeconds >= 31536000) {
        value = Math.round(deltaSeconds / 31536000);
        unit = "year";
    } else if (absDeltaSeconds >= 2592000) {
        value = Math.round(deltaSeconds / 2592000);
        unit = "month";
    } else if (absDeltaSeconds >= 604800) {
        value = Math.round(deltaSeconds / 604800);
        unit = "week";
    } else if (absDeltaSeconds >= 86400) {
        value = Math.round(deltaSeconds / 86400);
        unit = "day";
    } else if (absDeltaSeconds >= 3600) {
        value = Math.round(deltaSeconds / 3600);
        unit = "hour";
    } else if (absDeltaSeconds >= 60) {
        value = Math.round(deltaSeconds / 60);
        unit = "minute";
    }

    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit);
}

export function formatExactDate(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString();
}
