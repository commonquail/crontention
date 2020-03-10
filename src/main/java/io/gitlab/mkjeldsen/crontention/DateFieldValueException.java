package io.gitlab.mkjeldsen.crontention;

public final class DateFieldValueException extends Exception {
    public DateFieldValueException(final Throwable cause) {
        super("Expected \"today\" or ISO 8601 date: YYYY-MM-DD.", cause);
    }

    public DateFieldValueException(final int yearDiff) {
        super("Must be within 100 years of this year, was " + yearDiff + '.');
    }
}
