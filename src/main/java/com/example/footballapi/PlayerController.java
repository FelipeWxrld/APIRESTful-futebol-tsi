package com.example.footballapi;

import com.example.footballapi.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/player")
@Tag(name = "Players", description = "Gerenciamento de Jogadores de Futebol")
public class PlayerController {

    private final PlayerRepository repository;
    private final PlayerModelAssembler assembler;
    private final PagedResourcesAssembler<Player> pagedAssembler;

    public PlayerController(PlayerRepository repository,
                            PlayerModelAssembler assembler,
                            PagedResourcesAssembler<Player> pagedAssembler) {
        this.repository = repository;
        this.assembler = assembler;
        this.pagedAssembler = pagedAssembler;
    }

    @GetMapping
    @Operation(summary = "Listar todos os jogadores (Paginado)", 
               description = "Retorna uma lista paginada de todos os jogadores cadastrados, incluindo links de navegação HATEOAS.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "401", description = "Chave de API ausente ou inválida", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public PagedModel<EntityModel<Player>> all(Pageable pageable) {
        Page<Player> players = repository.findAll(pageable);
        return pagedAssembler.toModel(players, assembler);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar jogador por ID", description = "Busca os detalhes de um jogador específico a partir do seu identificador único.")
    @ApiResponse(responseCode = "200", description = "Jogador encontrado com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Jogador não encontrado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<Player> one(@PathVariable Long id) {
        Player player = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado com o ID: " + id));
        return assembler.toModel(player);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar um novo jogador", description = "Cria um novo jogador com os dados fornecidos. Requer chave de API com permissão de escrita e cabeçalho de Idempotência.")
    @ApiResponse(responseCode = "201", description = "Jogador cadastrado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados de entrada inválidos", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "409", description = "Conflito / Chave de idempotência já utilizada", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<Player> create(@Valid @RequestBody Player player) {
        Player saved = repository.save(player);
        return assembler.toModel(saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar jogador existente", description = "Atualiza os dados de um jogador com base no ID fornecido.")
    @ApiResponse(responseCode = "200", description = "Jogador atualizado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou inconsistentes", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Jogador não encontrado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<Player> update(@PathVariable Long id, @Valid @RequestBody Player newPlayer) {
        return repository.findById(id)
                .map(player -> {
                    player.setName(newPlayer.getName());
                    player.setAge(newPlayer.getAge());
                    player.setPosition(newPlayer.getPosition());
                    player.setNumber(newPlayer.getNumber());
                    player.setTeam(newPlayer.getTeam());
                    return assembler.toModel(repository.save(player));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado com o ID: " + id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir um jogador", description = "Remove permanentemente um jogador do banco de dados.")
    @ApiResponse(responseCode = "204", description = "Jogador removido com sucesso (Sem conteúdo)")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Jogador não encontrado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Não foi possível excluir. Jogador não encontrado com o ID: " + id);
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // VERSIONAMENTO DE API (X-API-Version)
    // ==========================================

    @GetMapping(value = "/search", headers = "X-API-Version=v1")
    @Operation(summary = "Buscar jogadores por parte do nome - V1 (Legado)", 
               description = "Retorna uma lista simples de jogadores que contêm o termo informado no nome. Versão 1.")
    @ApiResponse(responseCode = "200", description = "Busca executada com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public List<Player> searchV1(@RequestParam String name) {
        return repository.findByNameContaining(name);
    }

    @GetMapping(value = "/search", headers = "X-API-Version=v2")
    @Operation(summary = "Buscar jogadores por parte do nome - V2 (Enriquecida HATEOAS)", 
               description = "Retorna uma lista contendo representações enriquecidas com links HATEOAS dos jogadores correspondentes. Versão 2.")
    @ApiResponse(responseCode = "200", description = "Busca executada com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public List<EntityModel<Player>> searchV2(@RequestParam String name) {
        return repository.findByNameContaining(name).stream()
                .map(assembler::toModel)
                .collect(Collectors.toList());
    }
}
