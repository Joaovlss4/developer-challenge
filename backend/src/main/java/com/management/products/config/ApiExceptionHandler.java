package com.management.products.config;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
		detail.setProperty("path", request.getRequestURI());
		detail.setProperty("timestamp", OffsetDateTime.now());
		detail.setProperty("errors", validationErrors(exception));
		return ResponseEntity.badRequest().body(detail);
	}

	@ExceptionHandler(ResponseStatusException.class)
	ResponseEntity<ProblemDetail> handleResponseStatus(ResponseStatusException exception, HttpServletRequest request) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(exception.getStatusCode(), exception.getReason());
		detail.setProperty("path", request.getRequestURI());
		detail.setProperty("timestamp", OffsetDateTime.now());
		return ResponseEntity.status(exception.getStatusCode()).body(detail);
	}

	@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
	ResponseEntity<ProblemDetail> handleOptimisticLocking(
		ObjectOptimisticLockingFailureException exception,
		HttpServletRequest request
	) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(
			HttpStatus.CONFLICT,
			"The request was changed by another operation. Please refresh and try again."
		);
		detail.setProperty("path", request.getRequestURI());
		detail.setProperty("timestamp", OffsetDateTime.now());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(detail);
	}

	private List<String> validationErrors(MethodArgumentNotValidException exception) {
		return exception.getBindingResult().getFieldErrors().stream()
			.map(this::formatFieldError)
			.toList();
	}

	private String formatFieldError(FieldError error) {
		return error.getField() + ": " + error.getDefaultMessage();
	}
}
