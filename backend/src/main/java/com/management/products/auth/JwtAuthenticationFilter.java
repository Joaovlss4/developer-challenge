package com.management.products.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final Logger LOGGER = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

	private final JwtService jwtService;
	private final AuthUserDetailsService userDetailsService;

	public JwtAuthenticationFilter(JwtService jwtService, AuthUserDetailsService userDetailsService) {
		this.jwtService = jwtService;
		this.userDetailsService = userDetailsService;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {
		if (SecurityContextHolder.getContext().getAuthentication() != null) {
			filterChain.doFilter(request, response);
			return;
		}

		String authHeader = request.getHeader("Authorization");

		if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		String token = authHeader.substring(7);
		try {
			String email = jwtService.extractSubject(token);
			if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
				AuthUserDetails userDetails = (AuthUserDetails) userDetailsService.loadUserByUsername(email);
				if (jwtService.isValid(token, userDetails)) {
					UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
						userDetails,
						null,
						userDetails.getAuthorities()
					);
					authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
					SecurityContextHolder.getContext().setAuthentication(authentication);
				}
			}
		} catch (RuntimeException exception) {
			LOGGER.debug("JWT authentication failed: {}", exception.getMessage());
			SecurityContextHolder.clearContext();
		}

		filterChain.doFilter(request, response);
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getServletPath();
		return isPublicAuthEndpoint(request, path)
			|| path.startsWith("/swagger-ui")
			|| path.startsWith("/v3/api-docs");
	}

	private boolean isPublicAuthEndpoint(HttpServletRequest request, String path) {
		return "POST".equals(request.getMethod())
			&& "/auth/login".equals(path);
	}
}
