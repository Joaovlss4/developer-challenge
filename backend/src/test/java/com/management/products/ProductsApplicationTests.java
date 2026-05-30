package com.management.products;

import static org.assertj.core.api.Assertions.assertThatCode;

import org.junit.jupiter.api.Test;

class ProductsApplicationTests {

	@Test
	void applicationClassCanBeInstantiated() {
		assertThatCode(ProductsApplication::new)
			.doesNotThrowAnyException();
	}

}
