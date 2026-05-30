package com.management.products.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	private static final String BEARER_AUTH = "bearerAuth";

	@Bean
	OpenAPI purchaseRequestsOpenApi() {
		return new OpenAPI()
			.info(new Info()
				.title("Purchase Request Management API")
				.description("API for authentication and purchase request approval workflows.")
				.version("1.0.0")
				.contact(new Contact().name("Kingspan Recruitment Challenge"))
			)
			.components(new Components()
				.addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
					.name(BEARER_AUTH)
					.type(SecurityScheme.Type.HTTP)
					.scheme("bearer")
					.bearerFormat("JWT")
				)
			)
			.addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH));
	}
}
