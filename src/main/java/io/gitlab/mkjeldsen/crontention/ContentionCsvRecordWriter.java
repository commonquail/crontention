package io.gitlab.mkjeldsen.crontention;

import io.gitlab.mkjeldsen.crontention.csv.ShittyCsv.Record;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoField;
import java.util.StringJoiner;
import java.util.function.Consumer;

public final class ContentionCsvRecordWriter implements Consumer<Record> {

    private static final DateTimeFormatter DATA_KEY_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");

    private final FireTime fireTime;

    public ContentionCsvRecordWriter(final FireTime fireTime) {
        this.fireTime = fireTime;
    }

    @Override
    public void accept(final Record rec) {
        final var timeStamp = fireTime.when.atZone(ZoneOffset.UTC);
        final var detail = new StringJoiner("\n");
        for (final var expr : fireTime.expressions) {
            detail.add(expr);
        }

        rec.field(DATA_KEY_FORMATTER.format(timeStamp));
        rec.field(timeStamp.get(ChronoField.HOUR_OF_DAY));
        rec.field(timeStamp.get(ChronoField.MINUTE_OF_HOUR));
        rec.field(fireTime.count);
        rec.quoteField(detail.toString());
    }
}
