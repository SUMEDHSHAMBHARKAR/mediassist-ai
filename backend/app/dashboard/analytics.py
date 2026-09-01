from datetime import date, timedelta
from dateutil.relativedelta import relativedelta


# =====================================================
# Date Range Utilities
# =====================================================

def get_date_range(period: str) -> tuple[date, date]:
    today = date.today()

    if period == "daily":
        start = today - timedelta(days=30)
        end = today
    elif period == "weekly":
        start = today - timedelta(weeks=12)
        end = today
    elif period == "monthly":
        start = today - relativedelta(months=12)
        end = today
    elif period == "yearly":
        start = today - relativedelta(years=5)
        end = today
    else:
        start = today - timedelta(days=30)
        end = today

    return start, end


def get_current_month_range() -> tuple[date, date]:
    today = date.today()
    start = today.replace(day=1)
    return start, today


def get_previous_month_range() -> tuple[date, date]:
    today = date.today()
    first_of_current = today.replace(day=1)
    last_of_previous = first_of_current - timedelta(days=1)
    first_of_previous = last_of_previous.replace(day=1)
    return first_of_previous, last_of_previous


# =====================================================
# Calculation Utilities
# =====================================================

def calculate_percentage(part: int | float, total: int | float) -> float:
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)


def calculate_growth(current: int | float, previous: int | float) -> float | None:
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 2)


def calculate_average(total: int | float, count: int) -> float:
    if count == 0:
        return 0.0
    return round(total / count, 2)


# =====================================================
# Grouping Utilities
# =====================================================

def generate_date_labels(start: date, end: date, period: str) -> list[str]:
    labels = []
    current = start

    if period == "daily":
        while current <= end:
            labels.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)

    elif period == "weekly":
        while current <= end:
            labels.append(current.strftime("%Y-W%W"))
            current += timedelta(weeks=1)

    elif period == "monthly":
        while current <= end:
            labels.append(current.strftime("%Y-%m"))
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)

    elif period == "yearly":
        while current <= end:
            labels.append(current.strftime("%Y"))
            current = current.replace(year=current.year + 1)

    return labels


def get_age_group(birth_date: date) -> str:
    today = date.today()
    age = today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )

    if age < 18:
        return "0-17"
    elif age < 30:
        return "18-29"
    elif age < 45:
        return "30-44"
    elif age < 60:
        return "45-59"
    else:
        return "60+"


AGE_GROUP_ORDER = ["0-17", "18-29", "30-44", "45-59", "60+"]
