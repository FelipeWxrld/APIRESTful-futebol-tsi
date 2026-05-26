package com.example.footballapi.config;

import com.example.footballapi.security.ApiKeyInterceptor;
import com.example.footballapi.security.IdempotencyInterceptor;
import com.example.footballapi.security.RateLimitingInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitingInterceptor rateLimitingInterceptor;
    private final ApiKeyInterceptor apiKeyInterceptor;
    private final IdempotencyInterceptor idempotencyInterceptor;

    public WebMvcConfig(RateLimitingInterceptor rateLimitingInterceptor,
                        ApiKeyInterceptor apiKeyInterceptor,
                        IdempotencyInterceptor idempotencyInterceptor) {
        this.rateLimitingInterceptor = rateLimitingInterceptor;
        this.apiKeyInterceptor = apiKeyInterceptor;
        this.idempotencyInterceptor = idempotencyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Rate limiting deve ser o primeiro a executar para proteger o sistema
        registry.addInterceptor(rateLimitingInterceptor)
                .addPathPatterns("/**");

        // Autenticação da chave de API
        registry.addInterceptor(apiKeyInterceptor)
                .addPathPatterns("/**");

        // Verificação de idempotência para criação de recursos
        registry.addInterceptor(idempotencyInterceptor)
                .addPathPatterns("/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:8080", "http://localhost:4200") // Origens comuns de desenvolvimento
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                .allowedHeaders("X-API-Key", "X-Idempotency-Key", "X-API-Version", "Content-Type", "Authorization", "Accept")
                .exposedHeaders("X-Rate-Limit-Limit", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset", "Retry-After")
                .allowCredentials(true)
                .maxAge(3600); // 1 hora de cache do preflight request CORS
    }
}
