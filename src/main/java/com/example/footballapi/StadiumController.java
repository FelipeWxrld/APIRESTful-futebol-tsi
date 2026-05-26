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
@RequestMapping("/stadium")
@Tag(name = "Stadiums", description = "Gerenciamento de Estádios de Futebol")
public class StadiumController {

    private final StadiumRepository repository;
    private final StadiumModelAssembler assembler;
    private final PagedResourcesAssembler<Stadium> pagedAssembler;

    public StadiumController(StadiumRepository repository,
                             StadiumModelAssembler assembler,
                             PagedResourcesAssembler<Stadium> pagedAssembler) {
        this.repository = repository;
        this.assembler = assembler;
        this.pagedAssembler = pagedAssembler;
    }

    @GetMapping
    @Operation(summary = "Listar todos os estádios (Paginado)", 
               description = "Retorna uma lista paginada de todos os estádios cadastrados, com links de navegação HATEOAS.")
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso")
    @ApiResponse(responseCode = "401", description = "Chave de API inválida ou ausente", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public PagedModel<EntityModel<Stadium>> all(Pageable pageable) {
        Page<Stadium> stadiums = repository.findAll(pageable);
        return pagedAssembler.toModel(stadiums, assembler);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar estádio por ID", description = "Busca detalhes de um estádio de futebol específico a partir do seu identificador único.")
    @ApiResponse(responseCode = "200", description = "Estádio encontrado com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Estádio não encontrado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<Stadium> one(@PathVariable Long id) {
        Stadium stadium = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estádio não encontrado com o ID: " + id));
        return assembler.toModel(stadium);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar um novo estádio", description = "Cria um novo estádio com os dados fornecidos. Requer chave de API com permissão de escrita e cabeçalho de Idempotência.")
    @ApiResponse(responseCode = "201", description = "Estádio cadastrado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados de entrada inválidos", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "409", description = "Chave de idempotência repetida ou time proprietário já possui estádio associado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<Stadium> create(@Valid @RequestBody Stadium stadium) {
        Stadium saved = repository.save(stadium);
        return assembler.toModel(saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar estádio existente", description = "Atualiza os dados de um estádio de futebol com base no ID fornecido.")
    @ApiResponse(responseCode = "200", description = "Estádio atualizado com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Estádio não encontrado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public EntityModel<Stadium> update(@PathVariable Long id, @Valid @RequestBody Stadium newStadium) {
        return repository.findById(id)
                .map(stadium -> {
                    stadium.setName(newStadium.getName());
                    stadium.setCity(newStadium.getCity());
                    stadium.setCapacity(newStadium.getCapacity());
                    stadium.setType(newStadium.getType());
                    stadium.setTeam(newStadium.getTeam());
                    return assembler.toModel(repository.save(stadium));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Estádio não encontrado com o ID: " + id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir um estádio", description = "Remove permanentemente um estádio do banco de dados.")
    @ApiResponse(responseCode = "204", description = "Estádio removido com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "Estádio não encontrado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Não foi possível excluir. Estádio não encontrado com o ID: " + id);
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar estádios por nome", description = "Retorna uma lista de estádios filtrada por termos contidos no nome.")
    @ApiResponse(responseCode = "200", description = "Busca executada com sucesso")
    @ApiResponse(responseCode = "401", description = "Não autorizado", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "429", description = "Limite de taxa excedido", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    public List<EntityModel<Stadium>> search(@RequestParam String name) {
        return repository.findByNameContaining(name).stream()
                .map(assembler::toModel)
                .collect(Collectors.toList());
    }
}
