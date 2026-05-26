package com.example.footballapi.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.HeaderParameter;
import io.swagger.v3.oas.models.parameters.Parameter;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Sistema RESTful para Gerenciamento de Futebol")
                        .version("1.0.0")
                        .description("API RESTful para gerenciamento de um domínio de futebol, contendo controle de " +
                                     "Jogadores, Times, Estádios, Ligas e Partidas. " +
                                     "Equipada com suporte HATEOAS, tratamento centralizado de erros, e recursos avançados " +
                                     "como Autenticação por Chave de API, Rate Limiting, Idempotência e Versionamento.")
                        .contact(new Contact()
                                .name("luizfelipe.rodrigu3s@gmail.com")
                                .email("luizfelipe.rodrigu3s@gmail.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")));
    }

    /**
     * Customizador OpenAPI global que adiciona cabeçalhos obrigatórios em todas as rotas (exceto nas de chave de API)
     * e registra os schemas comuns como ProblemDetail para que fiquem visíveis na UI.
     */
    @Bean
    public OpenApiCustomizer customerGlobalHeaderOpenApiCustomizer() {
        return openApi -> {
            // Registra os parâmetros de cabeçalhos no componente global para reuso
            openApi.getComponents().addParameters("X-API-Key", new HeaderParameter()
                    .name("X-API-Key")
                    .description("Chave de API necessária para autenticação (obter chave no endpoint público POST /api/keys)")
                    .required(true)
                    .schema(new Schema<String>().type("string")));

            openApi.getComponents().addParameters("X-Idempotency-Key", new HeaderParameter()
                    .name("X-Idempotency-Key")
                    .description("Chave de Idempotência necessária para operações POST (evita envios duplicados)")
                    .required(false)
                    .schema(new Schema<String>().type("string")));

            openApi.getComponents().addParameters("X-API-Version", new HeaderParameter()
                    .name("X-API-Version")
                    .description("Versão da API desejada (ex: v1 ou v2). Útil para o endpoint /player/search")
                    .required(false)
                    .schema(new Schema<String>().type("string")._default("v2")));

            // Aplica os parâmetros aos caminhos correspondentes
            openApi.getPaths().forEach((path, pathItem) -> {
                // Não exige autenticação de chave de API nos endpoints da própria chave
                boolean isKeyMgmt = path.startsWith("/api/keys");

                pathItem.readOperations().forEach(operation -> {
                    if (!isKeyMgmt) {
                        operation.addParametersItem(new HeaderParameter().$ref("#/components/parameters/X-API-Key"));
                        operation.addParametersItem(new HeaderParameter().$ref("#/components/parameters/X-API-Version"));
                    }
                    // Adiciona header de idempotência apenas para POST
                    if ("POST".equalsIgnoreCase(operation.getSummary()) || pathItem.getPost() == operation) {
                        if (!isKeyMgmt) {
                            operation.addParametersItem(new HeaderParameter().$ref("#/components/parameters/X-Idempotency-Key"));
                        }
                    }
                });
            });
        };
    }
}
