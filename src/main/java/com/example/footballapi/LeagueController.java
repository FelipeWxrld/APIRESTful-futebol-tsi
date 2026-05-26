package com.example.footballapi;

import com.example.footballapi.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/league")
@Tag(name = "Leagues", description = "Gerenciamento de Ligas de Futebol")
public class LeagueController {

    private final LeagueRepository repository;
    private final LeagueModelAssembler assembler;
    private final PagedResourcesAssembler<League> pagedAssembler;

    public LeagueController(LeagueRepository repository,
                            LeagueModelAssembler assembler,
                            PagedResourcesAssembler<League> pagedAssembler) {
        this.repository = repository;
        this.assembler = assembler;
        this.pagedAssembler = pagedAssembler;
    }

    @GetMapping
    @Operation(summary = "Listar todas as ligas (Paginado)", 
               description = "Retorna uma lista paginada de todas as ligas cadastradas, com links de navegação HATEOAS.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "401", description = "Chave de API inválida ou ausente", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public PagedModel<EntityModel<League>> all(Pageable pageable) {
        Page<League> leagues = repository.findAll(pageable);
        return pagedAssembler.toModel(leagues, assembler);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar liga por ID", description = "Busca detalhes de uma liga específica a partir do seu identificador único.")
    @ApiResponse(responseCode = "200", description = "Liga encontrada com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Liga não encontrada", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<League> one(@PathVariable Long id) {
        League league = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Liga não encontrada com o ID: " + id));
        return assembler.toModel(league);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar uma nova liga", description = "Cria uma nova liga com os dados fornecidos. Requer chave de API com permissão de escrita e cabeçalho de Idempotência.")
    @ApiResponse(responseCode = "201", description = "Liga cadastrada com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados de entrada inválidos", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "409", description = "Chave de idempotência repetida", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<League> create(@Valid @RequestBody League league) {
        League saved = repository.save(league);
        return assembler.toModel(saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar liga existente", description = "Atualiza os dados de uma liga de futebol com base no ID fornecido.")
    @ApiResponse(responseCode = "200", description = "Liga atualizada com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Liga não encontrada", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<League> update(@PathVariable Long id, @Valid @RequestBody League newLeague) {
        return repository.findById(id)
                .map(league -> {
                    league.setName(newLeague.getName());
                    league.setCountry(newLeague.getCountry());
                    league.setLevel(newLeague.getLevel());
                    league.setTeams(newLeague.getTeams());
                    return assembler.toModel(repository.save(league));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Liga não encontrada com o ID: " + id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir uma liga", description = "Remove permanentemente uma liga do banco de dados.")
    @ApiResponse(responseCode = "204", description = "Liga removida com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Liga não encontrada", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Não foi possível excluir. Liga não encontrada com o ID: " + id);
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar ligas por nome", description = "Retorna uma lista de ligas filtrada por termos contidos no nome.")
    @ApiResponse(responseCode = "200", description = "Busca executada com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public List<EntityModel<League>> search(@RequestParam String name) {
        return repository.findByNameContaining(name).stream()
                .map(assembler::toModel)
                .collect(Collectors.toList());
    }
}
