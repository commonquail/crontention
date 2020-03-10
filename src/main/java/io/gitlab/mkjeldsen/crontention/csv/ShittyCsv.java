package io.gitlab.mkjeldsen.crontention.csv;

import java.util.function.Consumer;

/* Manually constructed CSV? Living dangerously! */
public final class ShittyCsv {

    private final StringBuilder buffer;

    public ShittyCsv(final int initialCapacity) {
        this.buffer = new StringBuilder(initialCapacity);
    }

    public void header(final String... names) {
        record(
                rec -> {
                    for (final var name : names) {
                        // No funky names, no need to quote.
                        rec.field(name);
                    }
                });
    }

    public void record(final Consumer<Record> record) {
        record.accept(new Record(this));
        final int last = buffer.length() - 1;
        assert buffer.charAt(last) == ',';
        buffer.setCharAt(last, '\n');
    }

    @Override
    public String toString() {
        return buffer.toString();
    }

    public static final class Record {

        private final ShittyCsv csv;

        /** D3 uses " for escaping. */
        private static final char ESCAPE_CHAR = '"';

        private static final char QUOTE_CHAR = '"';

        Record(final ShittyCsv csv) {
            this.csv = csv;
        }

        public void field(final String safeString) {
            csv.buffer.append(safeString).append(',');
        }

        public void field(final int i) {
            csv.buffer.append(i).append(',');
        }

        public void field(final long l) {
            csv.buffer.append(l).append(',');
        }

        public void quoteField(final String unsafeString) {
            if (!unsafeString.isEmpty()) {
                csv.buffer.append(QUOTE_CHAR);
                for (final char c : unsafeString.toCharArray()) {
                    final var needsEscape = c == QUOTE_CHAR;
                    if (needsEscape) {
                        csv.buffer.append(ESCAPE_CHAR);
                    }
                    csv.buffer.append(c);
                }
                csv.buffer.append(QUOTE_CHAR);
            }
            csv.buffer.append(',');
        }
    }
}
