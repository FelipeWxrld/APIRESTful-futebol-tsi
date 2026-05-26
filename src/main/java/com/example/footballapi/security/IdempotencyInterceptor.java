package com.example.footballapi.security;

import com.example.footballapi.exception.BadRequestException;
import com.example.footballapi.exception.DuplicateResourceException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class IdempotencyInterceptor implements HandlerInterceptor {

    // Armazenamento em memória simples para fins de demonstração
    private final Map<String, String> processedKeys = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();

        // Ignorar caminhos de infraestrutura
        if (path.startsWith("/swagger-ui") || 
            path.startsWith("/v3/api-docs") || 
            path.startsWith("/h2-console") || 
            path.equals("/favicon.ico") ||
            path.equals("/")) {
            return true;
        }

        // Idempotência se aplica apenas a requisições POST de modificação (exceto geração de chaves)
        if ("POST".equalsIgnoreCase(request.getMethod()) && !path.startsWith("/api/keys")) {
            String idempotencyKey = request.getHeader("X-Idempotency-Key");

            if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
                throw new BadRequestException("O cabeçalho 'X-Idempotency-Key' é obrigatório para operações POST.");
            }

            if (processedKeys.containsKey(idempotencyKey)) {
                throw new DuplicateResourceException("Operação duplicada detectada. A chave de idempotência '" 
                        + idempotencyKey + "' já foi utilizada para processar uma requisição anterior.");
            }

            // Registrar a chave
            processedKeys.put(idempotencyKey, request.getRequestURI());
        }

        return true;
    }
}
