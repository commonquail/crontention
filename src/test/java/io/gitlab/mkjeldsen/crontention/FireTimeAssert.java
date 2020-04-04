package io.gitlab.mkjeldsen.crontention;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.assertj.core.api.AbstractAssert;
import org.assertj.core.api.Assertions;
import org.assertj.core.api.InstanceOfAssertFactory;

public final class FireTimeAssert
        extends AbstractAssert<FireTimeAssert, FireTime> {

    public FireTimeAssert(final FireTime actual) {
        super(actual, FireTimeAssert.class);
    }

    public static FireTimeAssert assertThat(final FireTime actual) {
        return new FireTimeAssert(actual);
    }

    public static InstanceOfAssertFactory<FireTime, FireTimeAssert>
            instanceOfFactory() {
        return new InstanceOfAssertFactory<>(
                FireTime.class, FireTimeAssert::assertThat);
    }

    public FireTimeAssert hasCount(long expected) {
        isNotNull();
        Assertions.assertThat(actual.count).isEqualTo(expected);
        return this;
    }

    public FireTimeAssert firesToday() {
        isNotNull();
        Assertions.assertThat(actualDate()).isToday();
        return this;
    }

    public FireTimeAssert firesOn(final String localDateAsString) {
        isNotNull();
        Assertions.assertThat(actualDate()).isEqualTo(localDateAsString);
        return this;
    }

    private LocalDate actualDate() {
        final var localDateTime =
                LocalDateTime.ofInstant(actual.when, ZoneOffset.UTC);
        return localDateTime.toLocalDate();
    }
}
