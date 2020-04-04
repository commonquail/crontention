package io.gitlab.mkjeldsen.crontention;

import static io.gitlab.mkjeldsen.crontention.ContentionAggregator.forUtcDate;
import static io.gitlab.mkjeldsen.crontention.FireTimeAssert.assertThat;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;

import java.time.LocalDate;
import java.util.Collection;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.wildfly.common.annotation.Nullable;

final class ContentionAggregatorTest {

    private static final String CRON_AT_LEAST_ONCE = "0 * * * * ? *";

    private static final String CRON_MAXIMAL = "* * * * * ? *";

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {""})
    void accepts_empty_input_as_implicit_today(@Nullable final String date)
            throws DateFieldValueException {
        final var fireTimes = fireTimesForDateExpr(date, CRON_AT_LEAST_ONCE);
        assertThat(fireTimes)
                .isNotEmpty()
                .allSatisfy(fireTime -> assertThat(fireTime).firesToday());
    }

    @ParameterizedTest
    @ValueSource(strings = {"today", "  today  ", "ToDaY"})
    void accepts_explicit_today(final String date)
            throws DateFieldValueException {
        final var fireTimes = fireTimesForDateExpr(date, CRON_AT_LEAST_ONCE);
        assertThat(fireTimes)
                .isNotEmpty()
                .allSatisfy(fireTime -> assertThat(fireTime).firesToday());
    }

    @Test
    void counts_contention() throws DateFieldValueException {
        final var someDate = "2030-07-13";
        final var twiceContendedExpressions =
                CRON_AT_LEAST_ONCE + '\n' + CRON_AT_LEAST_ONCE;
        final var fireTimes =
                fireTimesForDateExpr(someDate, twiceContendedExpressions);
        assertThat(fireTimes)
                .isNotEmpty()
                .allSatisfy(fireTime -> assertThat(fireTime).hasCount(2));
    }

    @Test
    void accepts_padded_date() throws DateFieldValueException {
        final var somePaddedDate = "  2020-04-04  ";
        final var unpaddedDate = somePaddedDate.strip();

        final var fireTimes =
                fireTimesForDateExpr(somePaddedDate, CRON_MAXIMAL);

        assertThat(fireTimes)
                .first(FireTimeAssert.instanceOfFactory())
                .firesOn(unpaddedDate);
    }

    @Test
    void rejects_date_before_1970() {
        final var earlyDate = "1969-01-01";
        assertThatThrownBy(() -> forUtcDate(earlyDate))
                .isInstanceOf(DateFieldValueException.class)
                .hasMessage(
                        "Must be 1970 or later, was %s.",
                        earlyDate.substring(0, 4));
    }

    @Test
    void rejects_invalid_date() {
        final var earlyDate = "foo-01-01";
        assertThatThrownBy(() -> forUtcDate(earlyDate))
                .isInstanceOf(DateFieldValueException.class)
                .hasMessageContainingAll("today", "ISO 8601 date");
    }

    @ParameterizedTest
    @MethodSource("cases_dates_in_supported_range")
    void accepts_dates_in_range(final String date)
            throws DateFieldValueException {
        final var fireTimes = fireTimesForDateExpr(date, CRON_MAXIMAL);
        assertThat(fireTimes)
                .isNotEmpty()
                .allSatisfy(fireTime -> assertThat(fireTime).firesOn(date));
    }

    @Test
    void rejects_dates_more_than_100_years_later_than_today() {
        final var lateDate = LocalDate.now().plusYears(101).toString();
        assertThatThrownBy(() -> forUtcDate(lateDate))
                .isInstanceOf(DateFieldValueException.class)
                .hasMessageContainingAll("later than 100 years", "was 101");
    }

    @Test
    void accepts_dates_in_range() throws DateFieldValueException {
        final var someDate = "2000-01-01";

        final var someInvalidExpression = "* * * * * * *"; // Missing '?'
        final var expectedErrorMessage =
                "Support for specifying both a day-of-week AND a day-of-month parameter is not implemented.";

        final var aggregator = forUtcDate(someDate);
        aggregator.parseCronExpressions(someInvalidExpression);
        final var fireTimes = aggregator.calculateFireTimes();

        assertThat(aggregator.errors)
                .extracting(detail -> tuple(detail.expr, detail.msg))
                .contains(tuple(someInvalidExpression, expectedErrorMessage));

        assertThat(fireTimes).isEmpty();
    }

    private static Stream<Arguments> cases_dates_in_supported_range() {
        final var earliest = LocalDate.of(1970, 1, 1);
        final var today = LocalDate.now();
        final var latest =
                today.plusYears(100).withMonth(12).withDayOfMonth(31);
        return Stream.of(
                Arguments.of(earliest.toString()),
                Arguments.of(today.toString()),
                Arguments.of(latest.toString()));
    }

    private static Collection<FireTime> fireTimesForDateExpr(
            final String date, final String expressions)
            throws DateFieldValueException {
        final ContentionAggregator aggregator;
        aggregator = forUtcDate(date);
        aggregator.parseCronExpressions(expressions);
        Collection<FireTime> fireTimes = aggregator.calculateFireTimes();
        assertThat(aggregator.errors).isEmpty();
        return fireTimes;
    }
}
