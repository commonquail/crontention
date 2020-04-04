package io.gitlab.mkjeldsen.crontention;

import java.text.ParseException;
import java.time.ZoneOffset;
import java.util.TimeZone;
import org.quartz.CronExpression;
import org.wildfly.common.annotation.Nullable;

public final class ExpressionInput {

    private static final TimeZone UTC = TimeZone.getTimeZone(ZoneOffset.UTC);
    private static final int IDX_DOW_END = 11;
    private static final int IDX_YEAR_START = 12;
    private static final int IDX_YEAR_END = 13;
    private static final int IDX_CMD_START = 14;
    private static final int IDX_CMD_END = 15;

    /** The raw input this instance was constructed from. */
    public final String input;

    /**
     * The part of {@link #input} parsed as the Quartz cron expression and used
     * to construct {@link #cron} with.
     */
    public final String expression;

    /**
     * The part of {@link #input} parsed as the command associated with the cron
     * expression, not recognized by {@link CronExpression} and not included in
     * {@link #cron}.
     */
    @Nullable
    public final String command;

    /**
     * The Quartz {@code CronExpression} constructed from {@link #expression}.
     */
    public final CronExpression cron;

    private ExpressionInput(
            final String input,
            final String command,
            final String expression,
            final CronExpression cron) {
        this.input = input;
        this.command = command;
        this.expression = expression;
        this.cron = cron;
    }

    public static ExpressionInput parse(final String input)
            throws ParseException {
        // A 2-step list of [start; end) indices to each possible part in input.
        // Inspecting it in reverse shows which optional end parts are missing.
        // Note that the year part can contain a command!
        final int[] boundaries = new int[IDX_CMD_END + 1];
        int boundaryIdx = 0;

        // Whether we're currently parsing a part or a part separator.
        boolean inExpressionPart = false;

        final char[] chars = input.toCharArray();
        for (int i = 0;
                i < chars.length && boundaryIdx < boundaries.length;
                ++i) {
            final char c = chars[i];

            // In Quartz, parts are separated by one or more spaces or tabs.
            // Standard-form tolerates only a single space.
            if (c == ' ' || c == '\t') {
                // If we think we're in a part it means it just ended. Flip
                // state and record an end boundary.
                if (inExpressionPart) {
                    inExpressionPart = false;
                    boundaries[boundaryIdx++] = i;
                }
            } else { // Not a separator character.
                if (inExpressionPart) {
                    continue;
                }
                // If we don't think we're already in a part it means a part
                // just began. Flip state and record a start boundary.
                inExpressionPart = true;
                boundaries[boundaryIdx++] = i;
            }
        }

        final String expression;
        final String command;
        if (boundaries[IDX_YEAR_START] == 0) {
            // Neither year nor command parts.
            expression = input;
            command = null;
        } else if (boundaries[IDX_CMD_START] == 0) {
            // Missing either year part or command part. Which is it?
            final var yearOrCmd = input.substring(boundaries[IDX_YEAR_START]);
            assert !yearOrCmd.isEmpty() : "empty [year-start; year-end)";

            if (looksLikeYearPart(yearOrCmd)) {
                expression = input;
                command = null;
            } else {
                expression = input.substring(0, boundaries[IDX_DOW_END]);
                command = yearOrCmd;
            }
        } else {
            // Both year and command parts; but the year part could be the first
            // piece of a composite command.
            final var yearOrCmd =
                    input.substring(
                            boundaries[IDX_YEAR_START],
                            boundaries[IDX_YEAR_END]);
            assert !yearOrCmd.isEmpty() : "empty [year-start; year-end)";

            if (looksLikeYearPart(yearOrCmd)) {
                expression = input.substring(0, boundaries[IDX_YEAR_END]);
                command = input.substring(boundaries[IDX_CMD_START]);
            } else {
                expression = input.substring(0, boundaries[IDX_DOW_END]);
                command = input.substring(boundaries[IDX_YEAR_START]);
            }
        }

        return new ExpressionInput(
                input, command, expression, toCron(expression));
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        final var other = (ExpressionInput) o;
        return input.equals(other.input);
    }

    @Override
    public int hashCode() {
        return input.hashCode();
    }

    private static boolean looksLikeYearPart(final String yearOrCmd) {
        for (final char c : yearOrCmd.toCharArray()) {
            switch (c) {
                case '*':
                case ',':
                case '-':
                case '/':
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    break;
                default:
                    return false;
            }
        }
        return true;
    }

    private static CronExpression toCron(final String expr)
            throws ParseException {
        final var cron = new CronExpression(expr);
        cron.setTimeZone(UTC);
        return cron;
    }
}
