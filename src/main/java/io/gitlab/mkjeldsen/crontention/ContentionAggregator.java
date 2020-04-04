package io.gitlab.mkjeldsen.crontention;

import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import org.quartz.CronExpression;
import org.wildfly.common.annotation.Nullable;

public final class ContentionAggregator {

    public final List<ExpressionErrorDetail> errors;

    private final List<CronExpression> crons;

    private final Instant periodStart;

    private final Instant periodEnd;

    private ContentionAggregator(
            final Instant periodStart, final Instant periodEnd) {
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.errors = new ArrayList<>();
        this.crons = new ArrayList<>();
    }

    public static ContentionAggregator forUtcDate(@Nullable final String date)
            throws DateFieldValueException {
        // Start-of-day until tomorrow. ZonedDate is semantically more
        // appropriate but doesn't have easy j.u.Date conversion, which we need.
        final Instant periodStart;

        final String strippedDate;
        if (date == null
                || (strippedDate = date.strip()).isEmpty()
                || "today".equalsIgnoreCase(strippedDate)) {
            periodStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        } else {
            try {
                final var requestedDate = LocalDate.parse(strippedDate);
                ensureQuartzCompatibleDate(requestedDate);
                periodStart =
                        requestedDate.atStartOfDay(ZoneOffset.UTC).toInstant();
            } catch (final DateTimeParseException e) {
                throw new DateFieldValueException(e);
            }
        }
        final var periodEnd = periodStart.plus(1, ChronoUnit.DAYS);

        return new ContentionAggregator(periodStart, periodEnd);
    }

    private static void ensureQuartzCompatibleDate(final LocalDate date)
            throws DateFieldValueException {
        final int requestedYear = date.getYear();
        if (requestedYear < 1970) {
            throw DateFieldValueException.tooEarly(requestedYear);
        }
        final int thisYear = LocalDate.now(ZoneOffset.UTC).getYear();
        final int yearDiff = requestedYear - thisYear;
        if (yearDiff > 100) {
            throw DateFieldValueException.tooLate(yearDiff);
        }
    }

    public void parseCronExpressions(final String expressions) {
        final var utc = TimeZone.getTimeZone(ZoneOffset.UTC);
        // List, not Set. Duplicate expressions are expected; the whole point is
        // that
        // 1) any two expressions can contend for the same slot, and
        // 2) expressions are defined independently and without context.
        final var crons = new ArrayList<CronExpression>();
        for (final var expr : expressions.split("\n")) {
            try {
                final var cron = new CronExpression(expr);
                cron.setTimeZone(utc);
                crons.add(cron);
            } catch (final ParseException e) {
                this.errors.add(new ExpressionErrorDetail(expr, e));
            }
        }
        this.crons.addAll(crons);
    }

    public Collection<FireTime> calculateFireTimes() {
        final var fireTimes = new HashMap<Instant, FireTime>();
        for (final var cron : this.crons) {
            try {
                calculateFireTimesFor(cron, fireTimes);
            } catch (final RuntimeException e) {
                this.errors.add(new ExpressionErrorDetail(cron, e));
            }
        }
        return fireTimes.values();
    }

    private void calculateFireTimesFor(
            final CronExpression cron, final Map<Instant, FireTime> fireTimes) {

        final var cronExpression = cron.getCronExpression();

        // Quartz has to calculate every fire-time. In case the first fire-time
        // should be periodStartIncl, Quartz would advance straight past it, so
        // turn back time a little bit so Quartz will calculate it.
        var nextFireTime = periodStart.minusSeconds(1);
        while (nextFireTime.isBefore(periodEnd)) {
            final var after =
                    cron.getNextValidTimeAfter(Date.from(nextFireTime));
            if (after == null) {
                // Quartz REALLY doesn't like working with years.
                break;
            }
            nextFireTime = after.toInstant();
            if (nextFireTime.isBefore(periodEnd)) {
                final Instant key =
                        nextFireTime.truncatedTo(ChronoUnit.MINUTES);
                final var fireTime =
                        fireTimes.computeIfAbsent(key, FireTime::new);
                fireTime.count += 1;
                fireTime.expressions.add(cronExpression);
            }
        }
    }
}
