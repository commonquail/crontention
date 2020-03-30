package io.gitlab.mkjeldsen.crontention;

import static org.assertj.core.api.Assertions.assertThat;

import java.text.ParseException;
import org.junit.jupiter.api.Test;

final class ExpressionErrorDetailTest {
    @Test
    void has_tostring() throws ParseException {
        final var someExpression = "* * * * * ? *";
        final var someErrorMessage = "Some error message";
        final var actual =
                new ExpressionErrorDetail(
                        ExpressionInput.parse(someExpression),
                        new Throwable(someErrorMessage));

        final var expected =
                "ExpressionErrorDetail{expr='"
                        + someExpression
                        + "', msg='"
                        + someErrorMessage
                        + "'}";
        assertThat(actual).hasToString(expected);
    }
}
