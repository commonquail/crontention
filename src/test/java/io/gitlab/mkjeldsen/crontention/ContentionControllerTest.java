package io.gitlab.mkjeldsen.crontention;

import static io.restassured.RestAssured.given;
import static java.util.Collections.singletonMap;
import static org.hamcrest.CoreMatchers.allOf;
import static org.hamcrest.CoreMatchers.containsString;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.startsWith;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.is;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.wildfly.common.annotation.Nullable;

@QuarkusTest
class ContentionControllerTest {

    private static final String CSV_HEADER = "key,h,m,count,expressions\n";

    @Test
    void evaluates_single_expression() {
        final var someSimpleExpr = "0 1 2 * * ? *";

        final var expectSimpleRecord =
                "02:01,2,1,1,\"" + someSimpleExpr + '"' + '\n';

        final var formParams =
                Map.of(ContentionController.FORM_EXPRESSIONS, someSimpleExpr);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .contentType(ContentionController.MEDIA_TYPE_CSV)
                .header(HttpHeaders.CONTENT_ENCODING, "gzip")
                .body(startsWith(CSV_HEADER))
                .body(containsString(expectSimpleRecord));
    }

    @Test
    void evaluates_multiple_expressions() {
        final var someSimpleExpr = "0 1 2 * * ? *";
        final var someOtherSimpleExpr = "1 2 3 * * ? *";

        final var expectSimpleRecord =
                "02:01,2,1,1,\"" + someSimpleExpr + '"' + '\n';
        final var expectOtherSimpleRecord =
                "03:02,3,2,1,\"" + someOtherSimpleExpr + '"' + '\n';

        final var formParams =
                Map.of(
                        ContentionController.FORM_EXPRESSIONS,
                        someSimpleExpr + '\n' + someOtherSimpleExpr);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .contentType(ContentionController.MEDIA_TYPE_CSV)
                .body(startsWith(CSV_HEADER))
                // Unspecified record order.
                .body(containsString(expectSimpleRecord))
                .body(containsString(expectOtherSimpleRecord));
    }

    @Test
    void evaluates_duplicate_expressions() {
        counts_contended_slots();
    }

    @Test
    void evaluates_dated_expression() {
        final var date = "2010-01-01";
        final var someMatchedExpr = "2 8 20 1 * ? 2010";
        final var someUnMatchedExpr = "2 8 20 2 * ? 2010";
        final var expressions = someMatchedExpr + '\n' + someUnMatchedExpr;

        final var expectMatchedRecord =
                "20:08,20,8,1,\"" + someMatchedExpr + '"' + '\n';

        final var formParams =
                Map.of(
                        ContentionController.FORM_EXPRESSIONS,
                        expressions,
                        ContentionController.FORM_DATE,
                        date);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body(containsString(expectMatchedRecord))
                .body(not(containsString(someUnMatchedExpr)));
    }

    @Test
    void evaluates_explicit_today_expression() {
        final var date = "tODAy";
        final var someMatchedExpr = "2 8 20 * * ?";

        final var expectMatchedRecord =
                "20:08,20,8,1,\"" + someMatchedExpr + '"' + '\n';

        final var formParams =
                Map.of(
                        ContentionController.FORM_EXPRESSIONS,
                        someMatchedExpr,
                        ContentionController.FORM_DATE,
                        date);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body(containsString(expectMatchedRecord));
    }

    @ParameterizedTest
    @MethodSource("cases_empty_safe_noop")
    void evaluates_empty_input_as_safe_noop(
            @Nullable final String expressions, @Nullable final String date) {
        final var formParams = new HashMap<String, String>();
        formParams.put(ContentionController.FORM_EXPRESSIONS, expressions);
        formParams.put(ContentionController.FORM_DATE, date);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .contentType(ContentionController.MEDIA_TYPE_CSV)
                .body(is(CSV_HEADER));
    }

    private static List<Arguments> cases_empty_safe_noop() {
        return List.of(
                Arguments.of("", ""),
                Arguments.of("", "    "),
                Arguments.of(null, null));
    }

    @Test
    void counts_contended_slots() {
        // Simplest way to test this is with a duplicated expression.
        final var someSimpleExpr = "0 1 2 * * ? *";
        final var duplicatedExpression = someSimpleExpr + '\n' + someSimpleExpr;

        final var expectSimpleRecord =
                "02:01,2,1,2,\"" + someSimpleExpr + '"' + '\n';

        final var formParams =
                Map.of(
                        ContentionController.FORM_EXPRESSIONS,
                        duplicatedExpression);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .contentType(ContentionController.MEDIA_TYPE_CSV)
                .body(startsWith(CSV_HEADER))
                .body(containsString(expectSimpleRecord));
    }

    @Test
    void invalid_expression_is_bad_request_with_info() {
        final var bad1 = "invalid";
        final var bad2 = "x";

        final var expressions = bad1 + '\n' + bad2;
        final var formParams =
                singletonMap(
                        ContentionController.FORM_EXPRESSIONS, expressions);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST)
                .contentType(ContentType.JSON)
                .body("expressions[0].expr", is(bad1))
                .body("expressions[0].msg", is(not(emptyString())))
                .body("expressions[1].expr", is(bad2))
                .body("expressions[1].msg", is(not(emptyString())));
    }

    @Test
    void invalid_date_is_bad_request_with_info() {
        final String someBadDate = "foo";

        final var formParams =
                singletonMap(ContentionController.FORM_DATE, someBadDate);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST)
                .contentType(ContentType.JSON)
                .body("date.value", is(someBadDate))
                .body(
                        "date.msg",
                        allOf(
                                containsString("today"),
                                containsString("ISO 8601"),
                                containsString("YYYY-MM-DD")));
    }

    @Test
    void date_out_of_bounds_is_bad_request_with_info() {
        final String someFarAwayDate = "3000-12-31";

        final var formParams =
                singletonMap(ContentionController.FORM_DATE, someFarAwayDate);

        requestWith(formParams)
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST)
                .contentType(ContentType.JSON)
                .body("date.value", is(someFarAwayDate))
                .body(
                        "date.msg",
                        startsWith("Must not be later than 100 years"));
    }

    private static Response requestWith(final Map<String, String> formParams) {
        return given().contentType(ContentType.URLENC)
                .formParams(formParams)
                .when()
                .post(ContentionController.ENDPOINT);
    }
}
