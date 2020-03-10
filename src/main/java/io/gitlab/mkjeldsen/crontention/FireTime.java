package io.gitlab.mkjeldsen.crontention;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

public final class FireTime {

    public final Instant when;

    public final Set<String> expressions;

    public long count;

    public FireTime(final Instant when) {
        this.when = when;
        this.expressions = new HashSet<>();
    }
}
