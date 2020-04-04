package io.gitlab.mkjeldsen.crontention;

import nl.jqno.equalsverifier.EqualsVerifier;
import org.junit.jupiter.api.Test;

final class ContentionCacheKeyTest {

    @Test
    void equals_contract() {
        EqualsVerifier.forClass(ContentionCacheKey.class).verify();
    }
}
