package io.gitlab.mkjeldsen.crontention;

import static org.assertj.core.api.Assertions.assertThat;

import java.text.ParseException;
import java.time.ZoneOffset;
import java.util.TimeZone;
import java.util.stream.Stream;
import nl.jqno.equalsverifier.EqualsVerifier;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.wildfly.common.annotation.Nullable;

final class ExpressionInputTest {

    private static final TimeZone UTC = TimeZone.getTimeZone(ZoneOffset.UTC);

    @Test
    void equals_contract() {
        EqualsVerifier.forClass(ExpressionInput.class)
                .withOnlyTheseFields("input")
                .withNonnullFields("input")
                .verify();
    }

    @ParameterizedTest(
            name = "{index}: input={0} => expression={1}, command={2}")
    @MethodSource({"cases_valid_syntax"})
    void parses_input(
            final String input,
            final String expression,
            @Nullable final String command)
            throws ParseException {
        final var actual = ExpressionInput.parse(input);
        assertThat(actual.input).as("assigns raw input").isEqualTo(input);
        assertThat(actual.expression)
                .as("extracts and assigns expression")
                .isEqualTo(expression);
        assertThat(actual.command)
                .as("extracts and assigns command")
                .isEqualTo(command);
        assertThat(actual.cron).as("assigns CronExpression").isNotNull();
        assertThat(actual.cron.getCronExpression())
                .as("instantiates CronExpression from expression")
                .isEqualTo(actual.expression);
        assertThat(actual.cron.getTimeZone())
                .as("has UTC time zone")
                .isEqualTo(UTC);
    }

    private static Stream<Arguments> cases_valid_syntax() {
        return Stream.of(
                cmd("* * * ? * *", "alice"),
                cmd("* * * ? * * *", "bob"),
                cmd("* * * ? * * 2016", "charlie"),
                cmd("* * * ? * *", "no year but command with spaces"),
                cmd("*\t*\t*\t?\t*\t*", "pointless whitespace complexity"),
                cmd("0 0/5 14,18 * * ?", "19:29"),
                cmd("0 15 10 ? * 6L 2010-2011,2012/3", "2005 a-b, c"),
                cmd("0 15 10 ? * 6L 37", "2020"),
                plain("* * * ? * *"),
                plain("* * * ? * * *"),
                plain("* * * ? * * 2015"),
                plain("* * * ? * * 9999"),
                plain("0 1 9 ? * 6L 2010/3"),
                plain("0 2 17 ? * 6L 22222222"),
                plain("0 2,4 1 * * ? 2020/2,20211"),
                plain("0 15 10 ? * 6L 2010-2011,2012/3"));
    }

    private static Arguments cmd(final String expression, final String cmd) {
        return Arguments.of(expression + ' ' + cmd, expression, cmd);
    }

    private static Arguments plain(final String expression) {
        return Arguments.of(expression, expression, null);
    }
}
