package io.gitlab.mkjeldsen.crontention;

public final class DateFieldValueException extends Exception {
    public DateFieldValueException(final Throwable cause) {
        super("Expected \"today\" or ISO 8601 date: YYYY-MM-DD.", cause);
    }

    public DateFieldValueException(final String message) {
        super(message);
    }

    public static DateFieldValueException tooLate(final int yearDiff) {
        return new DateFieldValueException(
                "Must not be later than 100 years of this year, was "
                        + yearDiff
                        + '.');
    }

    public static DateFieldValueException tooEarly(final int earlyYear) {
        return new DateFieldValueException(
                "Must be 1970 or later, was " + earlyYear + '.');
    }
}
