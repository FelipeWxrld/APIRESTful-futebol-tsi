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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/team")
@Tag(name = "Teams", description = "Gerenciamento de Times de Futebol")
public class TeamController {

    private final TeamRepository repository;
    private final TeamModelAssembler assembler;
    private final PagedResourcesAssembler<Team> pagedAssembler;

    public TeamController(TeamRepository repository,
                          TeamModelAssembler assembler,
                          PagedResourcesAssembler<Team> pagedAssembler) {

        this.repository = repository;
        this.assembler = assembler;
        this.pagedAssembler = pagedAssembler;
    }

    @GetMapping
    @Operation(
            summary = "Listar todos os times (Paginado)",
            description = "Retorna uma lista paginada de todos os times cadastrados, com links HATEOAS."
    )
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(
            responseCode = "401",
            description = "Chave de API inválida ou ausente",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
    )
    @ApiResponse(
            responseCode = "429",
            description = "Limite de taxa excedido",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
    )
    public PagedModel<EntityModel<Team>> all(Pageable pageable) {

        Page<Team> teams = repository.findAll(pageable);

        return pagedAssembler.toModel(teams, assembler);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Buscar time por ID",
            description = "Busca detalhes de um time específico pelo ID."
    )
    @ApiResponse(responseCode = "200", description = "Time encontrado com sucesso")
    @ApiResponse(
            responseCode = "404",
            description = "Time não encontrado",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
    )
    public EntityModel<Team> one(@PathVariable Long id) {

        Team team = repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Time não encontrado com ID: " + id
                        )
                );

        return assembler.toModel(team);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Cadastrar novo time",
            description = "Cria um novo time de futebol."
    )
    @ApiResponse(responseCode = "201", description = "Time criado com sucesso")
    public EntityModel<Team> create(@Valid @RequestBody Team team) {

        Team saved = repository.save(team);

        return assembler.toModel(saved);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Atualizar time",
            description = "Atualiza um time existente."
    )
    @ApiResponse(responseCode = "200", description = "Time atualizado com sucesso")
    @ApiResponse(
            responseCode = "404",
            description = "Time não encontrado",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
    )
    public EntityModel<Team> update(
            @PathVariable Long id,
            @Valid @RequestBody Team newTeam
    ) {

        return repository.findById(id)
                .map(team -> {

                    team.setName(newTeam.getName());
                    team.setCity(newTeam.getCity());
                    team.setCoach(newTeam.getCoach());

                    Team updated = repository.save(team);

                    return assembler.toModel(updated);
                })
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Time não encontrado com ID: " + id
                        )
                );
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Excluir time",
            description = "Remove um time do banco de dados."
    )
    @ApiResponse(responseCode = "204", description = "Time removido com sucesso")
    @ApiResponse(
            responseCode = "404",
            description = "Time não encontrado",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
    )
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        if (!repository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "Não foi possível excluir. Time não encontrado com ID: " + id
            );
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(
            summary = "Buscar times por nome",
            description = "Busca times contendo o nome informado."
    )
    @ApiResponse(responseCode = "200", description = "Busca realizada com sucesso")
    public List<EntityModel<Team>> search(@RequestParam String name) {

        return repository.findByNameContaining(name)
                .stream()
                .map(assembler::toModel)
                .collect(Collectors.toList());
    }
}