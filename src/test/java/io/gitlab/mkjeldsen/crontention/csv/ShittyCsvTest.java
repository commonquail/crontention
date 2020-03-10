package io.gitlab.mkjeldsen.crontention.csv;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

final class ShittyCsvTest {

    private final ThreadLocalRandom rng = ThreadLocalRandom.current();

    @Test
    void writes_header() {
        final var csv = writer();
        csv.header("a", "b", "c");
        final var actual = csv.toString();
        assertThat(actual).isEqualTo("a,b,c\n");
    }

    @Test
    void writes_multiple_fields_and_records() {
        final var csv = writer();
        final int someInt1 = rng.nextInt();
        final int someInt2 = rng.nextInt();
        final int someInt3 = rng.nextInt();
        final int someInt4 = rng.nextInt();
        csv.record(
                record -> {
                    record.field(someInt1);
                    record.field(someInt2);
                });
        csv.record(
                record -> {
                    record.field(someInt3);
                    record.field(someInt4);
                });
        final var expected =
                "" + someInt1 + ',' + someInt2 + '\n' + someInt3 + ','
                        + someInt4 + '\n';
        final var actual = csv.toString();
        assertThat(actual).isEqualTo(expected);
    }

    @Test
    void writes_int() {
        final var csv = writer();
        final int someInt = rng.nextInt();
        csv.record(record -> record.field(someInt));
        final var actual = csv.toString();
        assertThat(actual).isEqualTo(someInt + "\n");
    }

    @Test
    void writes_long() {
        final var csv = writer();
        final long someLong = rng.nextLong();
        csv.record(record -> record.field(someLong));
        final var actual = csv.toString();
        assertThat(actual).isEqualTo(someLong + "\n");
    }

    @Test
    void writes_safe_string() {
        final var csv = writer();
        final var someSafeString = "" + rng.nextBoolean();
        csv.record(record -> record.field(someSafeString));
        final var actual = csv.toString();
        assertThat(actual).isEqualTo(someSafeString + "\n");
    }

    @ParameterizedTest
    @MethodSource("cases_unsafe_string")
    void writes_unsafe_string(
            final String unsafeString, final String expected) {
        final var csv = writer();
        csv.record(record -> record.quoteField(unsafeString));
        final var actual = csv.toString();
        assertThat(actual).isEqualTo(expected);
    }

    private static Stream<Arguments> cases_unsafe_string() {
        return Stream.of(
                Arguments.of("", "\n"),
                Arguments.of("\"", "\"\"\"\"\n"),
                Arguments.of("foo\"bar", "\"foo\"\"bar\"\n"),
                Arguments.of("foo\"\"bar", "\"foo\"\"\"\"bar\"\n"),
                Arguments.of("foo\nbar", "\"foo\nbar\"\n"));
    }

    private ShittyCsv writer() {
        return new ShittyCsv(rng.nextInt(0, 1000));
    }
}
