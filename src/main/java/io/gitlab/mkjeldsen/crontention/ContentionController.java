package io.gitlab.mkjeldsen.crontention;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import io.gitlab.mkjeldsen.crontention.csv.ShittyCsv;
import java.time.Duration;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import org.wildfly.common.annotation.Nullable;

@Path(ContentionController.ENDPOINT)
public final class ContentionController {

    static final String ENDPOINT = "/evaluate";

    static final String MEDIA_TYPE_CSV = "text/csv";

    static final String FORM_EXPRESSIONS = "expressions";

    static final String FORM_DATE = "date";

    /**
     * Caches the payload of a request. It would have been more elegant to cache
     * the individual cron expressions so they could be composed but because
     * {@link FireTime} is a running aggregate that becomes difficult. This
     * won't work when somebody iterates over configurations but it will help
     * when the same configuration is loaded often in a short period of time,
     * such as when sharing a linking.
     */
    private final LoadingCache<ContentionCacheKey, String> cache;

    public ContentionController() {
        cache =
                Caffeine.newBuilder()
                        .maximumSize(500)
                        // Heroku sleeps after 30m. Don't spend CPU expiring
                        // entries
                        // Heroku would expire for us.
                        .expireAfterWrite(Duration.ofHours(1))
                        .build(this::computeEntry);
    }

    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MEDIA_TYPE_CSV)
    public String calculate(
            @Nullable @FormParam(FORM_EXPRESSIONS) final String expressions,
            @Nullable @FormParam(FORM_DATE) final String date) {
        return cache.get(new ContentionCacheKey(expressions, date));
    }

    private String computeEntry(final ContentionCacheKey k) {
        final ContentionAggregator aggregator;
        try {
            aggregator = ContentionAggregator.forUtcDate(k.date);
        } catch (final DateFieldValueException e) {
            final var details = Map.of("value", k.date, "msg", e.getMessage());
            throw failWithInfo(Map.of(FORM_DATE, details));
        }

        final Collection<FireTime> fireTimes;
        if (k.expressions == null || k.expressions.isEmpty()) {
            fireTimes = Collections.emptyList();
        } else {
            aggregator.parseCronExpressions(k.expressions);
            fireTimes = aggregator.calculateFireTimes();
            if (!aggregator.errors.isEmpty()) {
                throw failWithInfo(Map.of(FORM_EXPRESSIONS, aggregator.errors));
            }
        }

        return toCsv(fireTimes);
    }

    private static String toCsv(final Collection<FireTime> fireTimes) {
        // Header + record count.
        final int approxLineCount = 1 + fireTimes.size();
        // Manually counted.
        final int minRecordByteCount = 28;
        // Complex expressions consume more bytes but tend to produce fewer
        // records. Doubling tends to overshoot by 0.5x to 1x.
        final int approxRecordByteCount = minRecordByteCount * 2;
        final int estCapacity = approxRecordByteCount * approxLineCount;

        final var csv = new ShittyCsv(estCapacity);
        csv.header("key", "h", "m", "count", "expressions");
        for (final var fireTime : fireTimes) {
            csv.record(new ContentionCsvRecordWriter(fireTime));
        }
        return csv.toString();
    }

    private static WebApplicationException failWithInfo(
            final Map<String, Object> entity) {
        // Use JSON here. It parses faster in browsers and this payload is very
        // small.
        final var response =
                Response.status(Status.BAD_REQUEST)
                        .type(MediaType.APPLICATION_JSON_TYPE)
                        .entity(entity)
                        .build();
        return new WebApplicationException(response);
    }
}
