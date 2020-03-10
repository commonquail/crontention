package io.gitlab.mkjeldsen.crontention;

import static org.assertj.core.api.Assertions.assertThat;

import io.gitlab.mkjeldsen.crontention.csv.ShittyCsv;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.Test;

final class ContentionCsvRecordWriterTest {

    @Test
    void adf() {
        final var someInstant = Instant.parse("2020-03-19T19:01:00Z");
        final var fireTime = new FireTime(someInstant);
        fireTime.count = ThreadLocalRandom.current().nextInt();
        fireTime.expressions.add("a");
        fireTime.expressions.add("b");

        final var writer = new ContentionCsvRecordWriter(fireTime);

        final var csv = new ShittyCsv(42);
        csv.record(writer);

        final var actual = csv.toString();
        final var expected = "19:01,19,1," + fireTime.count + ",\"a\nb\"\n";

        assertThat(actual).isEqualTo(expected);
    }
}
