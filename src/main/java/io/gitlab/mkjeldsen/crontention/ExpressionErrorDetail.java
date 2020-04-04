package io.gitlab.mkjeldsen.crontention;

import org.quartz.CronExpression;

public final class ExpressionErrorDetail {
    public final String expr;
    public final String msg;

    private ExpressionErrorDetail(final String expr, final String msg) {
        this.expr = expr;
        this.msg = msg;
    }

    public ExpressionErrorDetail(final String expr, final Throwable e) {
        this(expr, e.getMessage());
    }

    public ExpressionErrorDetail(final CronExpression cron, final Throwable e) {
        this(cron.getCronExpression(), e);
    }

    @Override
    public String toString() {
        return "ExpressionErrorDetail{"
                + "expr='"
                + expr
                + '\''
                + ", msg='"
                + msg
                + '\''
                + '}';
    }
}
