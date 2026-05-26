package com.example.footballapi.security;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/keys")
@Tag(name = "API Key Management", description = "Endpoints públicos para geração e visualização de Chaves de API para teste")
public class ApiKeyController {

    private final ApiKeyRepository repository;

    public ApiKeyController(ApiKeyRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Gerar uma nova Chave de API", description = "Cria e retorna uma chave de API para o proprietário informado. Esta chave deve ser utilizada no cabeçalho X-API-Key.")
    @ApiResponse(responseCode = "201", description = "Chave criada com sucesso")
    public ApiKey generateKey(@RequestParam String owner, @RequestParam(defaultValue = "WRITE") String role) {
        String key = "key-" + UUID.randomUUID().toString();
        ApiKey apiKey = new ApiKey(key, owner, role);
        return repository.save(apiKey);
    }

    @GetMapping
    @Operation(summary = "Listar todas as Chaves de API registradas", description = "Endpoint útil para fins de depuração e visualização de chaves ativas para testes.")
    public List<ApiKey> listKeys() {
        return repository.findAll();
    }
}
