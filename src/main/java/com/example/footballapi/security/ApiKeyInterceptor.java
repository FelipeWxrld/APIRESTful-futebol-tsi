package com.example.footballapi.security;

import com.example.footballapi.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ApiKeyInterceptor implements HandlerInterceptor {

    private final ApiKeyRepository repository;

    public ApiKeyInterceptor(ApiKeyRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();

        // Ignorar caminhos públicos de documentação, console H2 e geração de chaves
        if (path.startsWith("/swagger-ui") || 
            path.startsWith("/v3/api-docs") || 
            path.startsWith("/h2-console") || 
            path.startsWith("/api/keys") || 
            path.equals("/favicon.ico") ||
            path.equals("/")) {
            return true;
        }

        String apiKeyHeader = request.getHeader("X-API-Key");
        if (apiKeyHeader == null || apiKeyHeader.trim().isEmpty()) {
            throw new UnauthorizedException("O cabeçalho 'X-API-Key' é obrigatório para acessar este endpoint.");
        }

        ApiKey apiKey = repository.findByKeyAndActiveTrue(apiKeyHeader)
                .orElseThrow(() -> new UnauthorizedException("Chave de API inválida ou inativa."));

        // Se for um método de escrita (POST, PUT, DELETE), podemos verificar o nível de acesso (role)
        String method = request.getMethod();
        if (("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method))
                && !"ADMIN".equalsIgnoreCase(apiKey.getRole()) && !"WRITE".equalsIgnoreCase(apiKey.getRole())) {
            throw new UnauthorizedException("Esta chave de API possui acesso de apenas leitura (READ) e não pode realizar operações de escrita.");
        }

        return true;
    }
}
