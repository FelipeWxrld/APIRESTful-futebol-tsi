package com.example.footballapi.security;

import com.example.footballapi.exception.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private static final int LIMIT = 15; // Limite de 15 requisições por minuto
    private static final int TIME_WINDOW_SEC = 60; // Janela de 60 segundos
    
    // Mapa em memória associando o cliente (IP ou API Key) ao timestamp de reset e contagem
    private final Map<String, ClientRateLimit> clientRequests = new ConcurrentHashMap<>();

    private static class ClientRateLimit {
        final long resetTime;
        final AtomicInteger count = new AtomicInteger(0);

        ClientRateLimit(long resetTime) {
            this.resetTime = resetTime;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > resetTime;
        }
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();

        // Ignorar caminhos que não correspondem aos endpoints de negócio e chaves da API
        // Isso impede que carregamentos de CSS/JS/HTML consumam a cota de rate limit do usuário.
        if (!path.startsWith("/league") &&
            !path.startsWith("/match") &&
            !path.startsWith("/player") &&
            !path.startsWith("/stadium") &&
            !path.startsWith("/team") &&
            !path.startsWith("/api/keys")) {
            return true;
        }

        // Identificar cliente por API Key (se presente) ou por IP
        String clientKey = request.getHeader("X-API-Key");
        if (clientKey == null || clientKey.trim().isEmpty()) {
            clientKey = request.getRemoteAddr();
        }

        long now = System.currentTimeMillis();
        ClientRateLimit rateLimit = clientRequests.compute(clientKey, (key, current) -> {
            if (current == null || current.isExpired()) {
                return new ClientRateLimit(now + (TIME_WINDOW_SEC * 1000L));
            }
            return current;
        });

        int requestsMade = rateLimit.count.incrementAndGet();
        long secondsRemaining = Math.max(0, (rateLimit.resetTime - now) / 1000);

        response.setHeader("X-Rate-Limit-Limit", String.valueOf(LIMIT));
        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(Math.max(0, LIMIT - requestsMade)));
        response.setHeader("X-Rate-Limit-Reset", String.valueOf(secondsRemaining));

        if (requestsMade > LIMIT) {
            response.setHeader("Retry-After", String.valueOf(secondsRemaining > 0 ? secondsRemaining : 1));
            throw new RateLimitExceededException("Limite de taxa de requisições excedido. Limite: " 
                    + LIMIT + " por minuto. Tente novamente em alguns segundos.");
        }

        return true;
    }
}
