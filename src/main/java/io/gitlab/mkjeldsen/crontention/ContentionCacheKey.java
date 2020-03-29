package io.gitlab.mkjeldsen.crontention;

import java.util.Objects;
import org.wildfly.common.annotation.Nullable;

public final class ContentionCacheKey {

    @Nullable
    final String expressions;

    @Nullable
    final String date;

    public ContentionCacheKey(
            @Nullable final String expressions, @Nullable final String date) {
        this.expressions = expressions;
        this.date = date;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        final ContentionCacheKey entry = (ContentionCacheKey) o;
        return Objects.equals(expressions, entry.expressions)
                && Objects.equals(date, entry.date);
    }

    @Override
    public int hashCode() {
        return Objects.hash(expressions, date);
    }
}
